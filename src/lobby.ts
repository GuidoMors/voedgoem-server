import { DurableObject } from "cloudflare:workers";
import { parseStoredAvatar, type Avatar } from "./avatar";
import type { Env } from "./env";
import { DISPLAY_VIEWER } from "./viewer";
import { MODULES } from "./games/registry";

interface Bot {
  id: string;
  username: string;
}

interface State {
  game: string;
  name: string;
  hostId: string;
  hostName: string;
  data: unknown;
  bots?: Bot[];
  nextBot?: number;
  // Avatars of people who connected, so players keep theirs while temporarily offline.
  avatars?: Record<string, Avatar>;
}

interface Attachment {
  userId: string;
  username: string;
  isAdmin?: boolean;
  isDisplay?: boolean;
}

const MAX_BOTS = 20;

const MAX_MESSAGE_LENGTH = 1000;
const VOLATILE_BROADCAST_MS = 100;

export class Lobby extends DurableObject<Env> {
  private state: State | null = null;
  private lastVolatileBroadcast = 0;
  private volatileTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(() => this.load());
  }

  private tickTimer: ReturnType<typeof setTimeout> | null = null;
  private tickDue = 0;

  // Games with a real-time loop (e.g. team Tetris gravity) are ticked from here while they ask for it.
  private scheduleTick() {
    const state = this.state;
    if (!state) return;
    const wait = this.module().tickMs?.(state.data);
    if (wait == null) return;
    // Keep a pending timer unless the game now needs a tick sooner.
    if (this.tickTimer) {
      if (this.tickDue <= Date.now() + wait) return;
      clearTimeout(this.tickTimer);
    }
    this.tickDue = Date.now() + wait;
    this.tickTimer = setTimeout(() => {
      this.tickTimer = null;
      void this.runTick();
    }, wait);
  }

  private async runTick() {
    const state = this.state;
    if (!state) return;
    const outcome = this.module().tick?.(state.data);
    if (outcome === "save") await this.commit();
    else if (outcome === "volatile") this.broadcastThrottled();
    this.scheduleTick();
  }

  private async load() {
    const ctx = this.ctx;
    {
      const stored = await ctx.storage.get<any>("state");
      if (!stored) return;
      if ("data" in stored) {
        this.state = stored as State;
      } else {
        // Lobbies created before multiple games existed stored Tetris state flat.
        const { game, name, hostId, hostName, ...data } = stored;
        this.state = { game, name, hostId, hostName, data };
      }
      if (this.state) MODULES[this.state.game]?.migrate?.(this.state.data);
    }
    this.scheduleTick();
  }

  private module() {
    return MODULES[this.state?.game ?? ""] ?? MODULES.tetris;
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
      const game = request.headers.get("x-lobby-game") ?? "tetris";
      if (!MODULES[game]) return new Response("Unknown game", { status: 400 });
      this.state = {
        game,
        name: request.headers.get("x-lobby-name") ?? "Lobby",
        hostId: request.headers.get("x-host-id") ?? userId,
        hostName: request.headers.get("x-host-name") ?? username,
        data: MODULES[game].create()
      };
      await this.save();
    }

    const isDisplay = request.headers.get("x-is-display") === "1";
    const avatar = isDisplay ? null : parseStoredAvatar(request.headers.get("x-avatar"));
    const avatars = (this.state.avatars ??= {});
    if (isDisplay) { /* displays only watch */ }
    else if (avatar) avatars[userId] = avatar;
    else delete avatars[userId];
    await this.save();

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ userId, username, isAdmin: request.headers.get("x-is-admin") === "1", isDisplay } satisfies Attachment);
    this.broadcast();
    this.broadcastAvatars();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const state = this.state;
    if (!state || typeof raw !== "string" || raw.length > MAX_MESSAGE_LENGTH) return;
    const who = ws.deserializeAttachment() as Attachment | null;
    if (!who || who.isDisplay) return;

    let message: Record<string, unknown>;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) return;
      message = parsed as Record<string, unknown>;
    } catch {
      return;
    }

    const game = this.module();
    const hostId = state.hostId;
    const context = () => ({ connected: this.connectedUserIds() });

    // Admin-only testing tools: manage bots and act on their behalf.
    if (message.type === "bot:add" || message.type === "bot:remove" || message.type === "bot:act") {
      if (!who.isAdmin) return;
      const bots = (state.bots ??= []);
      if (message.type === "bot:add") {
        if (bots.length >= MAX_BOTS) {
          try { ws.send(JSON.stringify({ type: "error", message: `At most ${MAX_BOTS} bots.` })); } catch { /* socket is going away */ }
          return;
        }
        const number = (state.nextBot = (state.nextBot ?? 0) + 1);
        bots.push({ id: `bot-${number}`, username: `Bot ${number}` });
      } else {
        const bot = bots.find(item => item.id === message.botId);
        if (!bot) return;
        if (message.type === "bot:remove") {
          state.bots = bots.filter(item => item.id !== bot.id);
          game.disconnect(state.data, bot.id);
        } else {
          const inner = message.message;
          if (typeof inner !== "object" || inner === null || Array.isArray(inner)) return;
          const outcome = game.handle(state.data, { userId: bot.id, username: bot.username, isHost: false }, inner as Record<string, unknown>, context());
          if (outcome === "ignore") return;
          if (typeof outcome === "object") {
            try { ws.send(JSON.stringify({ type: "error", message: `${bot.username}: ${outcome.error}` })); } catch { /* socket is going away */ }
            return;
          }
          if (outcome === "volatile") {
            this.broadcastThrottled();
            return;
          }
        }
      }
      await this.commit();
      return;
    }

    const outcome = game.handle(state.data, { userId: who.userId, username: who.username, isHost: who.userId === hostId }, message, context());
    if (outcome === "ignore") return;
    if (typeof outcome === "object") {
      try { ws.send(JSON.stringify({ type: "error", message: outcome.error })); } catch { /* socket is going away */ }
      return;
    }
    if (outcome === "volatile") {
      this.broadcastThrottled();
      return;
    }
    await this.commit();
  }

  // Saves, stores a just-finished game's results for statistics (humans only), then broadcasts.
  private async commit() {
    const state = this.state;
    const result = state ? this.module().takeResult?.(state.data) : null;
    await this.save();
    if (state && result) {
      const humans = result.players.filter(player => !player.userId.startsWith("bot-"));
      try {
        if (humans.length) {
          await this.env.DB.batch(humans.map(player =>
            this.env.DB.prepare(`INSERT INTO "gameResults" ("game", "userId", "role", "won", "flag", "score", "extra") VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`)
              .bind(state.game, player.userId, player.role, player.won ? 1 : 0, player.flag ? 1 : 0, player.score ?? 0, player.extra ?? 0)));
        }
      } catch (error) {
        console.error("Could not store game results", error);
      }
    }
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
      if (this.module().disconnect(state.data, who.userId)) await this.save();
    }
    this.broadcast(closing);
  }

  private connectedUserIds(exclude?: WebSocket) {
    const ids = new Map<string, string>();
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude || ws.readyState !== WebSocket.READY_STATE_OPEN) continue;
      const who = ws.deserializeAttachment() as Attachment | null;
      if (who && !who.isDisplay) ids.set(who.userId, who.username);
    }
    for (const bot of this.state?.bots ?? []) ids.set(bot.id, bot.username);
    return ids;
  }

  private broadcastThrottled() {
    const gap = this.module().volatileMs ?? VOLATILE_BROADCAST_MS;
    const wait = gap - (Date.now() - this.lastVolatileBroadcast);
    if (wait <= 0) {
      this.broadcast();
    } else if (!this.volatileTimer) {
      this.volatileTimer = setTimeout(() => {
        this.volatileTimer = null;
        this.broadcast();
      }, wait);
    }
  }

  private broadcast(exclude?: WebSocket) {
    const state = this.state;
    if (!state) return;
    this.scheduleTick();
    this.lastVolatileBroadcast = Date.now();
    const game = this.module();
    const connected = this.connectedUserIds(exclude);
    const participants = game.participants(state.data);
    const spectators = [...connected].filter(([id]) => !participants.has(id)).map(([id, username]) => ({ id, username }));
    const connectedIds = new Set(connected.keys());
    const shared = {
      type: "snapshot",
      game: state.game,
      name: state.name,
      host: { id: state.hostId, name: state.hostName },
      maxPlayers: game.info.maxPlayers,
      spectators,
      bots: state.bots ?? []
    };

    let cached: string | null = null;
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude || ws.readyState !== WebSocket.READY_STATE_OPEN) continue;
      const who = ws.deserializeAttachment() as Attachment | null;
      let data: string | null = null;
      if (who?.isDisplay) {
        // Displays get the spectator view and never count as connected players.
        data = JSON.stringify({ ...shared, ...game.snapshot(state.data, DISPLAY_VIEWER, connectedIds) });
      } else if (who?.isAdmin && state.bots?.length) {
        // Admins also receive each bot's own view so they can play as them.
        const botViews = Object.fromEntries(state.bots.map(bot => [bot.id, game.snapshot(state.data, bot.id, connectedIds)]));
        data = JSON.stringify({ ...shared, ...game.snapshot(state.data, who.userId, connectedIds), botViews });
      } else {
        data = cached;
        if (!data) {
          data = JSON.stringify({ ...shared, ...game.snapshot(state.data, who?.userId ?? "", connectedIds) });
          if (!game.perViewer) cached = data;
        }
      }
      try { ws.send(data); } catch { /* socket is going away */ }
    }
  }

  // Sent separately from snapshots, which are broadcast often and would otherwise carry every avatar each time.
  private broadcastAvatars() {
    const state = this.state;
    if (!state?.avatars) return;
    const relevant = new Set([...this.connectedUserIds().keys(), ...this.module().participants(state.data)]);
    for (const id of Object.keys(state.avatars)) if (!relevant.has(id)) delete state.avatars[id];
    const data = JSON.stringify({ type: "avatars", avatars: state.avatars });
    for (const ws of this.ctx.getWebSockets()) {
      if (ws.readyState !== WebSocket.READY_STATE_OPEN) continue;
      try { ws.send(data); } catch { /* socket is going away */ }
    }
  }

  private async save() {
    await this.ctx.storage.put("state", this.state);
  }
}
