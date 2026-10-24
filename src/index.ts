import type { Env, SessionUser } from "./env";
import { GAMES } from "./games";
import {
  authenticate, createSession, generateRecoveryKey, hashPassword, hashRecoveryKey, randomId, sha256Hex, verifyPassword
} from "./auth";

export { Lobby } from "./lobby";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("Origin");
  const allowed = env.CORS_ORIGINS.split(",").map(item => item.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (typeof body === "object" && body !== null && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch { /* fall through */ }
  throw new HttpError(400, "Send a JSON object.");
}

const text = (value: unknown) => (typeof value === "string" ? value : "");

function validateCredentials(username: string, password: string) {
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) throw new HttpError(400, "Username must be 3-20 letters, numbers or underscores.");
  if (password.length < 8 || password.length > 128) throw new HttpError(400, "Password must be 8-128 characters.");
}

async function register(request: Request, env: Env) {
  const body = await readBody(request);
  const username = text(body.username).trim();
  const password = text(body.password);
  validateCredentials(username, password);
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare(`INSERT INTO "users" ("id", "username", "passwordHash") VALUES (?1, ?2, ?3)`)
      .bind(id, username, await hashPassword(password)).run();
  } catch {
    throw new HttpError(409, "That username is already taken.");
  }
  return json({ token: await createSession(env, id), user: { id, username, isAdmin: false } }, 201);
}

async function login(request: Request, env: Env) {
  const body = await readBody(request);
  const row = await env.DB.prepare(`SELECT "id", "username", "passwordHash", "isAdmin" FROM "users" WHERE "username" = ?1`)
    .bind(text(body.username).trim()).first<{ id: string; username: string; passwordHash: string; isAdmin: number }>();
  if (!row || !(await verifyPassword(text(body.password), row.passwordHash))) throw new HttpError(401, "Username or password is incorrect.");
  return json({ token: await createSession(env, row.id), user: { id: row.id, username: row.username, isAdmin: row.isAdmin === 1 } });
}

async function resetPassword(request: Request, env: Env) {
  const body = await readBody(request);
  const password = text(body.password);
  if (password.length < 8 || password.length > 128) throw new HttpError(400, "Password must be 8-128 characters.");
  const invalid = new HttpError(400, "Username or recovery key is invalid.");
  const user = await env.DB.prepare(`SELECT "id", "recoveryKeyHash" FROM "users" WHERE "username" = ?1`)
    .bind(text(body.username).trim()).first<{ id: string; recoveryKeyHash: string | null }>();
  if (!user?.recoveryKeyHash) throw invalid;
  const keyHash = await hashRecoveryKey(text(body.recoveryKey));
  if (keyHash !== user.recoveryKeyHash) throw invalid;
  const [update] = await env.DB.batch([
    env.DB.prepare(`UPDATE "users" SET "passwordHash" = ?1, "recoveryKeyHash" = NULL WHERE "id" = ?2 AND "recoveryKeyHash" = ?3`)
      .bind(await hashPassword(password), user.id, keyHash),
    env.DB.prepare(`DELETE FROM "sessions" WHERE "userId" = ?1`).bind(user.id)
  ]);
  if (update.meta.changes !== 1) throw invalid;
  return json({ message: "Password updated. Sign in with your new password." });
}

const lobbyStub = (env: Env, id: string) => env.LOBBY.get(env.LOBBY.idFromName(id));

interface LobbyRow { id: string; game: string; name: string; hostId: string; hostName: string; createdAt: string }
const LOBBY_SELECT = `SELECT l."id", l."game", l."name", l."hostId", u."username" AS "hostName", l."createdAt" FROM "lobbies" l JOIN "users" u ON u."id" = l."hostId"`;

async function findLobby(env: Env, id: string) {
  const lobby = await env.DB.prepare(`${LOBBY_SELECT} WHERE l."id" = ?1`).bind(id).first<LobbyRow>();
  if (!lobby) throw new HttpError(404, "Lobby not found.");
  return lobby;
}

async function connectToLobby(request: Request, env: Env, user: SessionUser, id: string) {
  if (request.headers.get("Upgrade") !== "websocket") throw new HttpError(426, "Expected a WebSocket upgrade.");
  const lobby = await findLobby(env, id);
  const headers = new Headers(request.headers);
  headers.set("x-user-id", user.id);
  headers.set("x-username", user.username);
  headers.set("x-host-id", lobby.hostId);
  headers.set("x-host-name", lobby.hostName);
  headers.set("x-lobby-game", lobby.game);
  headers.set("x-lobby-name", lobby.name);
  return lobbyStub(env, id).fetch("https://lobby/ws", { headers });
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { pathname: path } = url;
  const method = request.method;

  if (path === "/api/health") return json({ ok: true });
  if (method === "POST" && path === "/api/auth/register") return register(request, env);
  if (method === "POST" && path === "/api/auth/login") return login(request, env);
  if (method === "POST" && path === "/api/auth/reset-password") return resetPassword(request, env);

  const user = await authenticate(request, env, url);
  if (!user) throw new HttpError(401, "Not signed in.");

  if (method === "GET" && path === "/api/auth/me") return json({ user });
  if (method === "POST" && path === "/api/auth/logout") {
    const token = request.headers.get("Authorization")?.slice(7).trim();
    if (token) await env.DB.prepare(`DELETE FROM "sessions" WHERE "tokenHash" = ?1`).bind(await sha256Hex(token)).run();
    return new Response(null, { status: 204 });
  }

  if (method === "GET" && path === "/api/games") return json({ games: Object.values(GAMES) });

  if (method === "GET" && path === "/api/lobbies") {
    const { results } = await env.DB.prepare(`${LOBBY_SELECT} ORDER BY l."createdAt" DESC`).all<LobbyRow>();
    return json({ lobbies: results });
  }
  if (method === "POST" && path === "/api/lobbies") {
    if (!user.isAdmin) throw new HttpError(403, "Only admins can create lobbies.");
    const body = await readBody(request);
    const game = text(body.game);
    const name = text(body.name).trim();
    if (!GAMES[game]) throw new HttpError(400, "Unknown game.");
    if (name.length < 1 || name.length > 40) throw new HttpError(400, "Lobby name must be 1-40 characters.");
    const id = randomId(6);
    await env.DB.prepare(`INSERT INTO "lobbies" ("id", "game", "name", "hostId") VALUES (?1, ?2, ?3, ?4)`).bind(id, game, name, user.id).run();
    return json({ lobby: await findLobby(env, id) }, 201);
  }

  const lobbyMatch = path.match(/^\/api\/lobbies\/([A-Za-z0-9_-]{1,32})(\/ws)?$/);
  if (lobbyMatch) {
    const [, id, ws] = lobbyMatch;
    if (ws && method === "GET") return connectToLobby(request, env, user, id);
    if (!ws && method === "GET") return json({ lobby: await findLobby(env, id) });
    if (!ws && method === "DELETE") {
      const lobby = await findLobby(env, id);
      if (!user.isAdmin && lobby.hostId !== user.id) throw new HttpError(403, "Only the host or an admin can close this lobby.");
      await env.DB.prepare(`DELETE FROM "lobbies" WHERE "id" = ?1`).bind(id).run();
      await lobbyStub(env, id).fetch("https://lobby/close", { method: "POST" });
      return new Response(null, { status: 204 });
    }
  }

  if (path.startsWith("/api/admin/")) {
    if (!user.isAdmin) throw new HttpError(403, "Admins only.");
    if (method === "GET" && path === "/api/admin/users") {
      const { results } = await env.DB.prepare(`
        SELECT "id", "username", "createdAt", "isAdmin" = 1 AS "isAdmin", "recoveryKeyHash" IS NOT NULL AS "hasRecoveryKey"
        FROM "users" ORDER BY "username" COLLATE NOCASE
      `).all<{ id: string; username: string; createdAt: string; isAdmin: number; hasRecoveryKey: number }>();
      return json({ users: results.map(row => ({ ...row, isAdmin: !!row.isAdmin, hasRecoveryKey: !!row.hasRecoveryKey })) });
    }
    const keyMatch = path.match(/^\/api\/admin\/users\/([A-Za-z0-9-]{1,64})\/recovery-key$/);
    if (method === "POST" && keyMatch) {
      const key = generateRecoveryKey();
      const result = await env.DB.prepare(`UPDATE "users" SET "recoveryKeyHash" = ?1 WHERE "id" = ?2`).bind(await hashRecoveryKey(key), keyMatch[1]).run();
      if (result.meta.changes !== 1) throw new HttpError(404, "User not found.");
      return json({ recoveryKey: key });
    }
  }

  throw new HttpError(404, "Not found.");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    try {
      const response = await route(request, env);
      if (response.status === 101) return response;
      const out = new Response(response.body, response);
      for (const [key, value] of Object.entries(cors)) out.headers.set(key, value);
      return out;
    } catch (error) {
      if (error instanceof HttpError) return new Response(JSON.stringify({ error: error.message }), { status: error.status, headers: { "Content-Type": "application/json", ...cors } });
      console.error(error);
      return new Response(JSON.stringify({ error: "Internal server error." }), { status: 500, headers: { "Content-Type": "application/json", ...cors } });
    }
  }
} satisfies ExportedHandler<Env>;
