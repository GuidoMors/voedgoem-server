import { DurableObject } from "cloudflare:workers";
import type { Env } from "./env";
import { GAMES } from "./games";

type Phase = "lobby" | "playing" | "results";

interface Player {
  id: string;
  username: string;
  alive: boolean;
  score: number;
  lines: number;
  level: number;
  board: string;
  order: number;
}

interface State {
  game: string;
  name: string;
  hostId: string;
  hostName: string;
  phase: Phase;
  seed: number;
  round: number;
  startedAt: number;
  nextOrder: number;
  players: Record<string, Player>;
  results: Player[];
}

interface Attachment {
  userId: string;
  username: string;
}

const BOARD_PATTERN = /^[0-7]{200}$/;
const MAX_MESSAGE_LENGTH = 1000;
const MIN_UPDATE_INTERVAL_MS = 60;

const clampInt = (value: unknown, max: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : 0;

export class Lobby extends DurableObject<Env> {
  private state: State | null = null;
  private lastUpdate = new Map<string, number>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.state = (await ctx.storage.get<State>("state")) ?? null;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/close") {
      for (const ws of this.ctx.getWebSockets()) {
        try { ws.close(1000, "Lobby closed"); } catch { /* already closed */ }
      }
      await this.ctx.storage.deleteAll();
      this.state = null;
      return new Response(null, { status: 204 });
    }

    if (request.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket upgrade.", { status: 426 });

    const userId = request.headers.get("x-user-id");
    const username = request.headers.get("x-username");
    if (!userId || !username) return new Response("Unauthorized", { status: 401 });

    if (!this.state) {
      this.state = {
        game: request.headers.get("x-lobby-game") ?? "tetris",
        name: request.headers.get("x-lobby-name") ?? "Lobby",
        hostId: request.headers.get("x-host-id") ?? userId,
        hostName: request.headers.get("x-host-name") ?? username,
        phase: "lobby",
        seed: 0,
        round: 0,
        startedAt: 0,
        nextOrder: 0,
        players: {},
        results: []
      };
      await this.save();
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ userId, username } satisfies Attachment);
    this.broadcast();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const state = this.state;
    if (!state || typeof raw !== "string" || raw.length > MAX_MESSAGE_LENGTH) return;
    const who = ws.deserializeAttachment() as Attachment | null;
    if (!who) return;

    let message: Record<string, unknown>;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) return;
      message = parsed as Record<string, unknown>;
    } catch {
      return;
    }

    const me = state.players[who.userId];
    const isHost = who.userId === state.hostId;

    switch (message.type) {
      case "join": {
        const max = GAMES[state.game]?.maxPlayers ?? 8;
        if (state.phase !== "lobby" || me || Object.keys(state.players).length >= max) return;
        state.players[who.userId] = { id: who.userId, username: who.username, alive: true, score: 0, lines: 0, level: 1, board: "", order: state.nextOrder++ };
        break;
      }
      case "leave": {
        if (!me) return;
        if (state.phase === "lobby") delete state.players[who.userId];
        else if (state.phase === "playing" && me.alive) me.alive = false;
        else return;
        break;
      }
      case "start": {
        if (!isHost || state.phase !== "lobby" || Object.keys(state.players).length === 0) return;
        state.phase = "playing";
        state.seed = crypto.getRandomValues(new Uint32Array(1))[0];
        state.round += 1;
        state.startedAt = Date.now();
        for (const player of Object.values(state.players)) Object.assign(player, { alive: true, score: 0, lines: 0, level: 1, board: "" });
        break;
      }
      case "state": {
        if (state.phase !== "playing" || !me?.alive) return;
        const now = Date.now();
        if (now - (this.lastUpdate.get(me.id) ?? 0) < MIN_UPDATE_INTERVAL_MS) return;
        if (typeof message.board !== "string" || !BOARD_PATTERN.test(message.board)) return;
        this.lastUpdate.set(me.id, now);
        Object.assign(me, { board: message.board, score: clampInt(message.score, 99_999_999), lines: clampInt(message.lines, 99_999), level: Math.max(1, clampInt(message.level, 99)) });
        this.broadcast();
        return;
      }
      case "gameover": {
        if (state.phase !== "playing" || !me?.alive) return;
        Object.assign(me, { alive: false, score: clampInt(message.score, 99_999_999), lines: clampInt(message.lines, 99_999), level: Math.max(1, clampInt(message.level, 99)) });
        break;
      }
      case "exit": {
        if (!isHost || state.phase !== "results") return;
        state.phase = "lobby";
        state.players = {};
        state.results = [];
        state.nextOrder = 0;
        break;
      }
      default:
        return;
    }

    this.finishIfOver();
    await this.save();
    this.broadcast();
  }

  async webSocketClose(ws: WebSocket, code: number): Promise<void> {
    try { ws.close(code === 1005 ? 1000 : code, "closing"); } catch { /* already closed */ }
    await this.handleDisconnect(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.handleDisconnect(ws);
  }

  private async handleDisconnect(closing: WebSocket) {
    const state = this.state;
    const who = closing.deserializeAttachment() as Attachment | null;
    if (state && who && !this.connectedUserIds(closing).has(who.userId)) {
      const player = state.players[who.userId];
      if (player) {
        if (state.phase === "lobby") delete state.players[who.userId];
        else if (state.phase === "playing" && player.alive) player.alive = false;
        this.finishIfOver();
        await this.save();
      }
    }
    this.broadcast(closing);
  }

  private finishIfOver() {
    const state = this.state;
    if (!state || state.phase !== "playing") return;
    if (Object.values(state.players).some(player => player.alive)) return;
    state.phase = "results";
    state.results = Object.values(state.players).sort((a, b) => b.score - a.score || b.lines - a.lines || a.order - b.order);
  }

  private connectedUserIds(exclude?: WebSocket) {
    const ids = new Map<string, string>();
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude || ws.readyState !== WebSocket.READY_STATE_OPEN) continue;
      const who = ws.deserializeAttachment() as Attachment | null;
      if (who) ids.set(who.userId, who.username);
    }
    return ids;
  }

  private snapshot(exclude?: WebSocket) {
    const state = this.state!;
    const connected = this.connectedUserIds(exclude);
    const showBoards = state.phase !== "lobby";
    const players = Object.values(state.players).sort((a, b) => a.order - b.order);
    return {
      type: "snapshot",
      game: state.game,
      name: state.name,
      host: { id: state.hostId, name: state.hostName },
      phase: state.phase,
      seed: state.seed,
      round: state.round,
      maxPlayers: GAMES[state.game]?.maxPlayers ?? 8,
      players: players.map(({ id, username, alive, score, lines, level, board }) => ({
        id, username, alive, score, lines, level, connected: connected.has(id), board: showBoards ? board : ""
      })),
      spectators: [...connected].filter(([id]) => !state.players[id]).map(([id, username]) => ({ id, username })),
      results: state.phase === "results" ? state.results.map(({ id, username, score, lines, level }) => ({ id, username, score, lines, level })) : []
    };
  }

  private broadcast(exclude?: WebSocket) {
    if (!this.state) return;
    const data = JSON.stringify(this.snapshot(exclude));
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude || ws.readyState !== WebSocket.READY_STATE_OPEN) continue;
      try { ws.send(data); } catch { /* socket is going away */ }
    }
  }

  private async save() {
    await this.ctx.storage.put("state", this.state);
  }
}
