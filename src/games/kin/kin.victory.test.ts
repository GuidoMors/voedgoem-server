import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { createRng, nextInt } from "./rng";
import { setupChoices } from "./setup";
import { areaLeaders, newDawnWinner, standings } from "./victory";
import type { Action, GameMode, KinState } from "./types";

const act = (type: string, id: string, extra: Record<string, unknown> = {}): Action => ({ type, actor: { id, username: id, isHost: id === "p1" }, ...extra });

function playing(): KinState {
  const state = createState(1);
  dispatch(state, act("join", "p1"));
  dispatch(state, act("start", "p1"));
  const rng = createRng(1);
  const types = ["mountain", "forest", "farmland"] as const;
  while (state.world!.step === "tiles") {
    const free = state.tiles.flatMap((tile, index) => tile.terrain === "ocean" ? [index] : []);
    let terrain: string = types[nextInt(rng, 3)];
    while (state.world!.pile[terrain as "mountain"] === 0) terrain = types[nextInt(rng, 3)];
    dispatch(state, act("placeTile", tilePlacer(state, state.world!), { tile: free[nextInt(rng, free.length)], terrain }));
  }
  state.world!.step = "kin";
  dispatch(state, act("pickKin", "p1", { kin: "hammers" }));
  for (let guard = 0; state.world!.step === "setup" && guard < 50; guard++) {
    const choices = setupChoices(state)!;
    dispatch(state, act("setupPlace", "p1", choices.task === "worksite" ? { side: choices.sides[0] } : { tile: choices.tiles[choices.tiles.length - 1] }));
  }
  while (state.world!.step === "characters") {
    const pick = eligibleCharacters(state, characterPicker(state)!, characterRound(state))[0];
    dispatch(state, act("pickCharacter", "p1", { character: pick.id }));
  }
  state.order.push("p2");
  state.players.p2 = { id: "p2", username: "p2", connected: true, resources: {} };
  return state;
}

// Both players have nothing; p1 is then given the most in the first `areas` comparison areas.
function board(areas: number, mode: GameMode = "short"): KinState {
  const state = playing();
  state.options.mode = mode;
  state.buildings = [];
  state.armies = [];
  state.items = [];
  state.players.p1.resources = {};
  state.players.p2.resources = {};
  const give = [
    () => { state.armies.push({ id: "a1", owner: "p1", tile: 0, strength: 3 }); },
    () => { state.players.p1.resources.mana = 2; },
    () => { addItem(state, "vassal-treaty", "court:p1", "p1"); },
    () => { addItem(state, "aggresive-combat", "court:p1", "p1"); },
    () => { state.players.p1.resources.relic = 1; }
  ];
  give.slice(0, areas).forEach(fn => fn());
  return state;
}

function endControl(state: KinState) {
  state.play!.phase = "control";
  state.play!.turn = "p1";
  state.play!.passes = 0;
  for (const player of state.order) {
    assert.equal(dispatch(state, act("pass", player)), null);
    if (state.result) break;
  }
}

test("a player needs the strict most in four of six areas", () => {
  assert.equal(newDawnWinner(board(3)), null);
  assert.equal(newDawnWinner(board(4)), "p1");
  assert.equal(areaLeaders(board(1)).strength, "p1");
});

test("ties do not count as the most", () => {
  const state = board(4);
  state.players.p2.resources.mana = 2;
  assert.equal(areaLeaders(state).mana, null);
  assert.equal(newDawnWinner(state), null);
});

test("a vassal's pieces count for their lord and a vassal cannot win", () => {
  const state = board(0);
  state.players.p2.resources = { mana: 3, relic: 1 };
  addItem(state, "vassal-treaty", "court:p1", "p1", "p2");
  const table = standings(state);
  assert.deepEqual(Object.keys(table), ["p1"]);
  assert.equal(table.p1.mana, 3);
  assert.equal(table.p1.relics, 1);
});

test("vassal chains count for the ultimate lord, while cycles have no eligible winner", () => {
  const state = board(0);
  state.order.push("p3");
  state.players.p3 = { id: "p3", username: "p3", connected: true, resources: { mana: 5 } };
  state.players.p1.resources.mana = 2;
  state.players.p2.resources.mana = 3;
  addItem(state, "vassal-treaty", "court:p1", "p1", "p2");
  addItem(state, "vassal-treaty", "court:p3", "p3", "p1");
  assert.deepEqual(Object.keys(standings(state)), ["p3"]);
  assert.equal(standings(state).p3.mana, 10);

  // p1 and p2 are vassals of p3; making p3 a vassal of p2 creates a cycle.
  addItem(state, "vassal-treaty", "court:p2", "p2", "p3");
  assert.deepEqual(standings(state), {});
});

test("nothing happens before the end of the Control phase, and no winner means play goes on", () => {
  const state = board(4);
  state.play!.phase = "expansion";
  state.play!.turn = "p1";
  state.play!.passes = 0;
  dispatch(state, act("pass", "p1"));
  dispatch(state, act("pass", "p2"));
  assert.equal(state.result, undefined);
  const none = board(3);
  endControl(none);
  assert.equal(none.result, undefined);
  assert.equal(none.play!.phase, "event");
  assert.equal(none.round, 2);
});

test("a short game ends when the New Dawn is won", () => {
  const state = board(4);
  endControl(state);
  assert.equal(state.phase, "results");
  assert.equal(state.result!.winner, "p1");
  assert.equal(dispatch(state, act("pass", "p2")), "The game is over.");
});

test("a long and a campaign game end because no other chapter exists yet", () => {
  for (const mode of ["long", "campaign"] as const) {
    const state = board(4, mode);
    endControl(state);
    assert.equal(state.phase, "results");
    assert.equal(state.result!.points.p1, 1);
  }
});
