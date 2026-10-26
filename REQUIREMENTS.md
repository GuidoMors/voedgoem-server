# Requirements and Expected Behavior

This document records agreed behavior for the Voedgoem backend and important cross-repository game behavior. The server is authoritative for game rules and access control. Frontend-only appearance and interaction details are noted as such; their implementation belongs in the sibling `../voedgoem` repository.

## Accounts and access

- Users register with a unique 2-20 character username containing only letters, digits, and underscores, and a password of 8-128 characters.
- Passwords are stored as PBKDF2 hashes. Session tokens are random bearer credentials; only their SHA-256 hashes are stored, and sessions expire after 30 days.
- A user may reset their password using their recovery key. Resetting invalidates that recovery key and deletes the user's active sessions.
- Admin privileges are assigned through the operator script (`npm run admin:grant -- <username>`); they are not self-service.
- Admins can list users, create display accounts, generate/reset a user's recovery key, create game lobbies, close any lobby, and use lobby bot controls.
- A recovery key is displayed only when generated. The server stores its hash, not its plaintext value.
- Display accounts are read-only: they cannot send game actions and do not count as connected players.
- The hourly scheduled cleanup deletes `dbg_` test accounts older than one hour, except admins and display accounts.
- Avatar values are validated server-side and stored as JSON. Display accounts do not have profile avatars.

## Lobbies and transport

- Authenticated users can list lobbies and connect to them using a WebSocket.
- Only admins can create lobbies. The host and admins can close a lobby.
- Each lobby has a game, name, host, and game-specific state. The Durable Object owns live connections and delegates game actions to that game's module.
- Invalid or unauthorized actions must not change game state. Game modules should return the repository's `ignore`, `save`, `volatile`, or explicit error outcomes as appropriate.
- Real-time games may request scheduled ticks through the optional game-module tick hooks.
- The backend stores results for real users when a game finishes; bot results are excluded.

## Games

### Tetris

- Supports solo and team play.
- Scoring and piece/game rules are enforced by the server; team mode uses the lobby's real-time game tick mechanism.

### Codenames

- Game roles are spymaster and operative, assigned to the red or blue team.
- Spymasters can see the key; operatives do not see unrevealed card colours.
- A spymaster hint can target only an unrevealed word belonging to the *opposing* team. It is sent to one random connected operative on the spymaster's team and is private to that operative and the giving spymaster.
- A turn has a two-minute base timer. Red receives a one-minute bonus on its first turn. Unused time when a turn ends early is halved and banked for that team's next turn; a timed-out turn banks no time.
- The active operative team can end its turn early once a clue has been given.
- Operatives can tag unrevealed words they want to guess. A player's tag can be toggled off by tagging the same card again. Tags are visible to all players and spectators, show each tagger's username, and clear when the turn ends or the card is revealed.
- Tags are a coordination signal, not a guess; they do not reveal card colours or change scoring.
- The frontend uses right-click to tag on desktop and a press-and-hold to tag on touch devices.

### 31 Seconds

- The game uses seven-word cards and 31-second describing turns, with a configurable grace period and target score.
- A captain from the opposing team scores the words after the timer and grace period. A connected teammate can substitute if that captain is unavailable.
- Display accounts may see the words only once the opposing captain has entered the scoring period. They must not see them during lobby/draft, while describing, or during the clock/grace period. The words disappear again when the card is no longer being scored.
- The game records per-player results and supports overtime/sudden-death scoring.

### Saboteur

- The game supports tunnel placement, role-specific win conditions, and ability cards.
- Tunnel rotation is 180 degrees only. Symmetric tunnels (cross, vertical, and horizontal) do not need rotation.
- Turn state and legal actions are validated by the game module.

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
| `POST` | `/api/lobbies` | Admin creates a lobby |
| `GET` | `/api/lobbies/:id` | Read lobby metadata |
| `GET` | `/api/lobbies/:id/ws` | Authenticated WebSocket connection |
| `DELETE` | `/api/lobbies/:id` | Host or admin closes lobby |
| `GET` | `/api/stats/:game` | Read game statistics |
| `GET` | `/api/admin/users` | Admin lists accounts |
| `POST` | `/api/admin/displays` | Admin creates a display account |
| `POST` | `/api/admin/users/:id/recovery-key` | Admin generates/replaces recovery key |

All routes and the actual request/response schemas should be verified in source before changing or documenting an API contract.
