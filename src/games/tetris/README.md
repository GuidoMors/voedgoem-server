# tetris server guide

Server game rules, state and validation notes. Consult the implementation and tests for current behavior; coordinate UI changes with the sibling frontend.

- Supports solo and team play.
- Solo board simulation runs on the client; team mode is server-simulated and uses the lobby's real-time tick mechanism.
- Solo play gives each player an individual board with a shared seeded piece sequence and visible opponents.
- Team mode supports host configuration of 0-8 teams. Players can join/switch teams and the host can shuffle them.
- Each teammate's spawn lane occupies a ten-column segment of a shared team board. Team members' pieces can block one another; full-width rows clear together and the team shares score, lines, and level.
- A team tops out if a new piece cannot enter its assigned lane. When the last active player/team tops out, show results to everyone; the host can return to the lobby.

## Historical implementation notes

- Solo game state is client-oriented; team mode uses a server-side shared board simulation.
- Team configuration includes 0–8 teams. Players may join/switch teams; host can shuffle teams.
- Team board width scales by member lanes; a failed spawn ends the team. Score/lines/level are shared.
- Network feel and mobile control layout have historical changes but were not fully verified in live gameplay/mobile.
