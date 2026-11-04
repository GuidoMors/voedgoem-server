import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { canControl, embarkOptions, harvestOptions, recruitOptions, reinforceOptions } from "./control";
import { legalSteps, sourcesFor } from "./play";
import { createRng, nextInt } from "./rng";
import { addBuilding, setupChoices } from "./setup";
import { neighbors, tileIndex } from "./world";
import type { Action, KinState } from "./types";

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

const HOME = tileIndex(6, 10);
const NEXT = tileIndex(6, 11);

// An empty plains world in the Control phase where p1 has the Control actions and three activation cards.
function control(): KinState {
  const state = playing();
  state.buildings = [];
  state.armies = [{ id: "a1", owner: "p1", tile: HOME, strength: 1 }];
  state.world!.rivers = {};
  for (const tile of state.tiles) tile.terrain = "plains";
  for (const character of Object.values(state.cards)) character.tapped = true;
  for (const def of ["recruit", "reinforce", "harvest", "embark"]) if (!state.items.some(item => item.def === def)) addItem(state, def, "court:p1", "p1");
  for (let index = 0; index < 4; index++) addItem(state, "activation-control", "court:p1", "p1");
  state.players.p1.resources = { food: 5 };
  state.play!.phase = "control";
  state.play!.turn = "p1";
  state.play!.passes = 0;
  return state;
}

const card = (state: KinState, index = 0) => sourcesFor(state, "p1", "control")[index];
const tapWith = (state: KinState, extra: Record<string, unknown>, index = 0) => ({ kind: card(state, index).kind, card: card(state, index).id, ...extra });

test("Recruit adds 1 strength to an army on a Barracks for 2 food, up to the maximum", () => {
  const state = control();
  assert.deepEqual(recruitOptions(state, "p1"), []);
  assert.match(dispatch(state, act("recruit", "p1", tapWith(state, { army: "a1" }))) ?? "", /Barracks/);
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: HOME });
  addBuilding(state, { def: "barracks", owner: "p1", kind: "slice", tile: HOME, side: 0 });
  assert.equal(dispatch(state, act("recruit", "p1", tapWith(state, { army: "a1" }))), null);
  assert.equal(state.armies[0].strength, 2);
  assert.equal(state.players.p1.resources.food, 3);
  assert.equal(state.play!.turn, "p2");
  state.play!.turn = "p1";
  state.armies[0].strength = 3;
  assert.deepEqual(recruitOptions(state, "p1"), []);
  state.armies[0].strength = 1;
  state.players.p1.resources.food = 1;
  assert.match(dispatch(state, act("recruit", "p1", tapWith(state, { army: "a1" }, 1))) ?? "", /2 food/);
});

test("Reinforce exchanges strength between two adjacent armies without passing the maximum", () => {
  const state = control();
  state.armies[0].strength = 3 - 1;
  state.armies.push({ id: "a2", owner: "p1", tile: NEXT, strength: 1 });
  state.armies.push({ id: "a3", owner: "p1", tile: tileIndex(0, 0), strength: 1 });
  assert.deepEqual(reinforceOptions(state, "p1").map(option => option.army).sort(), ["a1", "a2"]);
  const base = { first: "a1", second: "a2" };
  assert.match(dispatch(state, act("reinforce", "p1", tapWith(state, { ...base, second: "a3" }))) ?? "", /adjacent/);
  assert.match(dispatch(state, act("reinforce", "p1", tapWith(state, { ...base, strength: 0 }))) ?? "", /at least 1/);
  assert.match(dispatch(state, act("reinforce", "p1", tapWith(state, { ...base, strength: 3 }))) ?? "", /at least 1/);
  assert.match(dispatch(state, act("reinforce", "p1", tapWith(state, { ...base, strength: 2 }))) ?? "", /Nothing/);
  assert.equal(dispatch(state, act("reinforce", "p1", tapWith(state, { ...base, strength: 1 }))), null);
  assert.deepEqual([state.armies[0].strength, state.armies[1].strength], [1, 2]);
});

test("Harvest gives the resource of the tile and overexhausts the army until the Seasons Change after next", () => {
  const state = control();
  assert.deepEqual(harvestOptions(state, "p1"), []);
  state.tiles[HOME].terrain = "mountain";
  assert.equal(dispatch(state, act("harvest", "p1", tapWith(state, { army: "a1" }))), null);
  assert.equal(state.players.p1.resources.stone, 1);
  // The Control phase is not skipped; once both players pass, Seasons Change makes the overexhausted army exhausted.
  for (let guard = 0; state.round < 2 && guard < 6; guard++) dispatch(state, act("pass", state.play!.turn));
  assert.equal(state.round, 2);
  assert.equal(state.armies[0].status, "exhausted");
  assert.deepEqual(harvestOptions(state, "p1"), []);
  // An exhausted army cannot Move either.
  assert.deepEqual(legalSteps(state, state.armies[0], 20), []);
  for (let guard = 0; state.round < 3 && guard < 12; guard++) dispatch(state, act("pass", state.play!.turn));
  assert.equal(state.round, 3);
  assert.equal(state.armies[0].status, undefined);
});

test("Embark puts an army from a Harbor on an adjacent ocean and lets it move over oceans until it lands", () => {
  const state = control();
  const ocean = neighbors(HOME)[0];
  state.tiles[ocean].terrain = "ocean";
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: HOME });
  assert.deepEqual(embarkOptions(state, "p1"), []);
  addBuilding(state, { def: "harbor", owner: "p1", kind: "slice", tile: HOME, side: 1 });
  assert.deepEqual(embarkOptions(state, "p1"), [{ army: "a1", tiles: [ocean] }]);
  assert.match(dispatch(state, act("embark", "p1", tapWith(state, { army: "a1", tile: neighbors(HOME)[1] }))) ?? "", /ocean/);
  assert.equal(dispatch(state, act("embark", "p1", tapWith(state, { army: "a1", tile: ocean }))), null);
  assert.equal(state.armies[0].tile, ocean);
  assert.equal(state.armies[0].embarked, true);
  // Oceans cost ½ while embarked; the army can step back onto land and then loses the status.
  const steps = legalSteps(state, state.armies[0], 20);
  assert.ok(steps.some(step => state.tiles[step.tile].terrain === "ocean" ? step.cost === 1 : true));
  state.armies[0].embarked = false;
  assert.ok(legalSteps(state, state.armies[0], 20).every(step => state.tiles[step.tile].terrain !== "ocean"));
});

test("a player who cannot do any Control action skips the phase", () => {
  const state = control();
  assert.equal(canControl(state, "p1"), false);
  state.tiles[HOME].terrain = "forest";
  assert.equal(canControl(state, "p1"), true);
  state.items = state.items.filter(item => item.def !== "harvest");
  assert.equal(canControl(state, "p1"), false);
  const other = control();
  other.play!.phase = "expansion";
  assert.match(dispatch(other, act("harvest", "p1", tapWith(control(), { army: "a1" }))) ?? "", /Control phase/);
});
