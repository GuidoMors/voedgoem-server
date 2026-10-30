# Voedgoem Server: Project Context

For a complete transfer to a new AI session, start with [PROJECT_HANDOFF.md](./PROJECT_HANDOFF.md). Then use this file as the short repository orientation and consult [ARCHITECTURE.md](./ARCHITECTURE.md), [REQUIREMENTS.md](./REQUIREMENTS.md), [DECISIONS.md](./DECISIONS.md), [CURRENT_STATUS.md](./CURRENT_STATUS.md), [DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md), [DEVELOPMENT_TIMELINE.md](./DEVELOPMENT_TIMELINE.md), and [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) as needed.

## Purpose

Voedgoem is a browser-based multiplayer game hub. This repository contains its TypeScript backend, deployed as a Cloudflare Worker. It uses Cloudflare D1 for persistent account, lobby, and result data and one Durable Object per lobby for live game state and WebSocket connections.

The separate frontend repository is the sibling `../voedgoem` project. It owns the React UI, themes, layout, and browser interactions. Coordinate any protocol change with that repository; this backend repository does not contain the frontend.

## Games

The game registry currently includes:

- **Tetrys** — solo and team modes.
- **Woerdgoem** — red/blue teams, spymasters and operatives, clues, private spymaster hints, operative word tags, and timed turns with a time bank.
- **31 Seconds** — teams, captains and players; the describer opens a seven-word card for a 31-second turn and the opposing captain scores it.
- **Saboteur** — tunnel placement and ability-card play.

The game-specific rules and persisted state live in `src/games/<game>/index.ts`. Player-facing presentation is in the frontend.

Admins can grant the separate Hoster role to non-admin, non-display accounts. Admins already have Hoster capabilities. Hosters retain ordinary player access and can create and host lobbies, but do not receive admin dashboard or API permissions.

## Key rules for contributors

- Preserve the `GameModule` contract in `src/games/types.ts`; game modules should not take over generic lobby transport or persistence.
- Keep authoritative game rules and permission checks on the server. A disabled or hidden frontend control is not a permission check.
- Treat snapshots as audience-specific where a game has hidden information. `GameModule.perViewer` controls snapshot caching; `Lobby.broadcast()` selects the appropriate viewer identity.
- Display accounts are read-only spectators. They are intentionally not included in the connected-player set used by games.
- Hoster privileges are separate from admin privileges; only admins can manage roles or use admin-only endpoints and bot controls.
- Use ordered D1 migrations for schema changes. Do not edit already-applied migrations to change production schema.
- Keep credentials, session tokens, and recovery keys out of source control and logs. Only password and recovery-key hashes are stored.
- `npm run typecheck`, `npm run build`, and `npm run deploy` run word-list generation first.
- Do not deploy unless the task asks for deployment or deployment is otherwise explicitly agreed.

## Quick start

```sh
npm install
npm run db:migrate:local
npm run dev
```

See [README.md](./README.md) for admin management and available scripts. See [CURRENT_STATUS.md](./CURRENT_STATUS.md) before relying on deployment or test status.

## Important paths

| Path | Responsibility |
|---|---|
| `src/index.ts` | HTTP API, authentication boundary, CORS, routes, scheduled cleanup |
| `src/auth.ts` | Password hashing, sessions, recovery-key helpers |
| `src/lobby.ts` | Generic per-lobby Durable Object, WebSockets, broadcasting, results |
| `src/games/types.ts` | Shared game-module and game-result contracts |
| `src/games/registry.ts` | Registry of playable game modules |
| `src/games/<game>/` | Game state, rules, validation, snapshots, and word lists |
| `src/stats.ts` | Per-game statistics definitions |
| `migrations/` | D1 schema history |
| `scripts/set-admin.mjs` | Local/remote console admin grant and revoke |
| `wrangler.jsonc` | Worker, D1, Durable Object, CORS, and cron configuration |

## Source of truth

The deployed behavior can differ from an old session summary. For current behavior, verify the code and migrations first; update the relevant docs whenever a requirement or design decision changes.
