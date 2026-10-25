import type { GameModule } from "../types";
import { ACTIONS, ROWS, act, createTeam, ghostOf, pieceCells, removeMember, teamLevel, tickTeam, upcoming, type Action, type Team } from "./team";

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
  // Lobby team (0-based) when the game is played in teams; null for solo.
  team?: number | null;
}

export interface TetrisState {
  phase: Phase;
  seed: number;
  round: number;
  nextOrder: number;
  players: Record<string, Player>;
  results: Player[];
  // 0 = everyone plays their own board; otherwise the number of teams sharing a board each.
  teamCount: number;
  teams: Team[];
  teamResults: { index: number; score: number; lines: number; level: number; members: { id: string; username: string }[] }[];
  recorded?: boolean;
}

export const MAX_TEAMS = 8;
const TICK_MS = 50;

const BOARD_PATTERN = /^[0-7]{200}$/;
const MIN_UPDATE_INTERVAL_MS = 60;
const lastUpdates = new WeakMap<TetrisState, Map<string, number>>();

const clampInt = (value: unknown, max: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : 0;

function finishIfOver(state: TetrisState) {
  if (state.phase !== "playing") return;
  if (state.teamCount > 0) {
    if (state.teams.some(team => team.alive)) return;
    state.phase = "results";
    state.teamResults = [...state.teams]
      .sort((a, b) => b.score - a.score || b.lines - a.lines || a.index - b.index)
      .map(team => ({
        index: team.index, score: team.score, lines: team.lines, level: teamLevel(team),
        members: team.memberIds.map(id => ({ id, username: state.players[id]?.username ?? "Player" }))
      }));
    return;
  }
  if (Object.values(state.players).some(player => player.alive)) return;
  state.phase = "results";
  state.results = Object.values(state.players).sort((a, b) => b.score - a.score || b.lines - a.lines || a.order - b.order);
}

function smallestTeam(state: TetrisState) {
  const sizes = Array<number>(state.teamCount).fill(0);
  for (const player of Object.values(state.players)) if (typeof player.team === "number" && player.team < state.teamCount) sizes[player.team]++;
  return sizes.indexOf(Math.min(...sizes));
}

function shuffled<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function dropPlayer(state: TetrisState, player: Player) {
  player.alive = false;
  const team = state.teams.find(item => item.memberIds.includes(player.id));
  if (team) removeMember(team, player.id);
}

export const tetris: GameModule<TetrisState> = {
  info: {
    id: "tetris",
    name: "Tetris",
    description: "Play your own board, or split into teams that share one wide board. The round lasts until everyone tops out.",
    maxPlayers: 20
  },
  perViewer: false,
  volatileMs: 40,

  create: () => ({ phase: "lobby", seed: 0, round: 0, nextOrder: 0, players: {}, results: [], teamCount: 0, teams: [], teamResults: [] }),

  migrate(state) {
    state.teamCount ??= 0;
    state.teams ??= [];
    state.teamResults ??= [];
  },

  tickMs: state => (state.phase === "playing" && state.teamCount > 0 && state.teams.some(team => team.alive) ? TICK_MS : null),

  tick(state) {
    let change = "none";
    for (const team of state.teams) {
      const result = tickTeam(team, Date.now());
      if (result === "locked" || (result === "moved" && change === "none")) change = result;
    }
    const before = state.phase;
    finishIfOver(state);
    if (state.phase !== before || change === "locked") return "save";
    return change === "moved" ? "volatile" : "ignore";
  },

  handle(state, actor, message) {
    const me = state.players[actor.userId];

    switch (message.type) {
      case "config": {
        if (!actor.isHost || state.phase !== "lobby") return "ignore";
        const { teams } = message;
        if (typeof teams !== "number" || !Number.isInteger(teams) || teams < 0 || teams > MAX_TEAMS) return { error: `Teams must be between 0 and ${MAX_TEAMS}.` };
        state.teamCount = teams;
        for (const player of Object.values(state.players).sort((a, b) => a.order - b.order)) {
          player.team = null;
          if (teams > 0) player.team = smallestTeam(state);
        }
        break;
      }
      case "join":
        if (state.phase !== "lobby" || me || Object.keys(state.players).length >= tetris.info.maxPlayers) return "ignore";
        state.players[actor.userId] = { id: actor.userId, username: actor.username, alive: true, score: 0, lines: 0, level: 1, board: "", order: state.nextOrder++, team: null };
        if (state.teamCount > 0) {
          const wanted = message.team;
          state.players[actor.userId].team = typeof wanted === "number" && Number.isInteger(wanted) && wanted >= 0 && wanted < state.teamCount ? wanted : smallestTeam(state);
        }
        break;
      case "team": {
        const { team } = message;
        if (state.phase !== "lobby" || !me || state.teamCount === 0) return "ignore";
        if (typeof team !== "number" || !Number.isInteger(team) || team < 0 || team >= state.teamCount) return "ignore";
        me.team = team;
        break;
      }
      case "shuffle": {
        if (!actor.isHost || state.phase !== "lobby" || state.teamCount === 0) return "ignore";
        shuffled(Object.values(state.players)).forEach((player, index) => { player.team = index % state.teamCount; });
        break;
      }
      case "kick": {
        const target = typeof message.userId === "string" ? state.players[message.userId] : undefined;
        if (!actor.isHost || state.phase !== "lobby" || !target) return "ignore";
        delete state.players[target.id];
        break;
      }
      case "leave":
        if (!me) return "ignore";
        if (state.phase === "lobby") delete state.players[actor.userId];
        else if (state.phase === "playing" && me.alive) dropPlayer(state, me);
        else return "ignore";
        break;
      case "start":
        if (!actor.isHost || state.phase !== "lobby" || Object.keys(state.players).length === 0) return "ignore";
        state.phase = "playing";
        state.seed = crypto.getRandomValues(new Uint32Array(1))[0];
        state.round += 1;
        state.recorded = false;
        state.teams = [];
        state.teamResults = [];
        for (const player of Object.values(state.players)) Object.assign(player, { alive: true, score: 0, lines: 0, level: 1, board: "" });
        if (state.teamCount > 0) {
          const now = Date.now();
          for (let index = 0; index < state.teamCount; index++) {
            const members = Object.values(state.players).filter(player => player.team === index).sort((a, b) => a.order - b.order).map(player => player.id);
            if (members.length > 0) state.teams.push(createTeam(index, members, now));
          }
        }
        break;
      case "input": {
        if (state.phase !== "playing" || state.teamCount === 0 || !me?.alive) return "ignore";
        const action = message.action;
        if (typeof action !== "string" || !ACTIONS.includes(action as Action)) return "ignore";
        const team = state.teams.find(item => item.memberIds.includes(me.id));
        if (!team) return "ignore";
        const change = act(team, me.id, action as Action);
        if (change === "none") return "ignore";
        finishIfOver(state);
        return change === "locked" || state.phase !== "playing" ? "save" : "volatile";
      }
      case "state": {
        if (state.teamCount > 0 || state.phase !== "playing" || !me?.alive) return "ignore";
        const now = Date.now();
        const updates = lastUpdates.get(state) ?? new Map<string, number>();
        lastUpdates.set(state, updates);
        if (now - (updates.get(me.id) ?? 0) < MIN_UPDATE_INTERVAL_MS) return "ignore";
        if (typeof message.board !== "string" || !BOARD_PATTERN.test(message.board)) return "ignore";
        updates.set(me.id, now);
        Object.assign(me, { board: message.board, score: clampInt(message.score, 99_999_999), lines: clampInt(message.lines, 99_999), level: Math.max(1, clampInt(message.level, 99)) });
        return "volatile";
      }
      case "gameover":
        if (state.teamCount > 0 || state.phase !== "playing" || !me?.alive) return "ignore";
        Object.assign(me, { alive: false, score: clampInt(message.score, 99_999_999), lines: clampInt(message.lines, 99_999), level: Math.max(1, clampInt(message.level, 99)) });
        break;
      case "exit":
        if (!actor.isHost || state.phase !== "results") return "ignore";
        state.phase = "lobby";
        state.players = {};
        state.results = [];
        state.teams = [];
        state.teamResults = [];
        state.nextOrder = 0;
        break;
      default:
        return "ignore";
    }

    finishIfOver(state);
    return "save";
  },

  disconnect(state, userId) {
    const player = state.players[userId];
    if (!player) return false;
    if (state.phase === "lobby") delete state.players[userId];
    else if (state.phase === "playing" && player.alive) dropPlayer(state, player);
    else return false;
    finishIfOver(state);
    return true;
  },

  participants: state => new Set(Object.keys(state.players)),

  // Solo rounds rank players; team rounds rank teams. Either way the top rank wins.
  takeResult(state) {
    if (state.phase !== "results" || state.recorded) return null;
    state.recorded = true;
    if (state.teamCount > 0) {
      const best = state.teamResults[0]?.index;
      return {
        players: state.teams.flatMap(team => team.memberIds.map(id => ({
          userId: id, role: "team", won: team.index === best, score: team.score, extra: team.lines
        })))
      };
    }
    const best = state.results[0]?.id;
    return { players: state.results.map(player => ({ userId: player.id, role: "solo", won: player.id === best, score: player.score, extra: player.lines })) };
  },

  snapshot(state, _viewerId, connected) {
    const showBoards = state.phase !== "lobby";
    const teamMode = state.teamCount > 0;
    const teamOf = (id: string) => state.teams.find(team => team.memberIds.includes(id));
    return {
      phase: state.phase,
      seed: state.seed,
      round: state.round,
      teamCount: state.teamCount,
      players: Object.values(state.players).sort((a, b) => a.order - b.order).map(({ id, username, alive, score, lines, level, board, team }) => {
        const playing = teamMode && teamOf(id);
        return {
          id, username, alive: playing ? alive && playing.alive : alive, connected: connected.has(id), team: team ?? null,
          score: playing ? playing.score : score, lines: playing ? playing.lines : lines, level: playing ? teamLevel(playing) : level,
          board: showBoards && !teamMode ? board : ""
        };
      }),
      results: state.phase === "results" ? state.results.map(({ id, username, score, lines, level }) => ({ id, username, score, lines, level })) : [],
      teams: showBoards ? state.teams.map(team => ({
        index: team.index,
        width: team.width,
        rows: ROWS,
        board: team.board.join(""),
        alive: team.alive,
        score: team.score,
        lines: team.lines,
        level: teamLevel(team),
        pieces: team.memberIds.flatMap(id => {
          const piece = team.pieces[id];
          if (!piece) return [];
          return [{
            id, type: piece.type,
            cells: pieceCells(piece).filter(([, y]) => y >= 0),
            ghost: pieceCells(ghostOf(team, id, piece)).filter(([, y]) => y >= 0)
          }];
        }),
        members: team.memberIds.map(id => ({
          id, username: state.players[id]?.username ?? "Player", connected: connected.has(id), out: team.out.includes(id), next: upcoming(team, id)
        }))
      })) : [],
      teamResults: state.phase === "results" ? state.teamResults : []
    };
  }
};
