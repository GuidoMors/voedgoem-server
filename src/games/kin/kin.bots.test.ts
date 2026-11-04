import assert from "node:assert/strict";
import { test } from "node:test";
import { kinBotMove } from "./bots";
import { createState, dispatch } from "./engine";
import type { KinState } from "./types";

const actor = (id: string, isHost = false) => ({ id, username: id, isHost });

function autopilot(state: KinState, ids: string[]) {
  for (let step = 0; step < 2000; step++) {
    let moved = false;
    for (const id of ids) {
      if (state.play) return;
      const move = kinBotMove(state, id);
      if (!move) continue;
      const error = dispatch(state, { ...move, type: String(move.type), actor: actor(id) });
      assert.equal(error, null, `${id} ${JSON.stringify(move)}`);
      moved = true;
    }
    if (!moved) return;
  }
  assert.fail("autopilot did not settle");
}

test("bots finish the whole setup on their own and then pass their turns", () => {
  for (let run = 0; run < 20; run++) {
    const state = createState(run + 1);
    const ids = ["bot-1", "bot-2", "bot-3"];
    ids.forEach((id, index) => assert.equal(dispatch(state, { type: "join", actor: actor(id, index === 0) }), null));
    assert.equal(dispatch(state, { type: "start", actor: actor("bot-1", true) }), null);
    autopilot(state, ids);
    assert.ok(state.play, "setup should end in play");
    assert.equal(state.world?.step, "done");
    const turn = state.play!.turn;
    assert.deepEqual(kinBotMove(state, turn, { forcePass: true }), { type: "pass" });
    assert.equal(kinBotMove(state, turn, { forcePass: false }), null);
    const phase = state.play!.phase;
    const round = state.round;
    for (let count = 0; count < ids.length && state.play!.phase === phase && state.round === round; count++) {
      const current = state.play!.turn;
      const move = kinBotMove(state, current, { forcePass: true });
      assert.ok(move);
      assert.equal(dispatch(state, { ...move, type: String(move.type), actor: actor(current) }), null);
    }
    assert.ok(state.play!.phase !== phase || state.round !== round, "all passing bots advance the phase");
  }
});

test("bot play mode defaults to force pass and normal play waits for manual control", () => {
  const state = createState(1);
  state.phase = "playing";
  state.play = { phase: "discovery", turn: "bot-1", passes: 0, move: null, barter: null, verdicts: [] };
  assert.deepEqual(kinBotMove(state, "bot-1"), { type: "pass" });
  assert.deepEqual(kinBotMove(state, "bot-1", { forcePass: true }), { type: "pass" });
  assert.equal(kinBotMove(state, "bot-1", { forcePass: false }), null);
  assert.equal(kinBotMove(state, "bot-2", { forcePass: true }), null);
  assert.deepEqual(kinBotMove(state, "bot-1", { forcePass: true }), { type: "pass" });
});

test("normal-play bots still participate in automatic setup", () => {
  const state = createState(1);
  assert.equal(dispatch(state, { type: "join", actor: actor("bot-1", true) }), null);
  assert.equal(dispatch(state, { type: "start", actor: actor("bot-1", true) }), null);
  assert.equal(kinBotMove(state, "bot-1", { forcePass: false })?.type, "placeTile");
});
