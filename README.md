# voedgoem-server

Cloudflare Worker + D1 + Durable Objects backend for Voedgoem.

- `src/index.ts` – HTTP API (auth, lobbies, admin) and WebSocket entry point.
- `src/lobby.ts` – `Lobby` Durable Object: one per lobby, holds live game state (players, phases, scores) and broadcasts to all connected clients.
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
