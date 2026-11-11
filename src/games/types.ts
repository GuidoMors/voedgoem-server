import type { Env } from "../env";

export type Outcome = "ignore" | "save" | "volatile" | { error: string };

export interface Actor {
  userId: string;
  username: string;
  isHost: boolean;
  isAdmin: boolean;
}

// Who is currently connected to the lobby (user id -> username).
export interface Context {
  connected: Map<string, string>;
}

// A game plugs into the generic Lobby Durable Object, which owns sockets, the host and broadcasting.
export interface GameInfo {
  id: string;
  name: string;
  description: string;
  maxPlayers: number;
  // Most users (players and spectators) allowed in the lobby at once; unlimited when omitted.
  maxUsers?: number;
}

export interface GameModule<S> {
  info: GameInfo;
  // True when snapshot() output depends on who is looking (e.g. hidden information).
  perViewer: boolean;
  create(): S;
  // Fills in fields missing from state saved by an older version of the game.
  migrate?(state: S): void;
  // Loads authoritative game content before a match starts.
  prepare?(state: S, actor: Actor, message: Record<string, unknown>, env: Env): Promise<void>;
  // Called when a user's authenticated connection is activated.
  connect?(state: S, userId: string): boolean;
  handle(state: S, actor: Actor, message: Record<string, unknown>, context: Context): Outcome;
  // Called when a user's last socket closed. Returns true if the state changed.
  disconnect(state: S, userId: string): boolean;
  // Join messages (one per open spot) that would seat this user right now; empty when they can't join. Used by admin test bots.
  openSpots?(state: S, userId: string): Record<string, unknown>[];
  // Next move an autopiloted test bot would make right now, or null to wait.
  botMove?(state: S, botId: string, options?: { forcePass: boolean }): Record<string, unknown> | null;
  participants(state: S): Set<string>;
  // Optional real-time loop: ms until the next tick, or null when nothing needs ticking right now.
  tickMs?(state: S): number | null;
  tick?(state: S): Outcome;
  // Minimum gap between "volatile" broadcasts (default 100).
  volatileMs?: number;
  // Returns the finished game's per-player results once, then marks them as recorded.
  takeResult?(state: S): GameResult | null;
  snapshot(state: S, viewerId: string, connected: Set<string>): Record<string, unknown>;
}

export interface GameResult {
  // flag, score and extra are game-specific (see stats.ts for what each game stores in them).
  players: {
    userId: string;
    role: string;
    won: boolean;
    flag?: boolean;
    score?: number;
    extra?: number;
    guesses?: number;
    yellow?: number;
    green?: number;
  }[];
}
