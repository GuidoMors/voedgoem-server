# Implementation Notes

Practical companion to [PROJECT_HANDOFF.md](./PROJECT_HANDOFF.md). Paths below are relative to their respective repositories unless specified.

## Stack and dependencies

- Backend: TypeScript Cloudflare Worker, D1, Durable Objects, WebSockets and Wrangler. Checked manifest versions: Wrangler `^4.151.3`, TypeScript `^5.7.3`, Cloudflare Worker types `^5.20261021.1`.
- Frontend: React/React DOM `^19.0.0`, Vite `^6.1.0`, TypeScript `^5.7.3`, and `qrcode-generator ^2.0.4`.
- The frontend manifest has no component/UI framework. CSS and project components provide the UI.
- No test script was present in either inspected package manifest.

## Repository layout

### `voedgoem-server` (backend)

```text
src/
  index.ts                    HTTP routes, CORS, auth gates, cron
  auth.ts                     password/session/recovery-key functions
  avatar.ts                   avatar shape validation and stored JSON parsing
  env.ts                      Worker bindings and authenticated user type
  lobby.ts                    generic Lobby Durable Object and WebSocket lifecycle
  stats.ts                    per-game SQL statistic definitions
  viewer.ts                   reserved display snapshot identity
  games/
    types.ts                  GameModule, Actor, Context, GameResult contracts
    registry.ts               authoritative game registry
    codenames/index.ts        Codenames engine and snapshots
    saboteur/index.ts         Saboteur engine and snapshots
    tetris/index.ts           solo/team Tetris module
    tetris/team.ts            server simulation for team mode
    thirtyone/index.ts        31 Seconds engine and snapshots
migrations/                   append-only D1 migrations 0001–0005
scripts/
  build-words.mjs             build-time word bundling
  set-admin.mjs               console/local/remote admin grant/revoke
```

### `voedgoem` (frontend)

```text
src/
  App.tsx                     auth shell, hash routing, nav and modal tabs
  api.ts                      HTTP API and WebSocket URL
  useLobbyConnection.ts       lobby WebSocket, snapshots, notices, avatars
  types.ts                    app/user/lobby snapshot types
  styles.css                  global styles and game-specific themes
  avatar/                     avatar model, generated part metadata, canvas render, React view
  components/                 Modal, history, display QR, host kick UI
  games/
    registry.tsx              game-specific lobby dispatcher
    types.ts                  common snapshot and lobby props
    {codenames,saboteur,tetris,thirtyone}/
  pages/
    AuthPage.tsx, HubPage.tsx, LobbyPage.tsx
    AdminPage.tsx, ProfilePage.tsx, StatsPage.tsx
public/avatars/                imported mask and outline PNGs for each part/view
```

The current workspace contains the sibling `voedgoem-server` backend and `voedgoem` frontend repositories. Each project directory has its own `.git` directory.

## Backend data and auth

### D1 schema

Migration history:

1. `0001_init.sql`: users, sessions, lobbies.
2. `0002_avatar.sql`: nullable JSON-text avatar on users.
3. `0003_display.sql`: display-account flag.
4. `0004_game_results.sql`: per-user completed-game result rows.
5. `0005_result_details.sql`: score and extra columns.

Read migrations before changing schema. Do not edit already-applied migrations; add a new one.

`users` includes ID, case-insensitive unique username, password hash, admin/display flags, recovery-key hash, creation date, avatar. `sessions` stores token hashes and expiry. `lobbies` stores ID/game/name/host/time. `gameResults` stores game/user/role/win/flag/score/extra/time.

### Authentication

- Passwords use PBKDF2-SHA256 with 100,000 iterations.
- Bearer tokens are random and stored as SHA-256 hashes. WebSocket URL can carry `?token=...`.
- Sessions last 30 days.
- Recovery keys are normalized and hashed; only the newly generated plaintext is returned.
- `authenticate()` joins sessions/users and supplies the user identity, admin/display flags and parsed avatar.
- Admin authorization is based on the authenticated user. `scripts/set-admin.mjs` is the operator path; there is no public role-escalation endpoint.

### API families

Implemented in `src/index.ts`:

- `/api/health`
- `/api/auth/register`, `/login`, `/reset-password`, `/me`, `/logout`
- `/api/profile/avatar`
- `/api/games`
- `/api/lobbies` and `/api/lobbies/:id` plus WebSocket `/ws`
- `/api/stats/:game`
- `/api/admin/users`, `/api/admin/displays`, `/api/admin/users/:id/recovery-key`

Check source for exact methods and request/response shapes before extending the API. CORS currently permits GET, POST, PUT, DELETE, OPTIONS and Authorization/Content-Type.

## Lobby action and snapshot flow

1. Worker authenticates HTTP/WebSocket requests and forwards identity headers to the `Lobby` Durable Object.
2. DO loads persisted lobby shell state; game state sits under `data`. Older flat state is migrated and game-specific `migrate()` runs.
3. Each non-display message is parsed, then routed to the game handler with `{userId, username, isHost}` and connected-player context.
4. Result is `ignore`, `save`, `volatile`, or `{error}`. `commit()` persists, calls `takeResult()` and inserts non-bot results once, then broadcasts.
5. Per-viewer modules generate distinct snapshots. `perViewer` must be true if the resulting snapshot depends on identity. Admins with bots get bot-specific views; displays get `DISPLAY_VIEWER`.
6. Avatar updates use a separate `{type:"avatars"}` message to avoid including avatar maps in every frequent snapshot.
7. Tick hooks schedule timers for automatic turn changes and simulation. Volatile broadcasts are rate-limited.

When adding state fields, update `create()` and `migrate()` for persisted older lobbies. Test all viewer types that could receive the snapshot: player, opponent, spectator, display, admin, bot.

## Game behavior and client rules

### Codenames

- Roles: red/blue spymaster and operatives. Red starts; red's first timer gets a +1-minute bonus.
- Team turn = spymaster clue and operative guessing; 2-minute base with any previous bank. Early finish carries half the remaining time; timeout carries none.
- Spymaster sees the key; other players see unrevealed colours only after reveal.
- Hint is a secret notification to one random connected friendly operative, but the selected card must be an unrevealed opposing-colour agent (word to avoid).
- Operatives can end turn after clue. Operatives can tag unrevealed words during the active clue turn; tags are public and show a per-player username box in team colour.
- Desktop tag: right-click. Touch: hold. A tag toggles for that user; tags do not reveal the key or count as a guess. Tags clear on turn end and when a word is revealed.
- The current frontend has a side player panel, mobile word-fit logic, a status/count bar, history, and theme-specific card styling.

### 31 Seconds

- Seven words per card, 31-second timer, host-set grace interval/target score.
- Red plays first; captain draft can remain randomized.
- Describer opens the card; opposing captain marks guessed words after timer/grace. A connected teammate can step in when captain offline.
- Display-only account sees the words only in the opposing captain's scoring phase. Lobby tick broadcasts this transition without a player action.
- Overtime continues until a full round concludes with non-tied scores under the target rules. Abort is at the bottom with confirmation.

### Saboteur

- 7x13 board, ladder at row 3/column 3, three goal locations in far column, six gems, tunnel placements and role-specific objectives.
- Engine was separately simulated across random player counts/game outcomes. Historical assumptions about counts/edge cases are in [CURRENT_STATUS.md](./CURRENT_STATUS.md) and the 2026-10-24 checkpoint.
- Tunnels rotate only 180 degrees. Cross, vertical and horizontal cards are symmetric and their rotation controls are disabled.
- The UI has separate tunnel/ability hand areas, a Shop of face-up cards, monster move arrows between cells, player turn/history panels, mobile turn banner, and game-specific dirt/stone theme.

### Tetris

- Solo game state is client-oriented; team mode uses a server-side shared board simulation.
- Team configuration includes 0–8 teams. Players may join/switch teams; host can shuffle teams.
- Team board width scales by member lanes; a failed spawn ends the team. Score/lines/level are shared.
- Network feel and mobile control layout have historical changes but were not fully verified in live gameplay/mobile.

## Avatars

- Model: body/bodyColor, face/faceColor, hat/hatColor.
- Frontend generates deterministic fallback avatars and supports editor preview/color selection.
- Imported processed image assets are under `public/avatars/{bodies,faces,hats}/...`; renderer recolours masks based on luminance and composites outlines through canvas.
- The raw source folders `bodies`, `faces`, and `hats` were referenced but missing when checked during handoff. Do not remove the processed files in the frontend repository.
- Display accounts have no avatar profile.

## UX and style decisions

- Top navigation: Hub/Game, Statistics, History when supported, Admin for admins; profile link includes avatar; display account gets a QR sign-in card instead.
- Statistics, History, Admin are modal views so the active game remains open. Only Hub/Game and profile have navigation active styles.
- Admin test-bot panel is below the game panel.
- Kick controls are host-only and appear next to seated users. Kicking returns the player to spectator; no rejoin ban.
- Responsive layout work includes mobile hamburger, narrow Codenames word-fit, Tetris control arrangement, side-scroll tables, and active Saboteur turn placement above the map on mobile.
- Theme fonts: arcade neon uses Press Start 2P and Tilt Neon; Saboteur Silkscreen and VT323; Codenames Playfair Display and Libre Baskerville; 31 Seconds Cinzel and Raleway. Verify existing CSS/index before changing fonts.

## Build, validation, deployment

Run from each repository's root:

```powershell
# Server
npm.cmd run typecheck
npm.cmd run build

# Frontend
npm.cmd run build
```

Word lists are generated automatically by backend pre-scripts for typecheck/build/deploy.

Historical deploy commands:

```powershell
# API; do this only with user approval
npm.cmd run deploy

# Frontend; only after successful build and with user approval
npx.cmd wrangler deploy
```

The production API URL is baked into the frontend at build time via `.env.production`. Confirm this file and Vite output before deployment. The frontend Wrangler config deploys `dist` as an assets Worker (not Pages), despite the stale README.

No test script appeared in the inspected `package.json` files. Older random game simulations were temporary and removed; create focused tests/simulations for game logic when warranted, then clean up.

## Troubleshooting history

| Symptom / mistake | Cause and lesson |
|---|---|
| Login 404 from production frontend | Missing API origin in frontend build; relative `/api` hit static Worker. Preserve/check `.env.production`. |
| WebSocket 500 on old lobby with bots | Pre-migration state lacked new Codenames hints field. Provide `migrate()` and optional guards for persisted-state evolution. |
| Spymaster cards appeared muted | Game cards were affected by generic disabled-button/theme CSS. Exclude game pieces from shared disabled rules. |
| Broken imports after script edits | String replacement/PowerShell patching can damage adjacent lines. Inspect exact diff and build before deploy. |
| Old frontend deployed | Deploy ran before build finished. Build success must precede deployment. |
| Unicode rendered as `?` | Some PowerShell rewriting paths corrupted source text. Use the repository edit mechanism, preserve UTF-8, and inspect Unicode output. |
| Stale IDE paths | Active repository path is under `voedgoem-groomp`, not `availability-planner\voedgoem*`. |

## Testing gaps

- Real-browser game flows and mobile-touch behavior need confirmation.
- Specifically exercise Codenames spymaster key, hint privacy/opposing-color rule, public tag behavior/clearing, timer bank and red bonus.
- Exercise 31 Seconds display through describing → timer → grace → captain scoring → confirm; ensure the display sees words only during scoring.
- Validate display QR and account restrictions.
- Validate group/game admin workflows, host kicks, and no unintended rejoin restriction.
- Confirm current production migrations and Worker versions before any release.
