# Architecture

## Runtime overview

```text
Browser (sibling ../voedgoem frontend)
  ├─ HTTPS JSON ───────────────> Worker (src/index.ts)
  │                                 ├─ D1: users, sessions, lobbies, gameResults
  │                                 └─ Durable Object namespace: LOBBY
  └─ WebSocket /api/lobbies/:id/ws > Worker authenticates and forwards identity
                                      └─ Lobby Durable Object (one per lobby)
                                           ├─ active WebSockets and host metadata
                                           ├─ persisted game state
                                           ├─ game module rules/snapshots/ticks
                                           └─ broadcasts per-viewer snapshots
```

## HTTP Worker

`src/index.ts` is the fetch and scheduled-event entry point. It:

1. Handles health, registration, login, and password-reset routes.
2. Authenticates bearer sessions for protected routes.
3. Applies configured CORS headers.
4. Serves game, lobby, statistics, profile, and admin endpoints.
5. Routes lobby WebSocket upgrades through the `LOBBY` Durable Object namespace.
6. Runs the hourly deletion of expired debug accounts.

`src/auth.ts` implements password hashing/verification, session creation and lookup, recovery-key creation/normalization, and hashing. `src/avatar.ts` validates avatar payloads.

## Persistence

### D1

Schema evolution is recorded in `migrations/`:

- `users`: account credentials, admin/display flags, recovery-key hash, avatar, creation time.
- `sessions`: hashed bearer token, account reference, expiration.
- `lobbies`: lobby ID, game ID, display name, host, creation time.
- `gameResults`: per-player completed-game role, result flags, score and extra fields.

Foreign-key cascades remove associated sessions/results when a user is deleted. Lobby game state itself is not a D1 row; it is held by the lobby Durable Object.

### Durable Object storage

`src/lobby.ts` stores lobby metadata and serialized game data in Durable Object storage. It migrates legacy flat state to the current `{ game, name, hostId, hostName, data }` shape and calls a game module's optional migration hook.

The Durable Object handles connect/disconnect, serializes actions, manages host/admin testing bots, persists changes, records completed results, and broadcasts snapshots. Admin bot views are generated per bot. Display accounts never enter the connected-user set.

## Game module contract and lifecycle

`src/games/types.ts` defines `GameModule<S>`. Each module provides:

- `info` and `create()` for game metadata and initial state.
- Optional `migrate()` for older persisted states.
- `handle()` for validated player actions.
- `disconnect()` and `participants()` for seat lifecycle and membership.
- `snapshot()` for the audience-specific data sent to clients.
- Optional `tickMs()` / `tick()` for timed progression.
- Optional `takeResult()` for one-time per-player final outcomes.

`src/games/registry.ts` maps game IDs to modules. Add a game by creating a module and registering it there. Word lists are maintained under game-specific `words/` directories and compiled by `scripts/build-words.mjs`.

### Action flow

1. The client sends a JSON action over its lobby WebSocket.
2. `Lobby.webSocketMessage()` rejects invalid, oversized, or display-account messages.
3. The active game module validates actor permissions and message content.
4. The outcome selects whether the action is ignored, saved, broadcast as volatile, or returned as an error.
5. Saved state is persisted; completed results are written to D1; a snapshot is broadcast.

The frontend is not an authority for roles, legal actions, turn timing, or scoring. Those rules must be checked in the game module.

## Snapshot privacy and broadcasting

The Durable Object obtains one `snapshot(state, viewerId, connected)` per viewer when information is private. Modules that mark `perViewer` false can share a cached snapshot. Admins with test bots receive their normal snapshot plus each bot's own view.

Display viewers are passed the reserved `DISPLAY_VIEWER` identity defined in `src/viewer.ts`. This is distinct from a real user ID and gives modules a way to grant a display-specific spectator view. For example, 31 Seconds reveals its card to this viewer only when scoring has started. Avoid using a player's identity to implement public-screen access.

## Real-time ticks and broadcasts

After state changes and broadcasts, the lobby asks the active game module for its next tick delay. It maintains at most one pending timer and invokes `tick()` when due. A tick may save durable state or request a rate-limited volatile broadcast.

This mechanism is used for automatic game timing and for visibility transitions that must reach connected clients even when no player action occurs at the exact transition time.

## Results and statistics

When a game module returns results from `takeResult()`, the lobby persists non-bot player rows to D1. `src/stats.ts` maps each game to SQL aggregate expressions returned by `/api/stats/:game`. Keep result-field semantics aligned between a module's `takeResult()` and its statistics definitions.

## Configuration and local development

- `wrangler.jsonc`: Worker entry point, compatibility settings, D1 binding, Durable Object class, CORS origin, cron, observability.
- `package.json`: local dev, word generation, typecheck, dry-run build, deploy, migrations, admin provisioning.
- `migrations/`: D1 migration history.

Typical local setup:

```sh
npm install
npm run db:migrate:local
npm run dev
```
