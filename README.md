# voedgoem-server

Cloudflare Worker + D1 + Durable Objects backend for Voedgoem.

- `src/index.ts` – HTTP API (auth, lobbies, admin) and WebSocket entry point.
- `src/lobby.ts` – generic `Lobby` Durable Object: one per lobby. Owns sockets, the host and broadcasting, and delegates game rules to the lobby's game module.
- `src/games/types.ts` – the `GameModule` interface every game implements.
- `src/games/registry.ts` – the only place games are listed.
- `src/games/<game>/` – one folder per game (`tetris/`, `codenames/`, `thirtyone/`). Codenames and 31 Seconds keep their word lists in `src/games/<game>/words/*.txt`; `npm run words` (run automatically before typecheck, build and deploy) bundles them into `words.generated.ts`.

To add a game: create `src/games/<id>/index.ts` exporting a `GameModule` (with `info`), then add it to `src/games/registry.ts`.
- `src/auth.ts` – PBKDF2 password hashing, bearer-token sessions, recovery keys (only hashes are stored).
- `migrations/` – D1 schema.

## Local development

```
npm install
npm run db:migrate:local
npm run dev
```

## Making a user an admin

Admins are set from the console only:

```
npm run admin:grant -- <username>            # local database
npm run admin:grant -- <username> --remote   # production database
npm run admin:grant -- <username> --revoke
```

## Not yet configured

The Cloudflare resources are not created yet. Before deploying, create the D1 database, put its id in `wrangler.jsonc` (`database_id`), and set `CORS_ORIGINS` to the Pages origin.

## 31 Seconds

The rules of 30 Seconds with 7 words per card and 31 seconds per turn. Teams have a captain and are drafted like Codenames. The describer opens the card to start the clock; after the timer and a host-set grace period the opposing captain marks each word as guessed or not (a connected teammate steps in if that captain is offline). First team to the host-set points (default 31) wins.

## Statistics, displays and cleanup

- Finished games record one row per real player in gameResults (migrations 0004 and 0005). Each game's takeResult hook supplies it.
- src/stats.ts defines the 3-6 stats per game (SQL aggregates). GET /api/stats/:game serves them.
- Display accounts (users.isDisplay) can't join games and only receive the spectator view.
- An hourly cron deletes non-admin, non-display users named dbg_* that are over an hour old.
- Games: Tetris (solo and team mode), Codenames, 31 Seconds, Saboteur.

