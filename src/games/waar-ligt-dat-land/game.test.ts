import assert from "node:assert/strict";
import test from "node:test";
import type { Actor } from "../types";
import { waarLigtDatLand } from "./index";
import { COUNTRIES } from "./countries";
import { COUNTRY_NAMES_EN } from "./country-names-en";
import { QUESTIONS_EN } from "./questions-en";
import { QUESTIONS } from "./questions";

const host: Actor = { userId: "host", username: "Host", isHost: true, isAdmin: false };
const guest: Actor = { userId: "guest", username: "Guest", isHost: false, isAdmin: false };
const context = { connected: new Map<string, string>() };

test("the game is listed as Plenet", () => {
  assert.equal(waarLigtDatLand.info.name, "Plenet");
});

test("English country and trivia translations cover their advertised content", () => {
  assert.deepEqual(Object.keys(COUNTRIES).filter(countryId => !COUNTRY_NAMES_EN[countryId]), []);
  assert.equal(Object.keys(QUESTIONS_EN).length, 13);
  for (const [countryId, translations] of Object.entries(QUESTIONS_EN)) {
    assert.equal(translations.length, QUESTIONS[countryId as keyof typeof QUESTIONS].q.length);
    translations.forEach(([question, answer]) => {
      assert.ok(question.length > 0);
      assert.ok(answer.length > 0);
    });
  }
});

function withRandom<T>(value: number, run: () => T): T {
  const original = Math.random;
  Math.random = () => value;
  try {
    return run();
  } finally {
    Math.random = original;
  }
}

test("country guess and trivia scoring finish with a private target and a result", () => {
  withRandom(0.25, () => {
    const state = waarLigtDatLand.create();
    assert.equal(waarLigtDatLand.handle(state, host, { type: "join" }, context), "save");
    assert.equal(waarLigtDatLand.handle(state, host, { type: "setOptions", roundsPerPlayer: 1 }, context), "save");
    assert.equal(waarLigtDatLand.handle(state, host, { type: "start" }, context), "save");
    assert.equal(waarLigtDatLand.handle(state, host, { type: "draw" }, context), "save");

    const target = state.targetId!;
    const snapshot = waarLigtDatLand.snapshot(state, host.userId, new Set([host.userId]));
    assert.equal(snapshot.revealedCountryId, null);
    assert.equal("targetId" in snapshot, false);

    const wrongCountry = Object.keys(COUNTRIES).find(countryId => countryId !== target)!;
    assert.equal(waarLigtDatLand.handle(state, host, { type: "guess", countryId: wrongCountry }, context), "save");
    const duplicateGuess = waarLigtDatLand.handle(state, host, { type: "guess", countryId: wrongCountry }, context);
    assert.equal(typeof duplicateGuess, "object");
    if (typeof duplicateGuess === "object") assert.match(duplicateGuess.error, /already guessed/);
    assert.equal(waarLigtDatLand.handle(state, host, { type: "guess", countryId: target }, context), "save");
    assert.equal(state.players.host.score, 2);

    const question = state.trivia!;
    if (question.trueFalse) {
      assert.equal(waarLigtDatLand.snapshot(state, host.userId, new Set([host.userId])).trivia?.answer, null);
      assert.equal(waarLigtDatLand.handle(state, host, { type: "answer", correct: question.answer.startsWith("Waar") }, context), "save");
      const answerSnapshot = waarLigtDatLand.snapshot(state, host.userId, new Set([host.userId]));
      assert.equal(answerSnapshot.step, "turnComplete");
      assert.equal(answerSnapshot.trivia?.answer, question.answer);
      assert.equal(answerSnapshot.trivia?.questionEn, QUESTIONS_EN[target]?.[question.category]?.[0] ?? null);
      assert.equal(answerSnapshot.trivia?.response, question.answer.startsWith("Waar"));
      assert.equal(answerSnapshot.trivia?.correct, true);
      assert.equal(answerSnapshot.reviewerId, null);
      assert.equal(waarLigtDatLand.handle(state, host, { type: "grade", correct: true }, context), "ignore");
    } else {
      assert.equal(waarLigtDatLand.handle(state, host, { type: "revealAnswer" }, context), "save");
      const triviaSnapshot = waarLigtDatLand.snapshot(state, host.userId, new Set([host.userId]));
      assert.equal(triviaSnapshot.trivia?.answer, question.answer);
      assert.equal(triviaSnapshot.reviewerId, host.userId);
      assert.equal(waarLigtDatLand.handle(state, host, { type: "grade", correct: true }, context), "save");
    }

    assert.equal(state.players.host.score, 3);
    assert.equal(waarLigtDatLand.handle(state, host, { type: "next" }, context), "save");
    assert.equal(state.phase, "results");
    assert.deepEqual(waarLigtDatLand.takeResult(state)?.players, [{
      userId: "host",
      role: "player",
      won: true,
      score: 3,
      extra: 1,
      guesses: 1
    }]);
    assert.equal(waarLigtDatLand.takeResult(state), null);
    assert.equal(waarLigtDatLand.botMove(state, "bot-1"), null);
  });
});

test("question draws can select both true/false and open-ended trivia", () => {
  for (const [randomValue, expectedTrueFalse] of [[0.1, true], [0.9, false]] as const) {
    withRandom(randomValue, () => {
      const state = waarLigtDatLand.create();
      waarLigtDatLand.handle(state, host, { type: "join" }, context);
      waarLigtDatLand.handle(state, host, { type: "setOptions", roundsPerPlayer: 1 }, context);
      waarLigtDatLand.handle(state, host, { type: "start" }, context);
      waarLigtDatLand.handle(state, host, { type: "draw" }, context);
      waarLigtDatLand.handle(state, host, { type: "guess", countryId: state.targetId }, context);
      assert.equal(state.trivia?.trueFalse, expectedTrueFalse);
    });
  }
});

test("countries missing one trivia type receive a translated geography fallback", () => {
  const noTrueFalse = Object.keys(QUESTIONS).find(countryId =>
    !QUESTIONS[countryId as keyof typeof QUESTIONS].q.some(([question, answer]) =>
      question.startsWith("Klopt het") && /^(Waar|Niet waar)/.test(answer)
    )
  );
  const noOpenQuestion = Object.keys(QUESTIONS).find(countryId =>
    QUESTIONS[countryId as keyof typeof QUESTIONS].q.every(([question, answer]) =>
      question.startsWith("Klopt het") && /^(Waar|Niet waar)/.test(answer)
    )
  );
  assert.ok(noTrueFalse);
  assert.ok(noOpenQuestion);

  for (const [countryId, randomValue, expectedTrueFalse] of [
    [noTrueFalse, 0.1, true],
    [noOpenQuestion, 0.9, false]
  ] as const) {
    withRandom(randomValue, () => {
      const state = waarLigtDatLand.create();
      waarLigtDatLand.handle(state, host, { type: "join" }, context);
      waarLigtDatLand.handle(state, host, { type: "setOptions", roundsPerPlayer: 1 }, context);
      waarLigtDatLand.handle(state, host, { type: "start" }, context);
      state.deck = [countryId];
      waarLigtDatLand.handle(state, host, { type: "draw" }, context);
      waarLigtDatLand.handle(state, host, { type: "guess", countryId }, context);
      assert.equal(state.trivia?.trueFalse, expectedTrueFalse);
      assert.equal(state.trivia?.category, 5);
      assert.ok(state.trivia?.questionEn);
      assert.ok(state.trivia?.answerEn);
    });
  }
});

test("the next connected player reviews an open answer and only their decision scores", () => {
  withRandom(0.9, () => {
    const state = waarLigtDatLand.create();
    waarLigtDatLand.handle(state, host, { type: "join" }, context);
    waarLigtDatLand.handle(state, guest, { type: "join" }, context);
    waarLigtDatLand.handle(state, host, { type: "setOptions", roundsPerPlayer: 1 }, context);
    waarLigtDatLand.handle(state, host, { type: "start" }, context);
    state.deck = ["NLD"];
    waarLigtDatLand.handle(state, host, { type: "draw" }, context);
    waarLigtDatLand.handle(state, host, { type: "guess", countryId: state.targetId }, context);

    const question = state.trivia!;
    assert.equal(question.trueFalse, false);
    assert.equal(waarLigtDatLand.handle(state, host, { type: "revealAnswer" }, context), "save");
    const publicSnapshot = waarLigtDatLand.snapshot(state, guest.userId, new Set([host.userId, guest.userId]));
    assert.equal(publicSnapshot.reviewerId, guest.userId);
    assert.equal(publicSnapshot.trivia?.answer, question.answer);
    assert.equal(publicSnapshot.trivia?.response, null);
    assert.equal(waarLigtDatLand.handle(state, host, { type: "grade", correct: true }, context), "ignore");
    assert.equal(state.players.host.score, 3);
    assert.equal(waarLigtDatLand.handle(state, guest, { type: "grade", correct: true }, context), "save");
    assert.equal(state.players.host.score, 4);
    assert.equal(waarLigtDatLand.handle(state, guest, { type: "grade", correct: false }, context), "ignore");
  });
});

test("true/false answers are checked immediately and never need a reviewer", () => {
  withRandom(0.1, () => {
    const state = waarLigtDatLand.create();
    waarLigtDatLand.handle(state, host, { type: "join" }, context);
    waarLigtDatLand.handle(state, guest, { type: "join" }, context);
    waarLigtDatLand.handle(state, host, { type: "setOptions", roundsPerPlayer: 1 }, context);
    waarLigtDatLand.handle(state, host, { type: "start" }, context);
    state.deck = ["NLD"];
    waarLigtDatLand.handle(state, host, { type: "draw" }, context);
    waarLigtDatLand.handle(state, host, { type: "guess", countryId: state.targetId }, context);
    assert.equal(state.trivia?.trueFalse, true);

    const correctAnswer = state.trivia!.answer.startsWith("Waar");
    const scoreBefore = state.players.host.score;
    assert.equal(waarLigtDatLand.handle(state, host, { type: "answer", correct: !correctAnswer }, context), "save");
    const snapshot = waarLigtDatLand.snapshot(state, guest.userId, new Set([host.userId, guest.userId]));
    assert.equal(snapshot.step, "turnComplete");
    assert.equal(snapshot.reviewerId, null);
    assert.equal(snapshot.trivia?.correct, false);
    assert.equal(snapshot.trivia?.answer, state.trivia?.answer);
    assert.equal(state.players.host.score, scoreBefore);
    assert.equal(waarLigtDatLand.handle(state, guest, { type: "grade", correct: true }, context), "ignore");
  });
});

test("a saved true/false answer from the previous review flow is resolved once", () => {
  withRandom(0.1, () => {
    const state = waarLigtDatLand.create();
    waarLigtDatLand.handle(state, host, { type: "join" }, context);
    waarLigtDatLand.handle(state, guest, { type: "join" }, context);
    waarLigtDatLand.handle(state, host, { type: "setOptions", roundsPerPlayer: 1 }, context);
    waarLigtDatLand.handle(state, host, { type: "start" }, context);
    state.deck = ["NLD"];
    waarLigtDatLand.handle(state, host, { type: "draw" }, context);
    waarLigtDatLand.handle(state, host, { type: "guess", countryId: state.targetId }, context);
    assert.equal(state.trivia?.trueFalse, true);

    state.triviaResponse = state.trivia!.answer.startsWith("Waar");
    state.triviaAnswerRevealed = true;
    state.step = "answer";
    const scoreBefore = state.players.host.score;
    assert.equal(waarLigtDatLand.handle(state, guest, { type: "grade", correct: false }, context), "save");
    assert.equal(state.step, "turnComplete");
    assert.equal(state.triviaCorrect, true);
    assert.equal(state.players.host.score, scoreBefore + 1);
    assert.equal(waarLigtDatLand.handle(state, host, { type: "next" }, context), "save");
    assert.equal(state.triviaCorrect, null);
    assert.equal(state.players.host.score, scoreBefore + 1);
  });
});

test("only the active joined player can act and a match disconnect preserves the seat", () => {
  const state = waarLigtDatLand.create();
  assert.equal(waarLigtDatLand.openSpots(state, "bot-1").length, 1);
  assert.equal(waarLigtDatLand.handle(state, host, { type: "join" }, context), "save");
  assert.equal(waarLigtDatLand.handle(state, guest, { type: "join" }, context), "save");
  assert.equal(waarLigtDatLand.handle(state, host, { type: "start" }, context), "save");
  assert.equal(waarLigtDatLand.handle(state, host, { type: "draw" }, context), "save");

  const target = state.targetId!;
  assert.equal(waarLigtDatLand.handle(state, guest, { type: "guess", countryId: target }, context), "ignore");
  assert.equal(waarLigtDatLand.disconnect(state, host.userId), true);
  assert.deepEqual([...waarLigtDatLand.participants(state)], ["host", "guest"]);
  assert.equal(state.turnIndex, 1);
  assert.equal(waarLigtDatLand.connect(state, host.userId), true);
  assert.equal(state.players.host.connected, true);
  assert.equal(waarLigtDatLand.openSpots(state, "bot-1").length, 0);
});

test("the third wrong country reveals the target without awarding location points", () => {
  const state = waarLigtDatLand.create();
  waarLigtDatLand.handle(state, host, { type: "join" }, context);
  waarLigtDatLand.handle(state, host, { type: "setOptions", roundsPerPlayer: 1 }, context);
  waarLigtDatLand.handle(state, host, { type: "start" }, context);
  waarLigtDatLand.handle(state, host, { type: "draw" }, context);

  const wrongCountries = Object.keys(COUNTRIES).filter(countryId => countryId !== state.targetId).slice(0, 3);
  for (const countryId of wrongCountries) {
    assert.equal(waarLigtDatLand.handle(state, host, { type: "guess", countryId }, context), "save");
  }

  assert.equal(state.players.host.score, 0);
  assert.equal(state.step, "turnComplete");
  assert.equal(waarLigtDatLand.snapshot(state, host.userId, new Set()).revealedCountryId, state.targetId);
});
