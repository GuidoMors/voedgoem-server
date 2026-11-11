# voedgoem-server

Cloudflare Worker + D1 + Durable Objects backend for Voedgoem.

- `src/index.ts` – HTTP API (auth, lobbies, admin) and WebSocket entry point.
- `src/lobby.ts` – generic `Lobby` Durable Object: one per lobby. Owns sockets, the host and broadcasting, and delegates game rules to the lobby's game module.
- `src/games/types.ts` – the `GameModule` interface every game implements.
- `src/games/registry.ts` – exports game modules and their public game info.
- `src/games/<game>/` – one folder per game, with its `index.ts` exporting one `GameModule`. The registry is generated from these folders, so adding a game does not require editing a shared list. Game-specific word sources and generation guidance belong in their game guides.

To add a game: create `src/games/<id>/index.ts` exporting exactly one const typed as `GameModule` (with `info`). The generated game registry is refreshed automatically by `npm run dev`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run deploy`; do not edit the generated file.

Then complete the [frontend's cross-repository checklist](../voedgoem/README.md#adding-a-game), including game-scoped styling for the hub game bar, lobby and bot controls, and both statistics tabs and modal. Hub Join/Show and Close actions keep shared hub styling; keep shared cards and controls for other games unchanged. A generated registry entry alone is not a finished game integration.

### Standard lobby lifecycle

Every new game starts in its pregame lobby with zero players assigned. Connected users initially remain spectators until they explicitly join an available team, role, or seat. The generic Lobby Durable Object exposes spectators in every snapshot; preserve that distinction in the game's `participants` implementation and let spectators view only information permitted by the rules. The frontend displays the live spectator list in its right-side spectator tab/panel.

Starting a match is an explicit host action, not an automatic side effect of lobby creation or a player's join. Validate the game-specific readiness requirements on the server and expose the corresponding start option in snapshots. In the frontend, place Start game and other host actions in the bottom `HostControlsTab`, with disabled state and clear guidance when the game is not ready. Keep the admin test-bot panel in its shared bottom location; do not recreate or relocate generic bot management controls inside each game.

### Test-bot support for every game

The generic Lobby Durable Object owns the admin **Add bot**, **Remove**, **Bots join game**, **Control**, **Control bot whose turn it is**, and **Autopilot** controls. These are not game-specific UI features to omit when adding a game; implement the game-module hooks and frontend turn detection so the shared tools work with that game's rules:

- `openSpots(state, userId)` returns the normal `handle` messages a bot can use to claim an available place, or an empty array when it cannot join. The server applies a randomly selected open-spot message. Check the lobby phase, existing membership, and seat/team/role limits in this hook and in `handle`; adding a bot only creates a spectator.
- `participants(state)` and `disconnect(state, userId)` must include/remove joined bots just as they do human players. Bot IDs are stable `bot-*` IDs, and the shared connected-player context includes them. Ensure snapshots and capacity checks account for bots appropriately.
- Admin snapshots contain a `botViews` entry for each bot, generated with `snapshot(state, botId, connected)`. Preserve the same privacy rules as for human viewers. The frontend's existing Control action uses that view and routes normal game messages through the bot's actor identity.
- `botMove(state, botId, options)` supplies a legal game message for Autopilot, or `null` when that bot has no move to make. The shared server applies moves through `handle`, repeatedly while progress is possible. Keep moves legal under the same phase, turn, and validation rules as human actions; do not rely on Autopilot to bypass normal checks. If automated play is not meaningful for a game, state this explicitly in its game documentation.
- In the frontend, extend `getTurnBotId` in `src/pages/LobbyPage.tsx` for games where a bot can be prompted to act. Identify the correct bot for the current phase/step and return `null` when none can take a manual turn. This drives **Control bot whose turn it is**; bot snapshots alone do not enable that control.
- Add focused tests covering bot join spots and limits, manual bot actions, removal/disconnect, and Autopilot behavior where supported. Test that an added but unjoined bot remains a spectator, and that all controls update snapshots without leaking private game state.

Game-specific bot modes are separate from the shared lifecycle; see the relevant game guide.

- `src/auth.ts` – PBKDF2 password hashing, bearer-token sessions, recovery keys (only hashes are stored).
- `migrations/` – D1 schema.


## Local development

```powershell
npm install
npm run db:migrate:local
npm run dev
```

See the [frontend guide](../voedgoem/README.md#development) to start the client.
Local D1 and lobbies are separate from production.

## Tests

Run `npm test`. The runner automatically discovers all `*.test.ts` and `*.test.mjs` files recursively under `src/` and `scripts/`, including new game directories. Add test files there without editing `package.json` or a shared test list. No shell glob expansion is required, so the same command works on Windows and other platforms.

Node test-runner options can be forwarded, for example `npm test -- --test-name-pattern=Exploration`. Test failures produce a nonzero exit code.

## Making a user an admin

Admins are set from the console only:

```
npm run admin:grant -- <username>            # local database
npm run admin:grant -- <username> --remote   # production database
npm run admin:grant -- <username> --revoke
```

Admins and Hosters can optionally set a password when creating a lobby. Leave it empty for a public lobby. Protected lobbies require the password before the server sends lobby state to a joining player; the host can enter directly.

The hub has a shared chat, and each lobby has its own chat over the lobby WebSocket. Chats retain at most 100 messages and expire each message after 30 days; closing a lobby deletes its chat history.

Admins can also grant or revoke the Hoster role from the Admin dashboard. Hosters can create and host lobbies, including configuring their games, but do not have access to the Admin dashboard or its user-management features.

## Deployment

Cloudflare Worker, D1, and Durable Object bindings are configured in `wrangler.jsonc`. Confirm the target account, database, CORS origin, and migration state before deploying:

```powershell
npm test
npm run typecheck
npm run build
```

`npm run build` is a Wrangler dry-run. If a reviewed change needs a remote
migration, obtain authorization, then run `npm run db:migrate:remote` **before**
deploying code that depends on it. Do not apply a migration merely because a
deployment is occurring. With deployment authorization:

```powershell
npm run deploy
```

Verify the API health endpoint and deployed Worker version. If the frontend
changes, follow its [deployment guide](../voedgoem/README.md#deployment) and
wait for its build to complete before deploying it. Deployment uses the
working tree; it does not commit or push changes. Remote migrations and
deployment require explicit authorization. See [CURRENT_STATUS.md](./CURRENT_STATUS.md)
for dated verification notes.

## Game-specific guides

See [tetris](./src/games/tetris/README.md), [codenames](./src/games/codenames/README.md), [thirtyone](./src/games/thirtyone/README.md), [dworf](./src/games/dworf/README.md), [blokus](./src/games/blokus/README.md), [werewolves](./src/games/werewolves/README.md), [kin](./src/games/kin/README.md), [pass-time](./src/games/pass-time/README.md), [wordle-pvp](./src/games/wordle-pvp/README.md), and [Plenet](./src/games/waar-ligt-dat-land/README.md). Game-specific rules and technical behavior belong in those game folders.


## Statistics, displays and cleanup

- Finished games record one row per real player in `gameResults` (migrations 0004 and 0005). Each game's `takeResult` hook supplies `userId`, `role`, `won`, and optional game-specific `flag`, `score`, and `extra` values. Define these meanings per game and keep them stable; do not record bot players.
- `src/stats.ts` defines 3-6 per-game statistics as SQL aggregates over those result fields. Add definitions for each game and make their labels and aggregates match the recorded meanings. `GET /api/stats/:game` serves them; the frontend needs matching game-specific styling for the statistics tab and modal.
- Display accounts (`users.isDisplay`) cannot join games or submit actions; they receive the reserved display viewer's game-specific view.
- An hourly cron deletes non-admin, non-display users named dbg_* that are over an hour old.
- Registered modules: Blokus, Codenames, Dworf, Kin, Pass Time, Tetris, 31 Seconds, Werewolves and Wordle PvP.
