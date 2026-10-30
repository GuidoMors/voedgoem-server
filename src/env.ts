import type { Avatar } from "./avatar";

export interface Env {
  DB: D1Database;
  LOBBY: DurableObjectNamespace;
  CORS_ORIGINS: string;
}

export interface SessionUser {
  id: string;
  username: string;
  isAdmin: boolean;
  isHoster: boolean;
  isDisplay: boolean;
  avatar: Avatar | null;
}
