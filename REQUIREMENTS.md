# Requirements and Expected Behavior

This document records agreed behavior for the Voedgoem backend and important cross-repository game behavior. The server is authoritative for game rules and access control. Frontend-only appearance and interaction details are noted as such; their implementation belongs in the sibling `../voedgoem` repository.

## Accounts and access

- Users register with a unique 2-20 character username containing only letters, digits, and underscores, and a password of 8-128 characters.
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

### Tetrys

- Supports solo and team play.
- Scoring and piece/game rules are enforced by the server; team mode uses the lobby's real-time game tick mechanism.
- Solo play gives each player an individual board with a shared seeded piece sequence and visible opponents.
- Team mode supports host configuration of 0-8 teams. Players can join/switch teams and the host can shuffle them.
- Each teammate's spawn lane occupies a ten-column segment of a shared team board. Team members' pieces can block one another; full-width rows clear together and the team shares score, lines, and level.
- A team tops out if a new piece cannot enter its assigned lane. When the last active player/team tops out, show results to everyone; the host can return to the lobby.

### Woerdgoem

- Game roles are spymaster and operative, assigned to the red or blue team.
- Lobby seating lets players choose a team and role. The host can configure word count/hint allowance; the game uses a draft phase before play.
- The host can scramble all connected players into one spymaster per team and balanced operative teams, or scramble only the two spymasters while preserving other team assignments.
- Board words are selected by category: shuffle categories, take a random 3–6 words from each, and continue through different categories until the configured board word count is reached.
- Red starts first. The key contains one more starting-team agent than the other team's count, plus one assassin and neutral words. The server shuffles the key and words.
- Spymasters can see the key; operatives do not see unrevealed card colours.
- A spymaster hint can target only an unrevealed word belonging to the *opposing* team. It is sent to one random connected operative on the spymaster's team and is private to that operative and the giving spymaster.
- The operative's hint tint marks a word to avoid. It must not reveal that word's colour to other viewers.
- A turn has a two-minute base timer. Red receives a one-minute bonus on its first turn. Unused time when a turn ends early is halved and banked for that team's next turn; a timed-out turn banks no time.
- The active operative team can end its turn early once a clue has been given.
- During play, the host can assign a connected spectator to either team as an operative.
- A clue is a single word plus a number or unlimited. The server rejects clues that occur on the board, including components of multi-word board entries. A numbered clue allows up to number + 1 guesses.
- Correct-team agents allow continued guesses until the guess limit; an opposing agent or neutral ends the turn; the assassin loses the game immediately. Revealing all agents for a team wins the game. The results view shows the key and the host can return the game to the lobby.
- Operatives can tag unrevealed words they want to guess. A player's tag can be toggled off by tagging the same card again. Tags are visible to all players and spectators, show each tagger's username, and clear when the turn ends or the card is revealed.
- Tags are a coordination signal, not a guess; they do not reveal card colours or change scoring.
- The frontend uses right-click to tag on desktop and a press-and-hold to tag on touch devices.

### 31 Seconds

- The game uses seven-word cards and 31-second describing turns, with a configurable grace period and target score.
- The host can scramble all connected players into one captain per team and balanced player teams, or scramble only the two captains while preserving other team assignments.
- Red takes the first turn; the captain/player draft may be randomized. A describer opens the card to start the clock, may end the clock early, or can pass an unopened card to a teammate.
- A captain from the opposing team scores the words after the timer and grace period. A connected teammate can substitute if that captain is unavailable.
- During play, the host can assign a connected spectator to either team as a player.
- Display accounts may see the words only once the opposing captain has entered the scoring period. They must not see them during lobby/draft, while describing, or during the clock/grace period. The words disappear again when the card is no longer being scored.
- The first team to the configured target normally wins. If the first team to reach target does not have a lead greater than the other team's remaining potential (seven points), allow the opposing team its last card. A tie at or above target continues through sudden death until a full round ends with different scores.
- The host can abort with confirmation; the finished score/history and per-player results are recorded.

### Saboteur

- Supports 4-14 players with a 7x13 board, ladder start, three goal positions, and role-specific win conditions.
- Tunnel placement must connect to the reachable path and match each adjacent tunnel/ladder edge. A placement can reveal a goal. Gold gives explorers an immediate win; monsters move toward the ladder at turn end and reaching it gives saboteurs the win.
- Includes gems and a face-up ability-card shop; gem placements can let the player gift a shop card to another player.
- Includes pickaxe/lantern break and repair, tunnel destruction, private goal/role peeks, and host force-skip when the active player is offline.
- Tunnel rotation is 180 degrees only. Symmetric tunnels (cross, vertical, and horizontal) do not need rotation.
- When the tunnel deck is empty and no player holds a tunnel, the game ends under the current "all tunnels played" rule. Treat this interpretation as an established implementation decision unless the user changes it.
- Turn state and legal actions are validated by the game module.

## Cross-game UI and interaction requirements

- The hub lists active lobbies with game/name/host and join action. Admins create lobbies and may close them; hosts may close their own lobby.
- Everyone can spectate; seated users join the relevant game's roles/team.
- A host-only kick control is available next to seated positions in the lobby/draft phases allowed by each game's server rules. Kicking returns the user to spectator; there is no ban and they can re-seat.
- Admins can add/remove/control up to 20 test bots in a lobby. Bot snapshots must not be substituted for a real user's view.
- Display accounts are read-only, cannot claim a seat, and exclude themselves from connected-player/game logic. Their QR code supports showing/joining a display URL.
- User profiles support an avatar composed of a body, face, and hat, with a separate colour per part. Avatar data is persisted; processed mask/outline assets are bundled with the frontend.
- Statistics are a modal tab while in the game shell. Each game has 3-6 stats including games played and win percentage; the player's row/stats appear first/highlighted, followed by a compact all-player table.
- History is opened in a modal and uses game-specific entries; Saboteur's tab is labelled "Log". Tetrys has no History tab.
- On mobile, navigation collapses to a hamburger; relevant game controls and status are repositioned for narrow viewports. In Saboteur the active player's tab appears above the map only on mobile.
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
| `GET` | `/api/admin/users` | Admin lists accounts |
| `POST` | `/api/admin/displays` | Admin creates a display account |
| `POST` | `/api/admin/users/:id/recovery-key` | Admin generates/replaces recovery key |
| `POST` | `/api/admin/users/:id/hoster` | Admin grants/revokes Hoster role with `{ "isHoster": boolean }` |

All routes and the actual request/response schemas should be verified in source before changing or documenting an API contract.
