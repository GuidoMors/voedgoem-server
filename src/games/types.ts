export type Outcome = "ignore" | "save" | "volatile" | { error: string };

export interface Actor {
  userId: string;
  username: string;
  isHost: boolean;
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
}

export interface GameModule<S> {
  info: GameInfo;
  // True when snapshot() output depends on who is looking (e.g. hidden information).
  perViewer: boolean;
  create(): S;
  // Fills in fields missing from state saved by an older version of the game.
  migrate?(state: S): void;
  handle(state: S, actor: Actor, message: Record<string, unknown>, context: Context): Outcome;
  // Called when a user's last socket closed. Returns true if the state changed.
  disconnect(state: S, userId: string): boolean;
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
  players: { userId: string; role: string; won: boolean; flag?: boolean; score?: number; extra?: number }[];
}
