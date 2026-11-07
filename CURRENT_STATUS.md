# Current Status

Last documentation review: 2026-11-07. This is a dated local-source review,
not a guarantee about the current production deployment or database.

## Local implementation

- Nine game modules are in the generated registry: Blokus, Codenames, Dworf,
  Kin, Pass Time, Tetris, 31 Seconds, Werewolves and Wordle PvP.
- The shared server provides accounts, hoster and display roles, protected
  lobbies, chat, bot controls, viewer-specific snapshots and statistics.
- Migrations `0001` through `0011` are present locally. Check the target
  database's actual migration state before any authorized release.
- Both repositories have tests. Server `npm test` discovers test files under
  `src/` and `scripts/`; use targeted tests when investigating a change.
- The frontend README was reorganized during this session. Its strict build
  has previously failed on an unused `showHeading` parameter; check the
  current source and build rather than assuming it is fixed.

## Historical verification

- On 2026-11-04 this session deployed the API and frontend, then verified the
  live frontend bundle and API health. A subsequent frontend-only deployment
  for player-name selectors was also verified. This is not a fresh check of
  current Worker versions or production data.
- Focused server tests and isolated browser fixtures covered recent Kin and
  Werewolves changes. Those checks do not prove every flow in a live
  multiplayer game or on a physical phone.
- Earlier full server runs had failures in existing Kin setup expectations;
  these were historical results, not a claim about the current suite. Run the
  relevant tests before relying on any test status.
- Historical production admin-account notes conflict. Verify account roles
  through authorized means before making changes.

## Before a release

Inspect both worktrees and the relevant code, run targeted tests and builds,
confirm migration and deployment targets, and obtain authorization for any
remote migration or deployment. See [README.md](./README.md#deployment) and
the sibling frontend's deployment guide.
