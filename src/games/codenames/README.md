# codenames server guide

Server game rules, state and validation notes. Consult the implementation and tests for current behavior; coordinate UI changes with the sibling frontend.

Word categories are maintained in this directory's `words/` text files.
`npm run words` runs `scripts/build-words.mjs` to bundle them into
`words.generated.ts`; edit the source lists rather than the generated file.

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

## Historical implementation notes

- Roles: red/blue spymaster and operatives. Red starts; red's first timer gets a +1-minute bonus.
- Team turn = spymaster clue and operative guessing; 2-minute base with any previous bank. Early finish carries half the remaining time; timeout carries none.
- Spymaster sees the key; other players see unrevealed colours only after reveal.
- Hint is a secret notification to one random connected friendly operative, but the selected card must be an unrevealed opposing-colour agent (word to avoid).
- Operatives can end turn after clue. Operatives can tag unrevealed words during the active clue turn; tags are public and show a per-player username box in team colour.
- Desktop tag: right-click. Touch: hold. A tag toggles for that user; tags do not reveal the key or count as a guess. Tags clear on turn end and when a word is revealed.
- The current frontend has a side player panel, mobile word-fit logic, a status/count bar, history, and theme-specific card styling.
