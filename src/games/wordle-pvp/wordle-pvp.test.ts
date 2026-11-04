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

test("teams receive the same secret words without exposing answer text", () => {
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
    assert.notEqual(redView.current?.puzzleId, blueView.current?.puzzleId);
    assert.equal(JSON.stringify(redView).includes(state.words[redView.current!.puzzleId]), false);
  } finally {
    Date.now = originalNow;
  }
});

test("invalid guesses do not count and unsolved puzzles circulate after feedback", () => {
  let now = 2_000;
  const originalNow = Date.now;
  Date.now = () => now;
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

    const puzzleId = state.teams.red.current.red1!;
    const answer = state.words[puzzleId];
    const invalid = wordlePvp.handle(state, red1, { type: "guess", word: "zzzzz" }, context);
    assert.deepEqual(invalid, { error: "That guess is not in the Wordle word list." });
    assert.equal(state.teams.red.guesses, 0);

    const nextQueueCount = wordlePvp.snapshot(state, "red2", connected).current?.queueCount;
    const wrongGuess = WORDLE_WORDS.find(word => word !== answer)!;
    wordlePvp.handle(state, red1, { type: "guess", word: wrongGuess }, context);
    assert.equal(state.teams.red.guesses, 1);
    assert.notEqual(state.teams.red.feedback.red1, null);

    now += 1_501;
    wordlePvp.tick(state);
    assert.equal(state.teams.red.feedback.red1, null);
    assert.equal(wordlePvp.snapshot(state, "red2", connected).current?.queueCount, (nextQueueCount ?? 0) + 1);
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

    const puzzleId = state.teams.red.current.red1!;
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
