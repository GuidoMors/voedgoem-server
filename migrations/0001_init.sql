CREATE TABLE "users" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL COLLATE NOCASE UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "isAdmin" INTEGER NOT NULL DEFAULT 0,
  "recoveryKeyHash" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE "sessions" (
  "tokenHash" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "expiresAt" TEXT NOT NULL
);
CREATE INDEX "sessions_userId_idx" ON "sessions" ("userId");

CREATE TABLE "lobbies" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "game" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "hostId" TEXT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
