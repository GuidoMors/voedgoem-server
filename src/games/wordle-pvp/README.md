# Wordle PvP server guide

The server manages team state, puzzles, guesses, feedback, timers and results in
`index.ts`. `words.txt` is the source list of lowercase five-letter words;
`scripts/build-wordle-list.mjs` generates the TypeScript word list. Edit the
source, not the generated file.

Migration `0011_wordle_player_stats.sql` adds result fields for player guesses,
yellow discoveries and green discoveries. Keep `takeResult`, shared result
persistence and statistics aggregates aligned when changing their meaning.
Validate timers, guesses and viewer-specific snapshots with focused tests.
