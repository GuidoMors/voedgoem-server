import type { Env, SessionUser } from "./env";

const PBKDF2_ITERATIONS = 100_000; // Workers cap PBKDF2 at 100k iterations
const SESSION_DAYS = 30;
const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 symbols, no modulo bias
const encoder = new TextEncoder();

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (text: string) => Uint8Array.from(atob(text), c => c.charCodeAt(0));
const toBase64Url = (bytes: Uint8Array) => toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export const randomId = (bytes = 6) => toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterations, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2" || !iterations || !salt || !hash) return false;
  const actual = await derive(password, fromBase64(salt), Number(iterations));
  return timingSafeEqual(actual, fromBase64(hash));
}

export function generateRecoveryKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const chars = [...bytes].map(b => KEY_ALPHABET[b % 32]);
  return [0, 4, 8, 12].map(i => chars.slice(i, i + 4).join("")).join("-");
}

export const normalizeRecoveryKey = (key: string) => key.toUpperCase().replace(/[^A-Z0-9]/g, "");
export const hashRecoveryKey = (key: string) => sha256Hex(normalizeRecoveryKey(key));

export async function createSession(env: Env, userId: string): Promise<string> {
  const token = randomId(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM "sessions" WHERE "expiresAt" < ?1`).bind(new Date().toISOString()),
    env.DB.prepare(`INSERT INTO "sessions" ("tokenHash", "userId", "expiresAt") VALUES (?1, ?2, ?3)`).bind(await sha256Hex(token), userId, expiresAt)
  ]);
  return token;
}

export function readToken(request: Request, url: URL): string | null {
  const header = request.headers.get("Authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim() || null;
  return url.searchParams.get("token");
}

export async function authenticate(request: Request, env: Env, url: URL): Promise<SessionUser | null> {
  const token = readToken(request, url);
  if (!token) return null;
  const row = await env.DB.prepare(`
    SELECT u."id", u."username", u."isAdmin" FROM "sessions" s
    JOIN "users" u ON u."id" = s."userId"
    WHERE s."tokenHash" = ?1 AND s."expiresAt" > ?2
  `).bind(await sha256Hex(token), new Date().toISOString()).first<{ id: string; username: string; isAdmin: number }>();
  return row ? { id: row.id, username: row.username, isAdmin: row.isAdmin === 1 } : null;
}
