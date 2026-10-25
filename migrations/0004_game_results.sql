CREATE TABLE "gameResults" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "game" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "won" INTEGER NOT NULL,
  "flag" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX "gameResultsByUser" ON "gameResults" ("userId", "game");
