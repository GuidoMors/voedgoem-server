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
- In the lobby, the host can configure the total team timer (1–60 minutes) and the time deducted from the opposing team for each solved Wordle (0–900 seconds). Defaults are 15 minutes total and a 60-second penalty.
- Both teams receive the same 10 secret words, selected from `src/games/wordle-pvp/words.txt`. Each team has its own independent copy of each puzzle. A team scores one point for each puzzle it solves.
- The editable word list contains one lowercase five-letter word per line. Add new words on their own lines; blank lines and lines beginning with `#` are ignored. Every listed word is valid both as a possible answer and as an accepted guess.
- The team that solves the most puzzles wins.

## Wordle rules

- Each puzzle uses standard English five-letter Wordle rules and has no guess limit.
- A guess is accepted only if it appears in `src/games/wordle-pvp/words.txt`.
- Reject guesses that are not in the list. The player stays on the same spot until submitting an accepted guess.
- After a guess, the player sees its result for 1.5 seconds.
- Each team has the same ten numbered Wordles with independent guesses and solved states.
- After an accepted guess and its 1.5-second feedback, the player moves to the next numbered unsolved spot, wrapping from Wordle 10 to Wordle 1. Solved spots are skipped.
- A player waits if their next unsolved spot is occupied by a teammate. When it becomes free, they take that spot; they do not skip an occupied unsolved spot.
- During play, show all ten Wordles for each team in number order, including each letter's latest guess feedback and the avatar/name of the player currently on that spot. Also show players waiting for an occupied spot.
- If a player has no available spot because all Wordles are solved, show a waiting message with an animated three-dot indicator.

## Puzzle assignment and movement

- At game start, order the ten puzzles once, then use that same order for both teams so puzzle number N has the same answer for Red and Blue.
- For each team, evenly spread players across the ten spots in join order. For example, with three players, assign spots 1, 4, and 7.
- A player's position advances to the next unsolved spot after every accepted guess, whether or not the guess solves the current Wordle. Multiple players may not occupy the same spot simultaneously.
- Keep each team's guesses, solved state, and player positions independent from the opposing team.

## Timers and match end

- A new lobby starts in pregame. Players may join either team, but no puzzles are dealt and neither timer runs before the host starts the game.
- When the host starts the game, deal the puzzles and start each team's timer at the configured total time.
- A team's remaining time stays at its configured total throughout pregame.
- When a team solves a puzzle, subtract the configured penalty in seconds from the opposing team's remaining time. A timer cannot go below zero.
- When a team's timer reaches zero, that team can no longer guess and its score is locked. The other team may continue playing.
- When a team solves all 10 puzzles, it can no longer guess, its score is locked, and its remaining time is frozen for the tiebreaker. The other team may continue playing.
- The match ends when all 20 puzzles are solved or when both teams' timers have reached zero.
- When the match ends, show “Wordling is over” immediately. Reveal the score and winner after five seconds.
- On the results screen, show each player's guesses and their first-time yellow-letter and green-position discoveries next to their avatar. Count each yellow letter once per puzzle, and each correctly identified green position once per puzzle; attribute a discovery to the player whose guess first reveals it.

## Winner and tiebreakers

1. The team that solved the most puzzles wins.
2. If tied, the team that used the fewest guesses wins.
3. If still tied, the team with the most time remaining when it can no longer guess wins. Freeze the time when a team finishes all 10 puzzles; a team that times out has zero time remaining.
4. If still tied, the match is a draw.

## Player statistics

- Track each player's accepted guesses and first-time discoveries for the finished match.
- A yellow discovery is counted once per distinct letter per puzzle, when it first receives yellow feedback for that puzzle.
- A green discovery is counted once per answer position per puzzle, when that position first receives green feedback.
- Game statistics report each player's average guesses, new yellow letters, and new green letters per game.
