# voedgoem-server

Cloudflare Worker + D1 + Durable Objects backend for Voedgoem.

- `src/index.ts` – HTTP API (auth, lobbies, admin) and WebSocket entry point.
- `src/lobby.ts` – generic `Lobby` Durable Object: one per lobby. Owns sockets, the host and broadcasting, and delegates game rules to the lobby's game module.
- `src/games/types.ts` – the `GameModule` interface every game implements.
- `src/games/registry.ts` – exports game modules and their public game info.
- `src/games/<game>/` – one folder per game, with its `index.ts` exporting one `GameModule`. The registry is generated from these folders, so adding a game does not require editing a shared list. Codenames word lists are in `src/games/codenames/words/*.txt`; 31 Seconds easy and hard lists are in `content/31seconds/`. `src/games/wordle-pvp/words.txt` contains one lowercase five-letter Wordle word per line; add words there, not to the generated TypeScript file. `npm run words` bundles the Codenames and 31 Seconds lists into generated TypeScript.

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

The Kin-only **Force pass** mode is intentionally separate and is not required for other games. New games should support the shared lifecycle above without adding duplicate bot-management UI to their lobby.

- `src/auth.ts` – PBKDF2 password hashing, bearer-token sessions, recovery keys (only hashes are stored).
- `migrations/` – D1 schema.

Pass Time's starter and custom clock catalog is stored in the `passTimeClocks` D1 table. The first request to `/api/pass-time/clocks` seeds any missing starter clocks; admins can edit, add, and remove catalog clocks in the Pass Time lobby.

## Local development

```
npm install
npm run db:migrate:local
npm run dev
```

## Live deployment

migrations:
npx.cmd wrangler d1 migrations list voedgoem --remote
npm.cmd run db:migrate:remote

deployment:
npx wrangler deploy

compile src:
npm run build


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

```
npm run typecheck
npm run build
npm run db:migrate:remote
npm run deploy
```

Do not apply remote migrations or deploy unless the change has been reviewed and deployment is intended. See [CURRENT_STATUS.md](./CURRENT_STATUS.md) for the last known production and validation status.

## 31 Seconds

The rules of 30 Seconds with six words per card (four easy followed by two hard) and 31 seconds per turn. Teams have a captain and are drafted like Codenames. The describer opens the card to start the clock; after the timer and a host-set grace period the opposing captain marks each word as guessed or not (a connected teammate steps in if that captain is offline). Players can report existing words or recommend additions; neither action changes the active word pools. Admins can review and dismiss feedback in the Admin dashboard. First team to the host-set points (default 31) wins.

## Blokus

Standard four-player Blokus on a 20×20 board, with 21 pieces per color, rotations and flips, Blue/Yellow/Red/Green turn order, and server-validated placements. The first piece must cover a board corner; later pieces must touch the same color at a corner and never along an edge. Players with no legal placement are permanently out. The fewest unplaced squares wins, with ties sharing the win.

## Statistics, displays and cleanup

- Finished games record one row per real player in `gameResults` (migrations 0004 and 0005). Each game's `takeResult` hook supplies `userId`, `role`, `won`, and optional game-specific `flag`, `score`, and `extra` values. Define these meanings per game and keep them stable; do not record bot players.
- `src/stats.ts` defines 3-6 per-game statistics as SQL aggregates over those result fields. Add definitions for each game and make their labels and aggregates match the recorded meanings. `GET /api/stats/:game` serves them; the frontend needs matching game-specific styling for the statistics tab and modal.
- Display accounts (users.isDisplay) can't join games and only receive the spectator view.
- An hourly cron deletes non-admin, non-display users named dbg_* that are over an hour old.
- Games: Tetrys (solo and team mode), Woerdgoem, 31 Seconds, Dworf, Blokus, and Pass Time.
