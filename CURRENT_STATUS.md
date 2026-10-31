# Current Status

Last reviewed: 2026-10-26.

## Overall

- The server repository is the backend for the live Voedgoem game hub.
- At handoff inspection, the server worktree had a modified `CURRENT_STATUS.md`; the frontend worktree had no reported source changes. This handoff adds further uncommitted documentation. No application source code was changed for this handoff.
- The most recent feature deployments recorded in the available conversation history were on 2026-10-24. The Codenames time-bank change, Codenames hint/tag changes, and 31 Seconds display scoring-card change were deployed then. Current production Worker versions were not checked during handoff creation.
- There is no browser/gameplay validation record for those recent changes. A successful typecheck or deployment does not establish that the game has been exercised end-to-end.
- Historical account-state notes conflict: one production action made username `Admin` an admin; another checkpoint said only `Groomp` (admin) and `TV` (display) remained after cleanup. Verify before relying on any account's current role.

## Implemented capabilities

- Account registration/login, bearer sessions, password reset with recovery key, avatar validation.
- Admin-gated user list, display-account creation, recovery-key generation, lobby creation, host/admin lobby closure, and admin bot controls.
- Five registered games: Tetrys, Woerdgoem, 31 Seconds, Saboteur, and standard four-player Blokus.
- Lobby WebSocket transport with per-viewer snapshots, participant tracking, persistent lobby state, and completed-game result storage.
- Per-game statistics API and hourly cleanup of old non-admin/non-display `dbg_` accounts.
- Codenames turn timers, red first-turn bonus, half-time carry-over on early end, opposing-team-only spymaster hints, and public operative word tags.
- 31 Seconds display snapshots show a card only while the opposing captain is scoring.
- Saboteur module and its server-side action/rule handling.

## Known limitations / validation gaps

- There is no recorded live-game test for Codenames tags, hints, or timer behavior, or for the 31 Seconds display visibility transition.
- The Codenames mobile press-and-hold behavior and the responsive layouts have no recorded physical-device verification.
- The frontend is a separate repository (`../voedgoem`); changes to frontend behavior and visual presentation must be made and verified there.
- The frontend README is known to be stale in places (Cloudflare Pages wording, old game list, and malformed avatar instructions); source and deployment configuration are authoritative until the README is repaired.
- Check deployment state directly before a release. The historical deployment record is not a guarantee that production still matches the current local source.

## Next sensible checks

1. Run `npm run typecheck` after server changes.
2. Run `npm run build` to validate the Worker bundle.
3. Exercise viewer-specific snapshots and game actions with focused tests or a local lobby, especially hidden-information and display-account paths.
4. Coordinate and validate matching frontend changes in the sibling repository.
5. Deploy only when requested/approved, then confirm the deployed Worker version.

## Production configuration

The Worker is configured in `wrangler.jsonc` as `voedgoem-api`. It binds the D1 database `voedgoem`, the `Lobby` Durable Object, the frontend CORS origin, and an hourly scheduled trigger. The known production API address is `https://voedgoem-api.guidomors.workers.dev`; verify it before using it because deployment configuration can change.
