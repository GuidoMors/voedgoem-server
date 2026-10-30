# Development Log

Chronological summary of important changes and requirements. This log is based on repository history and the retained conversation summary; it is not a complete transcript. Dates are included only where they are known. Update this file when future significant behavior or architecture changes are made.

## Earlier project history (date details unavailable)

- Established the Cloudflare Worker, D1 account/lobby data, Durable Object lobby shell, and game-module registry.
- Added Tetris, Codenames, 31 Seconds, and Saboteur as game modules.
- Added avatar profiles, display accounts, admin user management, recovery-key reset, completed-game results, per-game statistics, and scheduled cleanup of old debug accounts.
- Added game-specific behavior over time, including Codenames timer and time banking, Saboteur turn history and tunnel rotation rules, and 31 Seconds team scoring and overtime.
- Added per-game visual themes and responsive game layouts in the separate `voedgoem` frontend repository; these are not server implementation files.

## 2026-10-24

- **Codenames operative tags:** Added an action for operatives to tag/un-tag a word during their clue turn. The username tags are included in snapshots. The frontend uses right-click on desktop and press-and-hold on touch devices.
- **Codenames hint target correction:** Changed spymaster hints so they target an unrevealed word belonging to the opposing team, and updated the frontend eligibility and hint explanation.
- **Codenames tag visibility:** Changed tag snapshots so tag information is visible to all lobby viewers, not only the active operative team.
- **Codenames tag presentation:** Changed each tagger to an individually rendered, team-coloured label box.
- **31 Seconds display scoring view:** Introduced a reserved display viewer identity so display accounts see the active card only during the opposing captain's scoring window. Added a Durable Object tick to broadcast the transition into scoring.
- **Admin provisioning:** Promoted the existing production account named `Admin` to administrator at the user's request. This was a production data change, not a repository code change.
- **Codenames time banking:** Updated early-ended turns to carry half of the remaining time into the same team's next turn. A two-minute remainder therefore banks one minute.

## 2026-10-26

- **Repository documentation:** Added this project context, requirements, decisions, development log, current status, and architecture reference set.
- **Session handoff package:** Added a master handoff, detailed development timeline, and implementation notes. Flagged that historical production admin-account notes conflict, that the frontend README is stale, and that raw design/avatar inputs were not present in the inspected workspace.

## 2026-10-30

- **Hoster role:** Added a separate, admin-managed Hoster role. Hosters retain ordinary player access and can create and host lobbies, but do not receive admin dashboard/API or test-bot permissions. Admins can grant or revoke the role for non-admin, non-display accounts. Migrations `0006_hoster.sql` and `0007_clear_admin_hoster.sql` add the role and ensure admins aren't marked as hosters.
- **Password-protected lobbies:** Admins and Hosters can set an optional lobby password. Lobby passwords are hashed in D1, and the Durable Object withholds snapshots/actions until the password is verified. Public lobbies remain password-free by default.

## Deployment notes

Several feature changes above were deployed to the production Worker(s) according to the conversation history. No git commits were created for those deployments. For the latest confirmed deployment and verification details, see [CURRENT_STATUS.md](./CURRENT_STATUS.md).
