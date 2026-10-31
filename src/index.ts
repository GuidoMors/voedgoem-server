import { parseAvatar, parseStoredAvatar } from "./avatar";
import type { Env, SessionUser } from "./env";
import { GAMES } from "./games/registry";
import { GAME_STATS } from "./stats";
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
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
  if (!/^[A-Za-z0-9_]{2,20}$/.test(username)) throw new HttpError(400, "Username must be 2-20 letters, numbers or underscores.");
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
  return json({ token: await createSession(env, id), user: { id, username, isAdmin: false, isHoster: false, isDisplay: false, avatar: null } }, 201);
}

async function login(request: Request, env: Env) {
  const body = await readBody(request);
  const row = await env.DB.prepare(`SELECT "id", "username", "passwordHash", "isAdmin", "isHoster", "isDisplay", "avatar" FROM "users" WHERE "username" = ?1`)
    .bind(text(body.username).trim()).first<{ id: string; username: string; passwordHash: string; isAdmin: number; isHoster: number; isDisplay: number; avatar: string | null }>();
  if (!row || !(await verifyPassword(text(body.password), row.passwordHash))) throw new HttpError(401, "Username or password is incorrect.");
  return json({ token: await createSession(env, row.id), user: { id: row.id, username: row.username, isAdmin: row.isAdmin === 1, isHoster: row.isHoster === 1, isDisplay: row.isDisplay === 1, avatar: parseStoredAvatar(row.avatar) } });
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

interface LobbyRow { id: string; game: string; name: string; hostId: string; hostName: string; createdAt: string; isPasswordProtected: boolean }
const LOBBY_SELECT = `SELECT l."id", l."game", l."name", l."hostId", u."username" AS "hostName", l."createdAt", l."passwordHash" IS NOT NULL AS "isPasswordProtected" FROM "lobbies" l JOIN "users" u ON u."id" = l."hostId"`;

async function findLobby(env: Env, id: string) {
  const lobby = await env.DB.prepare(`${LOBBY_SELECT} WHERE l."id" = ?1`).bind(id).first<LobbyRow>();
  if (!lobby) throw new HttpError(404, "Lobby not found.");
  return { ...lobby, isPasswordProtected: !!lobby.isPasswordProtected };
}

async function connectToLobby(request: Request, env: Env, user: SessionUser, id: string) {
  if (request.headers.get("Upgrade") !== "websocket") throw new HttpError(426, "Expected a WebSocket upgrade.");
  const lobby = await findLobby(env, id);
  const headers = new Headers(request.headers);
  headers.set("x-user-id", user.id);
  headers.set("x-username", user.username);
  headers.set("x-is-admin", user.isAdmin ? "1" : "0");
  headers.set("x-is-display", user.isDisplay ? "1" : "0");
  if (user.avatar && !user.isDisplay) headers.set("x-avatar", JSON.stringify(user.avatar));
  else headers.delete("x-avatar");
  headers.set("x-host-id", lobby.hostId);
  headers.set("x-host-name", lobby.hostName);
  headers.set("x-lobby-game", lobby.game);
  headers.set("x-lobby-name", lobby.name);
  headers.set("x-is-lobby-host", lobby.hostId === user.id ? "1" : "0");
  const { passwordHash } = await env.DB.prepare(`SELECT "passwordHash" FROM "lobbies" WHERE "id" = ?1`)
    .bind(id).first<{ passwordHash: string | null }>() ?? { passwordHash: null };
  if (passwordHash) headers.set("x-lobby-password-hash", passwordHash);
  else headers.delete("x-lobby-password-hash");
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
  if (method === "PUT" && path === "/api/profile/avatar") {
    if (user.isDisplay) throw new HttpError(403, "Display accounts have no profile.");
    const body = await readBody(request);
    const avatar = parseAvatar(body.avatar);
    if (!avatar) throw new HttpError(400, "That avatar is not valid.");
    await env.DB.prepare(`UPDATE "users" SET "avatar" = ?1 WHERE "id" = ?2`).bind(JSON.stringify(avatar), user.id).run();
    return json({ user: { ...user, avatar } });
  }
  if (method === "POST" && path === "/api/auth/logout") {
    const token = request.headers.get("Authorization")?.slice(7).trim();
    if (token) await env.DB.prepare(`DELETE FROM "sessions" WHERE "tokenHash" = ?1`).bind(await sha256Hex(token)).run();
    return new Response(null, { status: 204 });
  }

  if (method === "GET" && path === "/api/games") return json({ games: Object.values(GAMES) });

  const statsMatch = path.match(/^\/api\/stats\/([a-z0-9]+)$/);
  if (method === "GET" && statsMatch) {
    const defs = GAME_STATS[statsMatch[1]];
    if (!defs) throw new HttpError(404, "Unknown game.");
    const columns = defs.map(def => `${def.sql} AS "${def.key}"`).join(", ");
    const { results } = await env.DB.prepare(`
      SELECT "userId" AS "id", "username", "avatar", ${columns}
      FROM "gameResults" JOIN "users" ON "users"."id" = "gameResults"."userId"
      WHERE "game" = ?1 GROUP BY "userId" ORDER BY COUNT(*) DESC, "username" COLLATE NOCASE
    `).bind(statsMatch[1]).all<Record<string, string | number | null> & { id: string; username: string; avatar: string | null }>();
    const players = results.map(({ id, username, avatar, ...values }) => ({ id, username, avatar: parseStoredAvatar(avatar), values }));
    return json({
      stats: defs.map(({ key, label, format }) => ({ key, label, format })),
      me: players.find(player => player.id === user.id) ?? null,
      players
    });
  }

  if (method === "GET" && path === "/api/lobbies") {
    const { results } = await env.DB.prepare(`${LOBBY_SELECT} ORDER BY l."createdAt" DESC`).all<LobbyRow>();
    const lobbies = await Promise.all(results.map(async lobby => {
      const response = await lobbyStub(env, lobby.id).fetch("https://lobby/summary");
      if (!response.ok) throw new HttpError(502, "Could not load lobby player counts.");
      const { playerCount } = await response.json<{ playerCount: number }>();
      return {
        id: lobby.id,
        game: lobby.game,
        name: lobby.name,
        hostId: lobby.hostId,
        hostName: lobby.hostName,
        createdAt: lobby.createdAt,
        isPasswordProtected: !!lobby.isPasswordProtected,
        playerCount,
        maxPlayers: GAMES[lobby.game].maxPlayers
      };
    }));
    return json({ lobbies });
  }
  if (method === "POST" && path === "/api/lobbies") {
    if (!user.isAdmin && !user.isHoster) throw new HttpError(403, "Only admins and hosters can create lobbies.");
    const body = await readBody(request);
    const game = text(body.game);
    const name = text(body.name).trim();
    const password = body.password === undefined ? "" : body.password;
    if (!GAMES[game]) throw new HttpError(400, "Unknown game.");
    if (name.length < 1 || name.length > 40) throw new HttpError(400, "Lobby name must be 1-40 characters.");
    if (typeof password !== "string" || password.length > 128) throw new HttpError(400, "Lobby password must be at most 128 characters.");
    const id = randomId(6);
    const passwordHash = password.trim() ? await hashPassword(password) : null;
    await env.DB.prepare(`INSERT INTO "lobbies" ("id", "game", "name", "hostId", "passwordHash") VALUES (?1, ?2, ?3, ?4, ?5)`)
      .bind(id, game, name, user.id, passwordHash).run();
    return json({ lobby: { ...await findLobby(env, id), playerCount: 0, maxPlayers: GAMES[game].maxPlayers } }, 201);
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
        SELECT "id", "username", "createdAt", "isAdmin" = 1 AS "isAdmin", "isHoster" = 1 AS "isHoster", "isDisplay" = 1 AS "isDisplay", "recoveryKeyHash" IS NOT NULL AS "hasRecoveryKey"
        FROM "users" ORDER BY "username" COLLATE NOCASE
      `).all<{ id: string; username: string; createdAt: string; isAdmin: number; isHoster: number; isDisplay: number; hasRecoveryKey: number }>();
      return json({ users: results.map(row => ({ ...row, isAdmin: !!row.isAdmin, isHoster: !!row.isHoster, isDisplay: !!row.isDisplay, hasRecoveryKey: !!row.hasRecoveryKey })) });
    }
    if (method === "POST" && path === "/api/admin/displays") {
      const body = await readBody(request);
      const username = text(body.username).trim();
      const password = text(body.password);
      validateCredentials(username, password);
      try {
        await env.DB.prepare(`INSERT INTO "users" ("id", "username", "passwordHash", "isDisplay") VALUES (?1, ?2, ?3, 1)`)
          .bind(crypto.randomUUID(), username, await hashPassword(password)).run();
      } catch {
        throw new HttpError(409, "That username is already taken.");
      }
      return json({ username }, 201);
    }
    const keyMatch = path.match(/^\/api\/admin\/users\/([A-Za-z0-9-]{1,64})\/recovery-key$/);
    if (method === "POST" && keyMatch) {
      const key = generateRecoveryKey();
      const result = await env.DB.prepare(`UPDATE "users" SET "recoveryKeyHash" = ?1 WHERE "id" = ?2`).bind(await hashRecoveryKey(key), keyMatch[1]).run();
      if (result.meta.changes !== 1) throw new HttpError(404, "User not found.");
      return json({ recoveryKey: key });
    }
    const hosterMatch = path.match(/^\/api\/admin\/users\/([A-Za-z0-9-]{1,64})\/hoster$/);
    if (method === "POST" && hosterMatch) {
      const body = await readBody(request);
      if (typeof body.isHoster !== "boolean") throw new HttpError(400, "isHoster must be a boolean.");
      const target = await env.DB.prepare(`SELECT "isAdmin", "isDisplay" FROM "users" WHERE "id" = ?1`)
        .bind(hosterMatch[1]).first<{ isAdmin: number; isDisplay: number }>();
      if (!target) throw new HttpError(404, "User not found.");
      if (target.isDisplay === 1) throw new HttpError(400, "Display accounts cannot be hosters.");
      if (body.isHoster && target.isAdmin === 1) throw new HttpError(400, "Admins already have hoster permissions.");
      await env.DB.prepare(`UPDATE "users" SET "isHoster" = ?1 WHERE "id" = ?2`)
        .bind(body.isHoster ? 1 : 0, hosterMatch[1]).run();
      return json({ isHoster: body.isHoster });
    }
  }

  throw new HttpError(404, "Not found.");
}

export default {
  async scheduled(_event, env): Promise<void> {
    // Throwaway accounts used for testing (usernames starting "dbg_") are removed an hour after creation.
    // Sessions and game results go with them through ON DELETE CASCADE.
    await env.DB.prepare(`
      DELETE FROM "users" WHERE "username" LIKE 'dbg\\_%' ESCAPE '\\' AND "isAdmin" = 0 AND "isDisplay" = 0 AND "createdAt" < ?1
    `).bind(new Date(Date.now() - 3_600_000).toISOString()).run();
  },

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
