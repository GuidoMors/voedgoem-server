import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { armyLimit, blueprintInfo, buildPower, canAfford, costError, garrison, placeBuilding, placementError, placements, payCost, population, produce, production } from "./buildings";
import { stepCost } from "./play";
import { createRng, nextInt } from "./rng";
import { addBuilding, setupChoices } from "./setup";
import { neighbors, sideEdge, sideNeighbor, tileIndex } from "./world";
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

// An empty plains world where p1 owns every blueprint.
function blank(): KinState {
  const state = playing();
  state.buildings = [];
  state.armies = [];
  state.world!.rivers = {};
  for (const tile of state.tiles) tile.terrain = "plains";
  for (const def of ["market", "smith", "harbor", "university", "mage-college", "wall", "fort"]) addItem(state, def, "court:p1", "p1");
  state.players.p1.resources = { gold: 20, lumber: 20, stone: 20, food: 20 };
  return state;
}

const HOME = tileIndex(6, 10);
const village = (state: KinState, tile = HOME, owner = "p1") => addBuilding(state, { def: "village", owner, kind: "tile", tile });
const army = (state: KinState, tile: number, owner = "p1") => { state.armies.push({ id: `x${state.armies.length}`, owner, tile, strength: 1 }); };
const side = (tile: number, next: number) => [0, 1, 2, 3, 4, 5].find(s => sideNeighbor(tile, s) === next)!;

test("blueprint resource links preserve payable costs", () => {
  assert.deepEqual(blueprintInfo("village")?.cost, { resources: { lumber: 2, food: 2 }, basic: 0 });
  assert.deepEqual(blueprintInfo("city")?.cost, { resources: { stone: 2, gold: 2 }, basic: 0 });
  assert.deepEqual(blueprintInfo("worksite")?.cost, { resources: {}, basic: 2 });
  assert.deepEqual(blueprintInfo("divine-sanctum")?.cost, { resources: { gold: 8, relic: 2 }, basic: 0 });
});

test("a Village needs plains or snow, distance 3 and an army or a nearby building", () => {
  const state = blank();
  assert.match(placementError(state, "p1", "village", { tile: HOME }) ?? "", /armies/);
  army(state, HOME);
  assert.equal(placementError(state, "p1", "village", { tile: HOME }), null);
  state.tiles[HOME].terrain = "forest";
  assert.match(placementError(state, "p1", "village", { tile: HOME }) ?? "", /plains or snow/);
  state.tiles[HOME].terrain = "snow";
  assert.equal(placementError(state, "p1", "village", { tile: HOME }), null);

  village(state, tileIndex(6, 12), "p2");
  assert.match(placementError(state, "p1", "village", { tile: HOME }) ?? "", /distance/);
  state.buildings = [];
  village(state, tileIndex(6, 13), "p2");
  assert.equal(placementError(state, "p1", "village", { tile: HOME }), null);
  assert.match(placementError(state, "p1", "village", { tile: tileIndex(6, 13) }) ?? "", /already built/);
});

test("a building is next to one of your buildings or roads, but not another player's", () => {
  const state = blank();
  village(state);
  const next = neighbors(HOME)[0];
  assert.match(placementError(state, "p1", "fort", { tile: tileIndex(2, 2) }) ?? "", /armies/);
  assert.equal(placementError(state, "p1", "fort", { tile: next }), null);
  const far = tileIndex(6, 14);
  assert.notEqual(placementError(state, "p1", "fort", { tile: far }), null);
  // A road from the village is a connection building.
  placeBuilding(state, "p1", "road", { tile: HOME, to: next });
  const beyond = neighbors(next).find(tile => tile !== HOME && !neighbors(HOME).includes(tile))!;
  assert.equal(placementError(state, "p1", "fort", { tile: beyond }), null);
  state.buildings = state.buildings.filter(building => building.def !== "road");
  village(state, tileIndex(6, 14), "p2");
  assert.notEqual(placementError(state, "p1", "fort", { tile: beyond }), null);
});

test("a City replaces one of your villages and keeps its slice buildings", () => {
  const state = blank();
  addItem(state, "city", "court:p1", "p1");
  village(state);
  const worksite = addBuilding(state, { def: "worksite", owner: "p1", kind: "slice", tile: HOME, side: 0 });
  assert.equal(placementError(state, "p1", "city", { tile: tileIndex(2, 2) }) !== null, true);
  assert.equal(placementError(state, "p1", "city", { tile: HOME }), null);
  const built = placeBuilding(state, "p1", "city", { tile: HOME });
  assert.equal(built.def, "city");
  assert.equal(state.buildings.filter(building => building.tile === HOME && building.kind === "tile").length, 1);
  assert.ok(state.buildings.includes(worksite));
  assert.match(placementError(state, "p1", "city", { tile: HOME }) ?? "", /village/);
});

test("slice buildings go inside your tile buildings, one per side, with their own conditions", () => {
  const state = blank();
  village(state);
  const [a, b] = neighbors(HOME);
  assert.match(placementError(state, "p1", "worksite", { tile: HOME, side: side(HOME, a) }) ?? "", /farmland, forest or a mountain/);
  state.tiles[a].terrain = "farmland";
  assert.equal(placementError(state, "p1", "worksite", { tile: HOME, side: side(HOME, a) }), null);
  assert.match(placementError(state, "p1", "worksite", { tile: tileIndex(2, 2), side: 0 }) ?? "", /inside/);
  placeBuilding(state, "p1", "worksite", { tile: HOME, side: side(HOME, a) });
  assert.match(placementError(state, "p1", "smith", { tile: HOME, side: side(HOME, a) }) ?? "", /already built/);

  // A Barracks is built on plains or snow; a village on forest cannot exist, so the check is about the tile under it.
  assert.equal(placementError(state, "p1", "barracks", { tile: HOME, side: side(HOME, b) }), null);
  state.items = state.items.filter(item => item.def !== "mountain-folk");
  state.tiles[HOME].terrain = "mountain";
  assert.match(placementError(state, "p1", "barracks", { tile: HOME, side: side(HOME, b) }) ?? "", /plains or snow/);
  state.tiles[HOME].terrain = "plains";
  assert.equal(placementError(state, "p1", "smith", { tile: HOME, side: side(HOME, b) }), null);
});

test("Market and Harbor need rivers or ocean, and there is one per tile building", () => {
  const state = blank();
  village(state);
  const [a, b, c] = neighbors(HOME);
  assert.match(placementError(state, "p1", "market", { tile: HOME, side: side(HOME, a) }) ?? "", /river/);
  state.world!.rivers[sideEdge(HOME, side(HOME, a))] = 0;
  assert.equal(placementError(state, "p1", "market", { tile: HOME, side: side(HOME, a) }), null);
  placeBuilding(state, "p1", "market", { tile: HOME, side: side(HOME, a) });
  assert.match(placementError(state, "p1", "market", { tile: HOME, side: side(HOME, c) }) ?? "", /river|only one/);

  state.tiles[b].terrain = "ocean";
  assert.equal(placementError(state, "p1", "harbor", { tile: HOME, side: side(HOME, b) }), null);
  placeBuilding(state, "p1", "harbor", { tile: HOME, side: side(HOME, b) });
  state.tiles[c].terrain = "ocean";
  assert.match(placementError(state, "p1", "harbor", { tile: HOME, side: side(HOME, c) }) ?? "", /only one Harbor/);
});

test("University and Mage College must be built in a city, one of each per city", () => {
  const state = blank();
  const home = village(state);
  assert.match(placementError(state, "p1", "university", { tile: HOME, side: 0 }) ?? "", /city/);
  home.def = "city";
  assert.equal(placementError(state, "p1", "university", { tile: HOME, side: 0 }), null);
  placeBuilding(state, "p1", "university", { tile: HOME, side: 0 });
  assert.match(placementError(state, "p1", "university", { tile: HOME, side: 1 }) ?? "", /only one/);
  assert.equal(placementError(state, "p1", "mage-college", { tile: HOME, side: 1 }), null);
});

test("Roads and Walls must not touch the ocean, a Fort must not be on ocean, and nothing is built twice", () => {
  const state = blank();
  village(state);
  const [a, b] = neighbors(HOME);
  assert.equal(placementError(state, "p1", "road", { tile: HOME, to: a }), null);
  state.tiles[a].terrain = "ocean";
  assert.match(placementError(state, "p1", "road", { tile: HOME, to: a }) ?? "", /ocean/);
  assert.match(placementError(state, "p1", "wall", { tile: HOME, side: side(HOME, a) }) ?? "", /ocean/);
  assert.match(placementError(state, "p1", "fort", { tile: a }) ?? "", /ocean/);
  assert.match(placementError(state, "p1", "road", { tile: HOME, to: tileIndex(2, 2) }) ?? "", /adjacent/);

  placeBuilding(state, "p1", "road", { tile: HOME, to: b });
  assert.match(placementError(state, "p1", "road", { tile: b, to: HOME }) ?? "", /already/);
  placeBuilding(state, "p1", "wall", { tile: HOME, side: side(HOME, b) });
  assert.match(placementError(state, "p1", "wall", { tile: b, side: side(b, HOME) }) ?? "", /already a wall/);
  // A road may cross a wall.
  assert.equal(state.buildings.filter(building => building.def === "road")[0].owner, null);

  const fort = placements(state, "p1", "fort");
  assert.ok(fort.length > 0);
  assert.equal(fort.some(place => place.tile === HOME), false);
  assert.equal(fort.some(place => place.tile === a), false);
  assert.deepEqual(placements(state, "p1", "grand-observatory"), []);
});

test("build power is lowered by a Smith, and the cost can be checked and paid", () => {
  const state = blank();
  village(state);
  const next = neighbors(HOME)[0];
  assert.equal(buildPower(state, "fort", { tile: next }), 3);
  assert.equal(buildPower(state, "road", { tile: HOME, to: next }), 1);
  placeBuilding(state, "p1", "smith", { tile: HOME, side: 0 });
  assert.equal(buildPower(state, "road", { tile: HOME, to: next }), 0);
  assert.equal(buildPower(state, "worksite", { tile: HOME, side: 1 }), 0);
  assert.equal(buildPower(state, "fort", { tile: next }), 3);

  state.players.p1.resources = { gold: 1, lumber: 1, stone: 3, food: 0 };
  assert.equal(canAfford(state, "p1", "fort"), true);
  assert.equal(canAfford(state, "p1", "university"), false);
  assert.match(costError(state, "p1", "worksite", { gold: 2 }) ?? "", /spare/);
  assert.match(costError(state, "p1", "worksite", { gold: 1 }) ?? "", /exactly 2/);
  assert.equal(costError(state, "p1", "worksite", { gold: 1, lumber: 1 }), null);
  payCost(state, "p1", "fort");
  assert.deepEqual(state.players.p1.resources, { gold: 0, lumber: 1, stone: 0, food: 0 });
});

test("buildings give population, army limit, garrison and production", () => {
  const state = blank();
  const home = village(state);
  state.tiles[neighbors(HOME)[0]].terrain = "farmland";
  state.tiles[neighbors(HOME)[1]].terrain = "mountain";
  state.tiles[neighbors(HOME)[2]].terrain = "forest";
  [0, 1, 2].forEach((index) => addBuilding(state, { def: "worksite", owner: "p1", kind: "slice", tile: HOME, side: side(HOME, neighbors(HOME)[index]) }));
  addBuilding(state, { def: "barracks", owner: "p1", kind: "slice", tile: HOME, side: side(HOME, neighbors(HOME)[3]) });
  addBuilding(state, { def: "market", owner: "p1", kind: "slice", tile: HOME, side: side(HOME, neighbors(HOME)[4]) });
  assert.equal(population(state, "p1"), 1);
  assert.equal(armyLimit(state, "p1"), 2);
  assert.equal(garrison(state, home), 4);
  assert.deepEqual(production(state, "p1"), { food: 1, stone: 1, lumber: 1, gold: 1 });

  home.def = "city";
  addBuilding(state, { def: "university", owner: "p1", kind: "slice", tile: HOME, side: 5 });
  addBuilding(state, { def: "mage-college", owner: "p1", kind: "slice", tile: HOME, side: 0 });
  assert.equal(population(state, "p1"), 2);
  assert.equal(garrison(state, home), 6);
  state.players.p1.resources = {};
  produce(state);
  assert.deepEqual(state.players.p1.resources, { food: 1, stone: 1, lumber: 1, gold: 1, gear: 1, mana: 1 });
  assert.deepEqual(state.players.p2.resources, {});
});

test("Seasons Change produces at the start of every round", () => {
  const state = playing();
  const before = { ...state.players.p1.resources };
  const expected = production(state, "p1");
  assert.ok(Object.keys(expected).length > 0);
  state.round = 1;
  state.play!.phase = "control";
  state.play!.turn = "p1";
  state.play!.passes = 0;
  dispatch(state, act("pass", "p1"));
  dispatch(state, act("pass", "p2"));
  const gained = Object.entries(expected).every(([resource, amount]) => (state.players.p1.resources[resource] ?? 0) === (before[resource] ?? 0) + (amount as number));
  assert.equal(state.round, 2);
  assert.equal(gained, true);
});

test("a Wall blocks Moving across it unless you own it and a road crosses it", () => {
  const state = blank();
  const next = neighbors(HOME)[0];
  assert.equal(stepCost(state, "p1", HOME, next), 2);
  addBuilding(state, { def: "wall", owner: "p2", kind: "edge", tile: HOME, side: side(HOME, next) });
  assert.equal(stepCost(state, "p1", HOME, next), null);
  assert.equal(stepCost(state, "p1", next, HOME), null);
  addBuilding(state, { def: "road", owner: null, kind: "cross", tile: HOME, to: next });
  assert.equal(stepCost(state, "p1", HOME, next), null);
  state.buildings.find(building => building.def === "wall")!.owner = "p1";
  assert.equal(stepCost(state, "p1", HOME, next), 1);
  assert.equal(stepCost(state, "p2", HOME, next), null);
});

test("a Fort cannot be crossed by anyone but its owner, not even with an Access Treaty", () => {
  const state = blank();
  const next = neighbors(HOME)[0];
  addItem(state, "access-treaty", "court:p1", "p1", "p2");
  const house = addBuilding(state, { def: "village", owner: "p2", kind: "tile", tile: next });
  assert.equal(stepCost(state, "p1", HOME, next), 2);
  state.buildings.splice(state.buildings.indexOf(house), 1);
  addBuilding(state, { def: "fort", owner: "p2", kind: "center", tile: next });
  assert.equal(stepCost(state, "p1", HOME, next), null);
  assert.equal(stepCost(state, "p2", HOME, next), 2);
});
