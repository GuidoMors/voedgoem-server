import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { armyLimit, buildPower } from "./buildings";
import { buildOptions, canExpand, demolishOptions, deployOptions } from "./expansion";
import { sourcesFor } from "./play";
import { createRng, nextInt } from "./rng";
import { addBuilding, setupChoices } from "./setup";
import { sideNeighbor, tileIndex } from "./world";
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

// An empty plains world in the Expansion phase where p1 has the Expansion actions, a few activation cards and plenty of resources.
function expansion(cards = 3): KinState {
  const state = playing();
  state.buildings = [];
  state.armies = [{ id: "a1", owner: "p1", tile: HOME, strength: 1 }];
  state.world!.rivers = {};
  for (const tile of state.tiles) tile.terrain = "plains";
  for (const character of Object.values(state.cards)) character.tapped = true;
  for (const def of ["build", "deploy", "demolish", "smith", "wall", "barracks"]) addItem(state, def, "court:p1", "p1");
  for (let index = 0; index < cards; index++) addItem(state, "activation-expansion", "court:p1", "p1");
  state.players.p1.resources = { gold: 20, lumber: 20, stone: 20, food: 20 };
  state.play!.phase = "expansion";
  state.play!.turn = "p1";
  state.play!.passes = 0;
  return state;
}

const cardsOf = (state: KinState) => sourcesFor(state, "p1", "expansion");
const ref = (card: { kind: string; id: string }) => ({ kind: card.kind, id: card.id });

test("Build places the building, pays its cost and taps the cards that paid", () => {
  const state = expansion(8);
  const village = { tile: HOME };
  const power = buildPower(state, "village", { tile: HOME });
  const [first, ...rest] = cardsOf(state);
  assert.ok(power >= 1);
  const before = { ...state.players.p1.resources };
  const extra = rest.slice(0, power - first.power).map(ref);
  assert.equal(dispatch(state, act("build", "p1", { kind: first.kind, card: first.id, def: "village", place: { tile: HOME }, extra })), null);
  const built = state.buildings.find(building => building.def === "village")!;
  assert.equal(built.owner, "p1");
  assert.equal(built.tile, HOME);
  assert.notDeepEqual(state.players.p1.resources, before);
  assert.equal(state.items.find(item => item.id === first.id)!.tapped, true);
});

test("Build refuses bad places, too little power and overpaying", () => {
  const state = expansion(8);
  const [first, second, third] = cardsOf(state);
  const base = { kind: first.kind, card: first.id, def: "village", place: { tile: HOME }, extra: [] as unknown[] };
  assert.match(dispatch(state, act("build", "p1", { ...base, place: { tile: tileIndex(0, 0) } })) ?? "", /armies/);
  const power = buildPower(state, "village", { tile: HOME });
  if (power > first.power) assert.match(dispatch(state, act("build", "p1", base)) ?? "", /build power/);
  assert.match(dispatch(state, act("build", "p1", { ...base, extra: [ref(first)] })) ?? "", /only once/);
  assert.match(dispatch(state, act("build", "p1", { ...base, def: "city" })) ?? "", /village/);
  const need = Math.max(0, power - first.power);
  const tooMany = cardsOf(state).slice(1, need + 3).map(ref);
  assert.match(dispatch(state, act("build", "p1", { ...base, extra: tooMany })) ?? "", /more cards than needed/);
  state.players.p1.resources = {};
  assert.match(dispatch(state, act("build", "p1", base)) ?? "", /You need|spare|basic/);
});

test("Build is only possible in the Expansion phase with an untapped card and the action card", () => {
  const state = expansion();
  const [first] = cardsOf(state);
  const action = { kind: first.kind, card: first.id, def: "village", place: { tile: HOME }, extra: [] };
  state.play!.phase = "discovery";
  assert.match(dispatch(state, act("build", "p1", action)) ?? "", /Expansion phase/);
  state.play!.phase = "expansion";
  state.items = state.items.filter(item => item.def !== "build");
  assert.match(dispatch(state, act("build", "p1", action)) ?? "", /action card/);
  state.play!.turn = "p2";
  assert.match(dispatch(state, act("build", "p1", action)) ?? "", /not your turn/);
});

test("a City is built on a Village and keeps its slices", () => {
  const state = expansion(4);
  addItem(state, "city", "court:p1", "p1");
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: HOME });
  addBuilding(state, { def: "barracks", owner: "p1", kind: "slice", tile: HOME, side: 0 });
  const power = buildPower(state, "city", { tile: HOME });
  const cards = cardsOf(state);
  let paid = 0;
  const used = [];
  for (const card of cards) { if (paid >= power) break; used.push(card); paid += card.power; }
  const [first, ...rest] = used;
  assert.equal(dispatch(state, act("build", "p1", { kind: first.kind, card: first.id, def: "city", place: { tile: HOME }, extra: rest.map(ref) })), null);
  assert.equal(state.buildings.filter(building => building.kind === "tile").length, 1);
  assert.equal(state.buildings.find(building => building.kind === "tile")!.def, "city");
  assert.equal(state.buildings.filter(building => building.def === "barracks").length, 1);
});

test("Deploy puts a new army on a Barracks until the army limit is reached", () => {
  const state = expansion();
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: HOME });
  assert.deepEqual(deployOptions(state, "p1"), []);
  const barracks = addBuilding(state, { def: "barracks", owner: "p1", kind: "slice", tile: HOME, side: 0 });
  assert.equal(armyLimit(state, "p1"), 2);
  assert.deepEqual(deployOptions(state, "p1"), [barracks.id]);
  const [first] = cardsOf(state);
  assert.match(dispatch(state, act("deploy", "p1", { kind: first.kind, card: first.id, building: "nope" })) ?? "", /Choose one of your buildings/);
  assert.equal(dispatch(state, act("deploy", "p1", { kind: first.kind, card: first.id, building: barracks.id })), null);
  assert.equal(state.armies.length, 2);
  assert.equal(state.armies[1].tile, HOME);
  assert.equal(state.armies[1].strength, 1);
  assert.deepEqual(deployOptions(state, "p1"), []);
  state.play!.turn = "p1";
  const [second] = cardsOf(state);
  assert.match(dispatch(state, act("deploy", "p1", { kind: second.kind, card: second.id, building: barracks.id })) ?? "", /army limit/);
});

test("Demolish removes a building with your army on it, and the slices inside a tile building", () => {
  const state = expansion(4);
  const village = addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: HOME });
  addBuilding(state, { def: "barracks", owner: "p1", kind: "slice", tile: HOME, side: 0 });
  const other = addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: tileIndex(6, 15) });
  assert.deepEqual(demolishOptions(state, "p1").map(option => option.building).sort(), [village.id, state.buildings[1].id].sort());
  const [first, ...rest] = cardsOf(state);
  const base = { kind: first.kind, card: first.id, building: village.id };
  assert.match(dispatch(state, act("demolish", "p1", { ...base, building: other.id })) ?? "", /army of yours/);
  assert.match(dispatch(state, act("demolish", "p1", { ...base, extra: [] })) ?? "", /build power/);
  assert.equal(dispatch(state, act("demolish", "p1", { ...base, extra: rest.slice(0, 2).map(ref) })), null);
  assert.deepEqual(state.buildings.map(building => building.id), [other.id]);
});

test("Demolish a wall next to your army needs 4 power; a wall of another player breaks treaties", () => {
  const state = expansion(5);
  const next = tileIndex(6, 11);
  const side = [0, 1, 2, 3, 4, 5].find(candidate => sideNeighbor(HOME, candidate) === next)!;
  const wall = addBuilding(state, { def: "wall", owner: "p2", kind: "edge", tile: HOME, side });
  const [first, ...rest] = cardsOf(state);
  assert.deepEqual(demolishOptions(state, "p1"), [{ building: wall.id, power: 4 }]);
  assert.match(dispatch(state, act("demolish", "p1", { kind: first.kind, card: first.id, building: wall.id, extra: rest.slice(0, 2).map(ref) })) ?? "", /build power/);
  const treaty = addItem(state, "peace-treaty", "court:p1", "p1");
  treaty.giver = "p2";
  assert.equal(dispatch(state, act("demolish", "p1", { kind: first.kind, card: first.id, building: wall.id, extra: rest.slice(0, 3).map(ref) })), null);
  assert.equal(state.buildings.length, 0);
  assert.ok(!state.items.includes(treaty));
});

test("the Expansion phase is skipped when nobody can do anything in it", () => {
  const state = expansion(0);
  assert.equal(canExpand(state, "p1"), false);
  const withCard = expansion(1);
  assert.equal(canExpand(withCard, "p1"), buildOptions(withCard, "p1").some(option => option.places.some(place => place.power <= 1)) || demolishOptions(withCard, "p1").some(option => option.power <= 1));
});
