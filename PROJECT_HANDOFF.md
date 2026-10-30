# PROJECT HANDOFF PACKAGE

**Prepared:** 2026-10-26  
**Active project:** Voedgoem  
**Purpose:** Give a new AI session enough verified context to continue development without reconstructing the project or disturbing other work.

## Read this first

This package describes the Voedgoem game hub. The authoritative code is in two separate local Git repositories:

- Backend: `voedgoem-server`
- Frontend: `voedgoem`

Use the checked-out source and migrations as the authority for current implementation. This package combines the current repository inspection with available conversation summaries and checkpoints. The original conversation is very long and partly summarized; statements are marked as verified, historical, or uncertain where appropriate.

Recommended reading:

1. This document.
2. [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) for orientation.
3. [CURRENT_STATUS.md](./CURRENT_STATUS.md) for recent deployment and validation caveats.
4. [REQUIREMENTS.md](./REQUIREMENTS.md) for agreed rules and API behavior.
5. [ARCHITECTURE.md](./ARCHITECTURE.md) for component/data flow.
6. [DECISIONS.md](./DECISIONS.md) for technical rationale.
7. [DEVELOPMENT_TIMELINE.md](./DEVELOPMENT_TIMELINE.md) for chronological history and recoverable prompt wording.
8. [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) for file map, UX rules, known troubleshooting, and safe continuation steps.

## 1. Project overview

Voedgoem is a browser-based multiplayer game hub. Users register/sign in, browse game lobbies, join a lobby as a player or spectator, and play games together. Administrators manage users and recovery keys, create lobbies, provision display accounts, and use test bots. Display accounts are intended for read-only screens/TVs.

The value proposition is a shared hub for several games with persistent accounts, live multiplayer lobbies, game-specific rules and scoring, player profiles/avatars, and a common statistics/history experience.

**Current audiences and roles (confirmed in code/history):**

- Regular registered players.
- Hoster accounts, which retain player access and can create and host lobbies without admin features.
- Lobby hosts and administrators.
- Display-only accounts for shared screens.
- Spectators.
- Admin test bots (synthetic lobby participants, not real accounts).

The earlier CommonTime schedule planner is a separate project from the same broad development history. It is not the current active project and must not be modified as part of Voedgoem work.

## 2. Current state

### Verified in the local source tree

- Backend registry has four games: Tetris, Codenames, 31 Seconds (`thirtyone`), and Saboteur.
- Frontend has corresponding game lobby components and a union of lobby snapshot types.
- Account/auth/profile/avatar, admin, display account, QR, game stats, history modal, and kick-button components are present.
- Server migrations `0001_init.sql` through `0007_clear_admin_hoster.sql` are present. Hoster is a separate role that admins can grant to non-admin, non-display accounts; hosters can create and host lobbies but do not gain admin dashboard/API access.
- Server configuration names the Worker `voedgoem-api`; frontend configuration names the assets Worker `voedgoem`.
- Frontend has a production API base URL in `.env.production`.
- At handoff inspection, the backend worktree had a modified `CURRENT_STATUS.md`; the frontend worktree showed no tracked/untracked changes. No source-code changes for this handoff were made. The new handoff files themselves are uncommitted.

### Historical deployment/verification record

Conversation summaries report the API and frontend features deployed to Cloudflare through 2026-10-24. Server typechecks, frontend builds, D1 migrations, isolated game-engine simulations, and a WebSocket smoke test succeeded at various points. Some later features were tested only via typecheck/build/deploy, not in a live browser game.

This is historical evidence, not proof of the currently running production version. Before deploying or asserting the live account state, inspect the current Worker versions and D1 state. Do not make production changes unless the user asks or clearly approves.

### Known incomplete/uncertain state

- No end-to-end browser or physical mobile validation was recorded for the recent Codenames tag/hint/timer changes, 31 Seconds display scoring visibility, Saboteur presentation, QR, or mobile layouts.
- The hourly debug-account cleanup was tested by manually running its SQL but not observed running as a scheduled cron.
- The current `voedgoem/README.md` is stale: it mentions Pages and only the initial games, despite the actual Worker config and four-game source. It also shows malformed text in the avatar import command/migration sentence. Use code/config as authority; update the README when appropriate.
- Production admin account notes conflict: one recorded action promoted account `Admin`; another later note says the remaining production accounts were `Groomp` (admin) and `TV` (display). Do not assume which admin usernames exist now. Confirm from the admin UI or database only when authorized.
- A historic visual reference, `styling guide.css`, and original raw avatar source directories `bodies`, `faces`, and `hats` were not present in the checked workspace root at handoff time. The imported avatar artwork is present under the frontend's `public/avatars/`, so runtime rendering does not depend on the raw copies.

See [CURRENT_STATUS.md](./CURRENT_STATUS.md) for further detail.

## 3. Requirements and constraints

All game rules, access control and the main API route list are in [REQUIREMENTS.md](./REQUIREMENTS.md). Important cross-cutting requirements:

- Server validation is authoritative; client-disabled controls do not enforce permissions.
- Preserve per-viewer snapshots for hidden information.
- Display accounts are read-only and excluded from player connectivity.
- Use additive D1 migrations; do not rewrite migrations already applied to production.
- Never store or expose plaintext passwords, bearer tokens, or recovery keys. Recovery keys are returned once; only their hashes are stored.
- Coordinate server protocol changes with the sibling frontend repository.
- Don't touch CommonTime or unrelated files.
- Don't commit, push, apply production migrations, or deploy unless explicitly asked/approved.
- Preserve existing deployed behavior; make focused changes and run the narrowest relevant check.

## 4. Development history

The recoverable chronology is in [DEVELOPMENT_TIMELINE.md](./DEVELOPMENT_TIMELINE.md). It includes the major CommonTime-to-Voedgoem transition, game additions, avatars, displays, statistics, themes and the latest Codenames/31 Seconds tweaks.

Verbatim prompt wording is preserved only where it remains available in the current conversation or retained summaries. It would be inaccurate to reconstruct missing messages as quotes.

## 5. Technical architecture

**Backend:** TypeScript Cloudflare Worker, D1, Durable Objects, WebSockets, Wrangler.  
**Frontend:** React 19 + TypeScript + Vite, hosted as a Cloudflare Worker static-assets bundle.  
**Shared transport:** JSON HTTP API for accounts/hub/admin/stats, WebSocket for live lobbies.  
**Database:** D1 stores accounts, sessions, lobby metadata, and finished-game results. Each lobby's live game state is held in a Durable Object.

Important production configuration in the checked source:

- API URL historically used: `https://voedgoem-api.guidomors.workers.dev`
- Frontend URL historically used: `https://voedgoem.guidomors.workers.dev`
- D1 database name: `voedgoem`
- D1 binding: `DB`
- Durable Object binding/class: `LOBBY` / `Lobby`
- Frontend build-time variable: `VITE_API_BASE_URL`
- Backend plain environment config includes `CORS_ORIGINS`; verify current values in `wrangler.jsonc`.

Do not transfer Cloudflare credentials or session-state secrets. They are not part of the code handoff.

## 6. Design and UX

- The frontend uses a hash-based route shell; in-lobby Statistics, History, and Admin are modal tabs so they don't navigate away from a running game.
- Small-screen navigation uses a hamburger; game controls and layouts have responsive variants.
- The shared theme is arcade/neon. Saboteur, Codenames, and 31 Seconds override it with distinct visual treatments: dirt/stone, beige board/card, and blue/gold quiz-show styles, respectively.
- User profile editing covers body, face, hat, and a separately selected colour per part. The avatar is shown by names in game UIs.
- Codenames desktop word tagging uses right-click; touch tagging uses a hold. Tags have one team-coloured username box per operative and are visible to all players.
- Important game-specific UI corrections and presentation requirements are in [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md).

## 7. Files and source of truth

The detailed file map is in [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md). Start with:

- Backend routes/auth: `voedgoem-server/src/index.ts`, `auth.ts`, `env.ts`.
- Generic live lobby: `voedgoem-server/src/lobby.ts`.
- Game contracts/registry: `voedgoem-server/src/games/types.ts`, `registry.ts`.
- Game engines: `voedgoem-server/src/games/{tetris,codenames,thirtyone,saboteur}/`.
- Database schema history: `voedgoem-server/migrations/`.
- Frontend app/nav: `voedgoem/src/App.tsx`.
- Frontend game dispatch: `voedgoem/src/games/registry.tsx`.
- Frontend CSS: `voedgoem/src/styles.css`.
- Generated and source avatar assets: `voedgoem/public/avatars/`, `voedgoem/src/avatar/`.
- Bundled word-list source: `voedgoem-server/src/games/{codenames,thirtyone}/words/`.

Do not replace source files with summaries; transfer/check out both repositories themselves.

## 8. Bugs and troubleshooting

High-value lessons recorded from development:

- A 404 on login was caused by a production frontend bundle lacking `VITE_API_BASE_URL`, so relative `/api` calls reached the static frontend Worker. `.env.production` now provides the API origin; preserve it and check the built bundle before release.
- Old Durable Object state can lack newly added properties. Use the module `migrate()` hook and/or safe optional state access. A missing Codenames `hintsUsed` property caused an admin bot-view WebSocket 500; it was fixed by migration and optional access.
- Snapshot caching must not leak game keys. Check `perViewer` and how display/admin/bot views are constructed when changing snapshots.
- The Codenames theme once made disabled spymaster cards look muted. Generic disabled rules must exclude game pieces such as `.cn-card`, `.sb-card`, `.sb-cell`, and `.ts-word`.
- A PowerShell search/replace patch once corrupted imports in the kick UI. Always inspect patched file headers and run builds before deployment.
- Running a deploy concurrently with a build once deployed an old frontend bundle. Wait for the successful build before deploying.
- Historical tooling notes: use `npm.cmd`/`npx.cmd` in PowerShell; don't rely on Bash `&&`; avoid PowerShell rewrites that corrupt Unicode; absolute paths are safest for .NET file APIs.

## 9. Outstanding work and priorities

1. Start with a read-only inspection of both worktrees, migrations, build config and current production status.
2. Resolve stale/inconsistent docs and determine whether user wants any code change before acting.
3. Validate recent game behavior through local/gameplay tests, prioritizing hidden-information snapshots, Codenames time banking/tag visibility, and the 31 Seconds display transition.
4. Validate responsive UI on a real browser/mobile viewport.
5. Update the frontend README to accurately document Worker hosting, current games and avatar tooling.
6. Update docs alongside any future behavior changes.
7. Deploy only with explicit approval, and report exact build/migration/deployment outcomes.

No implementation task is currently specified by this handoff request; do not invent a feature to work on.

## 10. Important things to preserve

- Do not touch the CommonTime repositories (`availability-planner` and `commontime`) for Voedgoem tasks.
- Keep the four existing games and their current protocol behavior intact.
- Keep the D1 migration history append-only.
- Preserve display accounts as non-playing spectators and their tightly scoped viewer behavior.
- Preserve Codenames hidden-key rules and per-viewer snapshots.
- Work in the `voedgoem-server` backend and `voedgoem` frontend repositories, not stale `availability-planner\voedgoem*` IDE tags.
- No known user request rejected core features. A Codenames rotation experiment to 90 degrees was explicitly reverted; only 180-degree Saboteur tunnel rotation remains.

## 11. Open questions and assumptions

- Which account(s) are currently admin in production? Historical notes disagree.
- Does current production match the most recent source/deployment? Not independently checked during handoff.
- Are raw body/face/hat source assets retained elsewhere? The checked workspace root lacked those directories, though processed assets exist in the frontend.
- The original styling guide was not present during workspace inspection; current CSS is the implementation source.
- A prior session described display QR/profile/statistics and several front-end details as not browser-tested. Confirm manually rather than treating deploy success as UX proof.
- Some older project requirements and original prompt wording were summarized; exact text and dates are unavailable.

## 12. Continuation instructions

For the next AI session:

1. Open both actual repositories and inspect `git status --short` before editing. Don't assume the handoff's working-tree state remains current.
2. Read this package and the relevant requirement/architecture files. Inspect the implementation directly; don't blindly redo prior work.
3. For a behavior change, trace the full path: frontend interaction → WebSocket/API payload → server validation/state transition → viewer-specific snapshot → frontend rendering.
4. Search for existing helpers and patterns before adding code.
5. Add a migration only when needed, and apply it to a local database first. Remote migrations and deployments require user authorization.
6. Validate with existing scripts: server `npm.cmd run typecheck` and `npm.cmd run build`; frontend `npm.cmd run build`. Run targeted simulations/tests for rule engines where appropriate. No existing test script was found in the inspected package manifests.
7. Never deploy a frontend before its build succeeds. Check backend and frontend API origins/configuration.
8. Keep temporary files out of the repository and clean up only those created for the task.
9. If deployment is requested, deploy the API before frontend when the frontend depends on new API behavior, then verify health/build version and explain what was and was not tested.
10. Preserve user changes and don't reset, revert, or overwrite unrelated work.

## Files to transfer separately / missing context

- **Required:** both Git repositories, with their current commits and uncommitted work. The backend repo alone is not the whole app.
- **Existing deployable assets:** frontend `public/avatars/` and word lists are already inside the repositories; no separate copy is required for normal development.
- **Optional raw design inputs:** original `bodies/`, `faces/`, `hats/` avatar artwork and `styling guide.css` were referenced historically but not found in the checked workspace root. Transfer them separately if future re-import/redesign requires them.
- **Optional historical context:** session checkpoints under `C:\Users\Groomp\.copilot\session-state\e8d57637-ac89-42d1-87bf-af633040a1f0\checkpoints\` contain summaries, not full transcripts. They are not needed to run the app once this package and both repositories are available.
- **Do not transfer:** Cloudflare API tokens, D1 credentials, live session tokens, passwords, or plaintext recovery keys. Reauthenticate/configure secrets through the normal secure environment.
- Ancillary workspace files such as `playerstats.json`, `weaver/`, and `favicons/` were present beside the repositories, but their relationship to Voedgoem is unknown; don't assume they are required.
