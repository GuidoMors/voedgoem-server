import assert from "node:assert/strict";
import test from "node:test";
import { wordlePvp, wordleResult } from "./index";
import { WORDLE_WORDS } from "./words.generated";

test("Wordle feedback handles repeated letters without over-counting", () => {
  assert.deepEqual(wordleResult("apple", "allee"), ["correct", "present", "absent", "absent", "correct"]);
});

test("teams accept at most ten players without rejecting an existing member", () => {
  const state = wordlePvp.create();
  const connected = new Map(Array.from({ length: 11 }, (_, index) => [`red${index}`, `Red ${index}`]));
  const context = { connected };
  let result: unknown;
  for (let index = 0; index < 11; index++) {
    result = wordlePvp.handle(state, {
      userId: `red${index}`,
      username: `Red ${index}`,
      isHost: index === 0,
      isAdmin: false
    }, { type: "join", team: "red" }, context);
  }
  assert.deepEqual(result, { error: "The red team is full." });
  assert.equal(Object.keys(state.seats).length, 10);
  assert.equal(wordlePvp.handle(state, {
    userId: "red0", username: "Red 0", isHost: true, isAdmin: false
  }, { type: "join", team: "red" }, context), "save");
});

test("a lobby player can switch directly to the other team", () => {
  const state = wordlePvp.create();
  const connected = new Map([["player", "Player"]]);
  const context = { connected };
  const player = { userId: "player", username: "Player", isHost: true, isAdmin: false };
  wordlePvp.handle(state, player, { type: "join", team: "red" }, context);

  const redSnapshot = wordlePvp.snapshot(state, player.userId, connected);
  assert.equal(redSnapshot.options.join, true);
  assert.equal(wordlePvp.handle(state, player, { type: "join", team: "blue" }, context), "save");
  assert.equal(state.seats.player.team, "blue");
  assert.equal(state.seats.player.order, 0);
});

test("test bots can join available teams and cannot exceed team capacity", () => {
  const state = wordlePvp.create();
  const connected = new Map<string, string>();
  const context = { connected };
  for (let index = 0; index < 10; index++) {
    const userId = `red${index}`;
    connected.set(userId, `Red ${index}`);
    wordlePvp.handle(state, {
      userId, username: `Red ${index}`, isHost: index === 0, isAdmin: false
    }, { type: "join", team: "red" }, context);
  }

  const bot = { userId: "bot-1", username: "Bot 1", isHost: false, isAdmin: false };
  connected.set(bot.userId, bot.username);
  const spots = wordlePvp.openSpots?.(state, bot.userId);
  assert.deepEqual(spots, [{ type: "join", team: "blue" }]);
  assert.equal(wordlePvp.handle(state, bot, spots![0], context), "save");
  assert.equal(state.seats[bot.userId].team, "blue");
  assert.deepEqual(wordlePvp.openSpots?.(state, bot.userId), []);
  assert.deepEqual(wordlePvp.openSpots?.(state, "bot-2"), [{ type: "join", team: "blue" }]);
});

test("a new lobby stays in pregame with full, stopped timers until the host starts", () => {
  let now = 1_000;
  const originalNow = Date.now;
  Date.now = () => now;
  try {
    const state = wordlePvp.create();
    const connected = new Map([["red1", "Red One"], ["blue1", "Blue One"]]);
    const context = { connected };
    const red = { userId: "red1", username: "Red One", isHost: true, isAdmin: false };
    const blue = { userId: "blue1", username: "Blue One", isHost: false, isAdmin: false };

    assert.equal(state.phase, "lobby");
    assert.equal(wordlePvp.tickMs?.(state), null);
    now += 20 * 60_000;
    assert.equal(wordlePvp.tick(state), "volatile");
    assert.equal(wordlePvp.snapshot(state, "red1", connected).phase, "lobby");
    assert.equal(wordlePvp.snapshot(state, "red1", connected).teams.red.remainingMs, 15 * 60_000);
    assert.equal(state.words.length, 0);

    wordlePvp.handle(state, red, { type: "join", team: "red" }, context);
    wordlePvp.handle(state, blue, { type: "join", team: "blue" }, context);
    assert.equal(wordlePvp.handle(state, red, { type: "start" }, context), "save");
    assert.equal(state.phase, "playing");
    assert.equal(wordlePvp.snapshot(state, "red1", connected).teams.red.remainingMs, 15 * 60_000);
  } finally {
    Date.now = originalNow;
  }
});

test("the host can configure total time and solve penalty before the match", () => {
  let now = 1_500;
  const originalNow = Date.now;
  Date.now = () => now;
  try {
    const state = wordlePvp.create();
    const connected = new Map([["red1", "Red One"], ["blue1", "Blue One"]]);
    const context = { connected };
    const red = { userId: "red1", username: "Red One", isHost: true, isAdmin: false };
    const blue = { userId: "blue1", username: "Blue One", isHost: false, isAdmin: false };
    wordlePvp.handle(state, red, { type: "join", team: "red" }, context);
    wordlePvp.handle(state, blue, { type: "join", team: "blue" }, context);

    assert.deepEqual(wordlePvp.handle(state, blue, {
      type: "update_settings", roundMinutes: 10, penaltySeconds: 120
    }, context), "ignore");
    assert.deepEqual(wordlePvp.handle(state, red, {
      type: "update_settings", roundMinutes: 0, penaltySeconds: 120
    }, context), { error: "Total time must be between 1 and 60 minutes." });
    assert.equal(wordlePvp.handle(state, red, {
      type: "update_settings", roundMinutes: 10, penaltySeconds: 120
    }, context), "save");

    now += 10 * 60_000;
    wordlePvp.tick(state);
    assert.equal(wordlePvp.snapshot(state, "red1", connected).teams.red.remainingMs, 10 * 60_000);
    wordlePvp.handle(state, red, { type: "start" }, context);
    assert.equal(wordlePvp.snapshot(state, "red1", connected).settings.roundMinutes, 10);
    assert.equal(state.teams.red.remainingMs, 10 * 60_000);

    const puzzleId = state.teams.red.positions.red1;
    wordlePvp.handle(state, red, { type: "guess", word: state.words[puzzleId] }, context);
    assert.equal(state.teams.blue.remainingMs, 8 * 60_000);
  } finally {
    Date.now = originalNow;
  }
});

test("legacy minute-based penalty settings migrate to seconds", () => {
  const state = wordlePvp.create();
  delete state.penaltySeconds;
  state.penaltyMinutes = 1;
  wordlePvp.migrate?.(state);
  assert.equal(state.penaltySeconds, 60);
  assert.equal(state.penaltyMinutes, undefined);
});

test("teams use the same numbered words while keeping their puzzle progress independent", () => {
  let now = 1_000;
  const originalNow = Date.now;
  Date.now = () => now;
  try {
    const state = wordlePvp.create();
    const connected = new Map([["red1", "Red One"], ["blue1", "Blue One"]]);
    const context = { connected };
    const red = { userId: "red1", username: "Red One", isHost: true, isAdmin: false };
    const blue = { userId: "blue1", username: "Blue One", isHost: false, isAdmin: false };
    wordlePvp.handle(state, red, { type: "join", team: "red" }, context);
    wordlePvp.handle(state, blue, { type: "join", team: "blue" }, context);
    wordlePvp.handle(state, red, { type: "start" }, context);

    assert.equal(state.words.length, 10);
    const redView = wordlePvp.snapshot(state, "red1", connected);
    const blueView = wordlePvp.snapshot(state, "blue1", connected);
    assert.equal(redView.current?.puzzleId, 0);
    assert.equal(blueView.current?.puzzleId, 0);
    const guess = WORDLE_WORDS.find(word => word !== state.words[0])!;
    wordlePvp.handle(state, red, { type: "guess", word: guess }, context);
    const updatedRed = wordlePvp.snapshot(state, "red1", connected);
    const unchangedBlue = wordlePvp.snapshot(state, "blue1", connected);
    assert.equal(updatedRed.teams.red.puzzles[0].history.length, 1);
    assert.equal(unchangedBlue.teams.blue.puzzles[0].history.length, 0);
    assert.equal(JSON.stringify(redView.teams).includes(state.words[0]), false);
  } finally {
    Date.now = originalNow;
  }
});

test("each puzzle snapshot exposes its guess state and current player without the answer", () => {
  const originalNow = Date.now;
  Date.now = () => 1_000;
  try {
    const state = wordlePvp.create();
    const connected = new Map([["red1", "Red One"], ["red2", "Red Two"], ["blue1", "Blue One"]]);
    const context = { connected };
    const red1 = { userId: "red1", username: "Red One", isHost: true, isAdmin: false };
    const red2 = { userId: "red2", username: "Red Two", isHost: false, isAdmin: false };
    const blue1 = { userId: "blue1", username: "Blue One", isHost: false, isAdmin: false };
    wordlePvp.handle(state, red1, { type: "join", team: "red" }, context);
    wordlePvp.handle(state, red2, { type: "join", team: "red" }, context);
    wordlePvp.handle(state, blue1, { type: "join", team: "blue" }, context);
    wordlePvp.handle(state, red1, { type: "start" }, context);

    const solvedPuzzle = state.teams.red.positions.red1;
    wordlePvp.handle(state, red1, { type: "guess", word: state.words[solvedPuzzle] }, context);

    const redView = wordlePvp.snapshot(state, "red1", connected);
    const puzzles = redView.teams.red.puzzles;
    assert.equal(puzzles.length, 10);
    assert.equal(puzzles[solvedPuzzle].solved, true);
    assert.equal(puzzles[solvedPuzzle].history.length, 1);
    assert.equal(puzzles[solvedPuzzle].player?.id, "red1");
    assert.equal(puzzles[0].player?.id, "red1");
    assert.equal(redView.teams.blue.puzzles[solvedPuzzle].solved, false);
    const unsolvedPuzzle = (solvedPuzzle + 1) % state.words.length;
    assert.equal(JSON.stringify(redView.teams).includes(state.words[unsolvedPuzzle]), false);
  } finally {
    Date.now = originalNow;
  }
});

test("players start evenly spaced and advance to the next numbered unsolved puzzle", () => {
  let now = 2_000;
  const originalNow = Date.now;
  Date.now = () => now;
  try {
    const state = wordlePvp.create();
    const connected = new Map([["red1", "Red One"], ["red2", "Red Two"], ["red3", "Red Three"], ["blue1", "Blue One"]]);
    const context = { connected };
    const red1 = { userId: "red1", username: "Red One", isHost: true, isAdmin: false };
    const red2 = { userId: "red2", username: "Red Two", isHost: false, isAdmin: false };
    const red3 = { userId: "red3", username: "Red Three", isHost: false, isAdmin: false };
    const blue1 = { userId: "blue1", username: "Blue One", isHost: false, isAdmin: false };
    wordlePvp.handle(state, red1, { type: "join", team: "red" }, context);
    wordlePvp.handle(state, red2, { type: "join", team: "red" }, context);
    wordlePvp.handle(state, red3, { type: "join", team: "red" }, context);
    wordlePvp.handle(state, blue1, { type: "join", team: "blue" }, context);
    wordlePvp.handle(state, red1, { type: "start" }, context);

    assert.deepEqual(state.teams.red.positions, { red1: 0, red2: 3, red3: 6 });
    const puzzleId = state.teams.red.positions.red1;
    const answer = state.words[puzzleId];
    const invalid = wordlePvp.handle(state, red1, { type: "guess", word: "zzzzz" }, context);
    assert.deepEqual(invalid, { error: "That guess is not in the Wordle word list." });
    assert.equal(state.teams.red.guesses, 0);

    const wrongGuess = WORDLE_WORDS.find(word => word !== answer)!;
    wordlePvp.handle(state, red1, { type: "guess", word: wrongGuess }, context);
    assert.equal(state.teams.red.guesses, 1);
    assert.notEqual(state.teams.red.feedback.red1, null);

    now += 1_501;
    wordlePvp.tick(state);
    assert.equal(state.teams.red.feedback.red1, null);
    assert.equal(state.teams.red.positions.red1, 1);
    assert.equal(state.teams.red.positions.red2, 3);
  } finally {
    Date.now = originalNow;
  }
});

test("a player waits on an occupied next spot until its teammate moves", () => {
  let now = 2_500;
  const originalNow = Date.now;
  Date.now = () => now;
  try {
    const state = wordlePvp.create();
    const connected = new Map([["red1", "Red One"], ["red2", "Red Two"], ["red3", "Red Three"], ["blue1", "Blue One"]]);
    const context = { connected };
    const actors = ["red1", "red2", "red3", "blue1"].map((userId, index) => ({
      userId,
      username: `Player ${index + 1}`,
      isHost: index === 0,
      isAdmin: false
    }));
    actors.forEach((actor, index) => wordlePvp.handle(state, actor, { type: "join", team: index === 3 ? "blue" : "red" }, context));
    wordlePvp.handle(state, actors[0], { type: "start" }, context);

    const moveAndResolve = (actor: typeof actors[number]) => {
      const puzzleId = state.teams.red.positions[actor.userId];
      assert.notEqual(puzzleId, undefined);
      const guess = WORDLE_WORDS.find(word => word !== state.words[puzzleId])!;
      assert.equal(wordlePvp.handle(state, actor, { type: "guess", word: guess }, context), "save");
      now += 1_501;
      wordlePvp.tick(state);
    };

    moveAndResolve(actors[1]);
    moveAndResolve(actors[1]);
    moveAndResolve(actors[1]);
    assert.equal(state.teams.red.positions.red3, 6);
    assert.equal(state.teams.red.positions.red2, undefined);
    assert.equal(state.teams.red.waiting.red2, 6);
    const waitingView = wordlePvp.snapshot(state, "red1", connected).teams.red.puzzles[6];
    assert.equal(waitingView.player?.id, "red3");
    assert.deepEqual(waitingView.waitingPlayers.map(player => player.id), ["red2"]);

    moveAndResolve(actors[2]);
    assert.equal(state.teams.red.positions.red2, 6);
    assert.equal(state.teams.red.positions.red3, 7);
    assert.equal(state.teams.red.waiting.red2, undefined);
  } finally {
    Date.now = originalNow;
  }
});

test("solving a puzzle scores a point and subtracts one minute from the opposing timer", () => {
  let now = 3_000;
  const originalNow = Date.now;
  Date.now = () => now;
  try {
    const state = wordlePvp.create();
    const connected = new Map([["red1", "Red One"], ["blue1", "Blue One"]]);
    const context = { connected };
    const red = { userId: "red1", username: "Red One", isHost: true, isAdmin: false };
    const blue = { userId: "blue1", username: "Blue One", isHost: false, isAdmin: false };
    wordlePvp.handle(state, red, { type: "join", team: "red" }, context);
    wordlePvp.handle(state, blue, { type: "join", team: "blue" }, context);
    wordlePvp.handle(state, red, { type: "start" }, context);

    const puzzleId = state.teams.red.positions.red1;
    const answer = state.words[puzzleId];
    wordlePvp.handle(state, red, { type: "guess", word: answer }, context);

    assert.equal(state.teams.red.solved.length, 1);
    assert.equal(state.teams.red.guesses, 1);
    assert.equal(wordlePvp.snapshot(state, "blue1", connected).teams.blue.remainingMs, 14 * 60_000);
    assert.equal(state.teams.red.feedback.red1?.solved, true);
  } finally {
    Date.now = originalNow;
  }
});

test("both timed-out teams end the match and reveal results after five seconds", () => {
  let now = 4_000;
  const originalNow = Date.now;
  Date.now = () => now;
  try {
    const state = wordlePvp.create();
    const connected = new Map([["red1", "Red One"], ["blue1", "Blue One"]]);
    const context = { connected };
    const red = { userId: "red1", username: "Red One", isHost: true, isAdmin: false };
    const blue = { userId: "blue1", username: "Blue One", isHost: false, isAdmin: false };
    wordlePvp.handle(state, red, { type: "join", team: "red" }, context);
    wordlePvp.handle(state, blue, { type: "join", team: "blue" }, context);
    wordlePvp.handle(state, red, { type: "start" }, context);

    now += 15 * 60_000;
    wordlePvp.tick(state);
    assert.equal(state.phase, "ending");
    assert.equal(state.winner, "draw");

    now += 5_000;
    wordlePvp.tick(state);
    assert.equal(state.phase, "results");
    assert.equal(wordlePvp.snapshot(state, "red1", connected).winner, "draw");
  } finally {
    Date.now = originalNow;
  }
});

test("only the host can end a match and current scores determine the result", () => {
  let now = 4_000;
  const originalNow = Date.now;
  Date.now = () => now;
  try {
    const state = wordlePvp.create();
    const connected = new Map([["red1", "Red One"], ["blue1", "Blue One"]]);
    const context = { connected };
    const red = { userId: "red1", username: "Red One", isHost: true, isAdmin: false };
    const blue = { userId: "blue1", username: "Blue One", isHost: false, isAdmin: false };
    wordlePvp.handle(state, red, { type: "join", team: "red" }, context);
    wordlePvp.handle(state, blue, { type: "join", team: "blue" }, context);
    wordlePvp.handle(state, red, { type: "start" }, context);
    state.teams.red.solved.push(0);

    now += 60_000;
    assert.equal(wordlePvp.handle(state, blue, { type: "end_game" }, context), "ignore");
    assert.equal(state.phase, "playing");
    assert.equal(wordlePvp.handle(state, red, { type: "end_game" }, context), "save");
    assert.equal(state.phase, "ending");
    assert.equal(state.winner, "red");
    assert.equal(state.teams.red.remainingMs, 14 * 60_000);
    assert.equal(state.teams.blue.remainingMs, 14 * 60_000);
  } finally {
    Date.now = originalNow;
  }
});

test("per-player guesses and first yellow/green discoveries are counted once per puzzle", () => {
  let now = 5_000;
  const originalNow = Date.now;
  Date.now = () => now;
  try {
    const state = wordlePvp.create();
    const connected = new Map([["red1", "Red One"], ["blue1", "Blue One"]]);
    const context = { connected };
    const red = { userId: "red1", username: "Red One", isHost: true, isAdmin: false };
    const blue = { userId: "blue1", username: "Blue One", isHost: false, isAdmin: false };
    wordlePvp.handle(state, red, { type: "join", team: "red" }, context);
    wordlePvp.handle(state, blue, { type: "join", team: "blue" }, context);
    wordlePvp.handle(state, red, { type: "start" }, context);
    const puzzleId = state.teams.red.positions.red1;
    state.words[puzzleId] = "apple";
    const guess = WORDLE_WORDS.find(word => {
      const result = wordleResult("apple", word);
      return result.includes("present") && result.includes("correct");
    })!;

    wordlePvp.handle(state, red, { type: "guess", word: guess }, context);
    now += 1_501;
    wordlePvp.tick(state);
    state.teams.red.positions.red1 = puzzleId;
    wordlePvp.handle(state, red, { type: "guess", word: guess }, context);

    const stats = state.teams.red.playerStats.red1;
    const result = wordleResult("apple", guess);
    assert.equal(stats.guesses, 2);
    assert.equal(stats.yellow, new Set(guess.split("").filter((_, index) => result[index] === "present")).size);
    assert.equal(stats.green, result.filter(feedback => feedback === "correct").length);
    assert.deepEqual(wordlePvp.snapshot(state, "red1", connected).teams.red.players[0].stats, stats);

    wordlePvp.handle(state, red, { type: "end_game" }, context);
    now += 5_001;
    wordlePvp.tick(state);
    const recorded = wordlePvp.takeResult(state);
    assert.deepEqual(recorded?.players.find(player => player.userId === "red1") && {
      guesses: recorded.players.find(player => player.userId === "red1")?.guesses,
      yellow: recorded.players.find(player => player.userId === "red1")?.yellow,
      green: recorded.players.find(player => player.userId === "red1")?.green
    }, stats);
  } finally {
    Date.now = originalNow;
  }
});
