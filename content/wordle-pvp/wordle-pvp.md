# Wordle PvP

## Style guide

- Keep the interface clean, minimal, and focused on the active puzzle. Avoid decorative effects, visual clutter, and unnecessary elements.
- Provide a day/night mode toggle that lets players switch modes at any time. Use the player's system preference as the initial mode when available.
- Day mode uses a flat white background with restrained neutral text and borders. Do not use gradients, textures, or prominent shadows.
- Night mode uses a flat, near-black background with clearly readable light text and restrained neutral borders. Maintain strong contrast without adding decorative effects.
- Keep layout, spacing, typography, and controls consistent between modes; change colors only as needed for legibility.
- Use color sparingly to distinguish the red and blue teams and to communicate Wordle feedback. Do not rely on color alone to convey feedback.
- Use simple, unobtrusive transitions when switching modes. Respect reduced-motion preferences.
- Keep the interface responsive and ensure text, puzzle tiles, and controls remain legible and usable on small screens.

## Teams and objective

- The game has two teams: red and blue.
- Each team must have at least one player before the game can start, and may have at most 10 players.
- Both teams receive the same 10 secret words, selected from `content/wordle-pvp/wordle-list.txt`. Each team has its own independent copy of each puzzle. A team scores one point for each puzzle it solves.
- The team that solves the most puzzles wins.

## Wordle rules

- Each puzzle uses standard English five-letter Wordle rules and has no guess limit.
- A guess is accepted only if it appears in `content/wordle-pvp/wordle-list.txt`.
- Reject guesses that are not in the list. The player stays on the same puzzle until submitting an accepted guess.
- After a guess, the player sees its result for 1.5 seconds.
- Unsolved puzzles circulate between teammates after each guess. Solved puzzles are removed and never circulate again.
- Players can see only the puzzle they are currently guessing and the number of puzzles in their queue. Queue contents are hidden.
- If a player has no puzzle to guess, show a waiting message with an animated three-dot indicator.

## Puzzle allocation and circulation

- At the start of the game, shuffle the 10 puzzles and deal them round-robin among each team's players. The initial queue sizes should differ by no more than one.
- After a player guesses an unsolved puzzle, show the result for 1.5 seconds, then add that puzzle to the bottom of the next teammate's queue. The player draws their next puzzle from the top of their own queue, if one is available.
- If a player solves a puzzle, remove it from circulation and have them draw from their own queue if possible.

## Timers and match end

- Each team's timer starts at 15 minutes.
- When a team solves a puzzle, subtract one minute from the opposing team's remaining time. A timer cannot go below zero.
- When a team's timer reaches zero, that team can no longer guess and its score is locked. The other team may continue playing.
- When a team solves all 10 puzzles, it can no longer guess, its score is locked, and its remaining time is frozen for the tiebreaker. The other team may continue playing.
- The match ends when all 20 puzzles are solved or when both teams' timers have reached zero.
- When the match ends, show “Wordling is over” immediately. Reveal the score and winner after five seconds.

## Winner and tiebreakers

1. The team that solved the most puzzles wins.
2. If tied, the team that used the fewest guesses wins.
3. If still tied, the team with the most time remaining when it can no longer guess wins. Freeze the time when a team finishes all 10 puzzles; a team that times out has zero time remaining.
4. If still tied, the match is a draw.
