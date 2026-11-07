# Requirements and Expected Behavior

This document records agreed behavior for the Voedgoem backend and important cross-repository game behavior. The server is authoritative for game rules and access control. Frontend-only appearance and interaction details are noted as such; their implementation belongs in the sibling `../voedgoem` repository.

## Accounts and access

- Users register with a unique 2-20 character username containing only letters, digits, and underscores, and a password of 3-128 characters.
- Passwords are stored as PBKDF2 hashes. Session tokens are random bearer credentials; only their SHA-256 hashes are stored, and sessions expire after 30 days.
- A user may reset their password using their recovery key. Resetting invalidates that recovery key and deletes the user's active sessions.
- Admin privileges are assigned through the operator script (`npm run admin:grant -- <username>`); they are not self-service.
- Admins can list users, create display accounts, generate/reset a user's recovery key, create game lobbies, close any lobby, and use lobby bot controls.
- Admins can grant or revoke the separate Hoster role for non-admin, non-display accounts. Admins already have Hoster capabilities and cannot be granted that role. Hosters retain ordinary player access and can create and host lobbies and configure their games, but cannot access the admin dashboard/APIs, manage roles, create display accounts, generate recovery keys, or control test bots.
- Hosters can close their own lobbies as the lobby host; only admins can close other users' lobbies.
- A recovery key is displayed only when generated. The server stores its hash, not its plaintext value.
- Display accounts are read-only: they cannot send game actions and do not count as connected players.
- The hourly scheduled cleanup deletes `dbg_` test accounts older than one hour, except admins and display accounts.
- Avatar values are validated server-side and stored as JSON. Display accounts do not have profile avatars.

## Lobbies and transport

- Authenticated users can list lobbies and connect to them using a WebSocket.
- Admins and hosters can create lobbies. The host and admins can close a lobby. Creating a lobby makes that account its host, with the game's normal host controls.
- Admins and hosters may set an optional lobby password of up to 128 characters when creating a lobby. An empty or whitespace-only password creates a public lobby. Passwords are stored as hashes; joining a protected lobby requires the password before any lobby snapshot or game actions are available. The lobby host can enter without a password.
- Each lobby has a game, name, host, and game-specific state. The Durable Object owns live connections and delegates game actions to that game's module.
- Invalid or unauthorized actions must not change game state. Game modules should return the repository's `ignore`, `save`, `volatile`, or explicit error outcomes as appropriate.
- Real-time games may request scheduled ticks through the optional game-module tick hooks.
- The backend stores results for real users when a game finishes; bot results are excluded.

## Games

Game-specific rules and implementation notes are maintained in their [game folders](./README.md#game-specific-guides). Source and tests remain authoritative.

## Cross-game UI and interaction requirements

- The hub lists active lobbies with game/name/host and join action. Admins and hosters create lobbies; admins may close any lobby and hosts may close their own.
- Every new game receives a game-themed hub bar and its supplied favicon. Check `content/favicons/`, copy the matching asset to the frontend's `public/favicons/`, and register it in `src/gameFavicon.ts` there. Verify the hub image and in-lobby browser icon. Hub Join/Show and Close actions retain the shared hub button styling.
- Everyone can spectate; seated users join the relevant game's roles/team.
- A host-only kick control is available next to seated positions in the lobby/draft phases allowed by each game's server rules. Kicking returns the user to spectator; there is no ban and they can re-seat.
- Admins can add/remove/control up to 20 test bots in a lobby. Bot snapshots must not be substituted for a real user's view.
- Display accounts are read-only, cannot claim a seat, and exclude themselves from connected-player/game logic. Their QR code supports showing/joining a display URL.
- User profiles support an avatar composed of a body, face, and hat, with a separate colour per part. Avatar data is persisted; processed mask/outline assets are bundled with the frontend.
- Statistics are a modal tab while in the game shell. Each game has 3-6 stats including games played and win percentage; the player's row/stats appear first/highlighted, followed by a compact all-player table.
- History is opened in a modal and uses game-specific entries where supported.
- On mobile, navigation collapses to a hamburger; relevant game controls and status are repositioned for narrow viewports.
- Per-game visual themes are scoped to the current game's body state. Shared disabled styling must not mute interactive game tiles/cards or hide a disabled state that needs strong contrast.
- Modals must preserve the active game rather than navigate away; the Hub/Game tab and brand are inert while a lobby is active where previously requested.

## Non-functional and operational requirements

- Use Cloudflare Worker-compatible TypeScript and supported APIs. Keep D1 and Durable Object bindings/config synchronized with source.
- Live lobby actions must be serialized through the Durable Object. Avoid uncontrolled polling; use game ticks where realtime progression is required.
- Do not leak hidden game state through shared/cached snapshots. Explicitly test identity-based views after snapshot changes.
- Keep messages bounded and validate action types, IDs, indices, and game phase/role on the server.
- Preserve existing lobbies across code deployments through migration/defaulting of new state fields.
- Make frontend changes work at desktop and narrow mobile widths; actual device validation is still outstanding.
- Keep dependency/tooling changes minimal. Use existing npm scripts, TypeScript checks, Vite build, and Wrangler deployment workflow.
- Deployment and remote D1 mutation require explicit user approval. Never place credentials or plaintext recovery secrets in documentation or source.

## Statistics

- Finished games record per-player role, win/loss, and game-specific result fields.
- `GET /api/stats/:game` returns the supported statistic definitions, each player's aggregates, and the authenticated player's own row when available.
- Statistics are defined in `src/stats.ts`; new game results must keep their meaning consistent with those aggregate definitions.
- Register each game's aggregates and verify its authenticated endpoint, including IDs containing hyphens such as `pass-time`. A game without results returns valid definitions and an empty player list, not a missing-route error.
- Give each statistics tab its own game's normal/hover/selected theme, regardless of the currently selected game. Theme the selected game's statistics modal, tables, and controls as well as its hub bar; follow the [frontend checklist](../voedgoem/README.md#adding-a-game).
- Frontend tab changes clear previous errors and ignore superseded requests, so an earlier failure cannot remain visible over another game's statistics.

## API contract

The current routes are implemented in `src/index.ts`. Principal routes:

| Method | Path | Access / purpose |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Sign in and create session |
| `POST` | `/api/auth/reset-password` | Reset using a recovery key |
| `GET` | `/api/auth/me` | Authenticated user |
| `POST` | `/api/auth/logout` | Revoke current bearer session |
| `PUT` | `/api/profile/avatar` | Update non-display profile avatar |
| `GET` | `/api/games` | List registered games |
| `GET` | `/api/lobbies` | List lobbies |
| `POST` | `/api/lobbies` | Admin/Hoster creates a lobby; optional `password` (empty means public) |
| `GET` | `/api/lobbies/:id` | Read lobby metadata |
| `GET` | `/api/lobbies/:id/ws` | Authenticated WebSocket connection; protected lobbies require the password before lobby data is sent |
| `DELETE` | `/api/lobbies/:id` | Host or admin closes lobby |
| `GET` | `/api/stats/:game` | Read game statistics |
| `GET` | `/api/chat/hub/ws` | Authenticated hub chat WebSocket |
| `POST` | `/api/word-feedback` | Non-display user reports or recommends a word |
| `GET` | `/api/admin/word-feedback` | Admin reads feedback |
| `DELETE` | `/api/admin/word-feedback` | Admin removes feedback by word key |
| `GET` | `/api/pass-time/clocks` | Read the clock catalog; seeds missing starters |
| `POST` | `/api/admin/pass-time/clocks` | Admin adds a custom clock |
| `PUT`, `DELETE` | `/api/admin/pass-time/clocks/:id` | Admin edits or removes a custom clock |
| `GET` | `/api/admin/users` | Admin lists accounts |
| `POST` | `/api/admin/displays` | Admin creates a display account |
| `POST` | `/api/admin/users/:id/recovery-key` | Admin generates/replaces recovery key |
| `POST` | `/api/admin/users/:id/hoster` | Admin grants/revokes Hoster role with `{ "isHoster": boolean }` |

All routes and the actual request/response schemas should be verified in source before changing or documenting an API contract.
