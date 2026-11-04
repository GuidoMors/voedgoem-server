import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem, hasCard } from "./cards";
import { armyLimit, costError, placementError, population, production } from "./buildings";
import { embarkTiles } from "./play";
import { subterfugeBoard } from "./tactics";
import { deepSeasons as seasonsChange, thrallInBattle, thrallInMove, dominates } from "./deepones";
import { createRng, nextInt } from "./rng";
import { addArmy, addBuilding, setupChoices } from "./setup";
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
  dispatch(state, act("pickKin", "p1", { kin: "deepones" }));
  for (let guard = 0; state.world!.step === "setup" && guard < 50; guard++) {
    const choices = setupChoices(state)!;
    assert.equal(choices.dedicate ?? false, choices.task === "village");
    const result = dispatch(state, act("setupPlace", "p1", choices.tile !== null ? { side: choices.sides[0] } : { tile: choices.tiles[choices.tiles.length - 1], dedication: "stone" }));
    assert.equal(result, null);
  }
  while (state.world!.step === "characters") {
    const pick = eligibleCharacters(state, characterPicker(state)!, characterRound(state))[0];
    dispatch(state, act("pickCharacter", "p1", { character: pick.id }));
  }
  state.order.push("p2");
  state.players.p2 = { id: "p2", username: "p2", connected: true, resources: {} };
  for (const card of Object.values(state.cards)) { card.owner = undefined; card.tapped = false; }
  state.play!.turn = "p1";
  state.play!.passes = 0;
  return state;
}

const own = (state: KinState, id: string, player = "p1") => {
  state.cards[id] ??= { id, def: id, owner: player, zone: `court:${player}`, tapped: false } as never;
  state.cards[id].owner = player;
  state.cards[id].zone = `court:${player}`;
};

const OCEAN = tileIndex(6, 10);

function clear(state: KinState) {
  state.buildings = [];
  state.blocks = [];
  state.armies = [];
  state.world!.rivers = {};
  for (const tile of state.tiles) tile.terrain = "plains";
  state.tiles[OCEAN].terrain = "ocean";
}

test("the starting village stands on the ocean with a dedication and a worksite", () => {
  const state = playing();
  const village = state.buildings.find(b => b.def === "village" && b.owner === "p1")!;
  assert.equal(state.tiles[village.tile].terrain, "ocean");
  assert.equal(village.dedication, "stone");
  assert.ok(state.buildings.some(b => b.def === "worksite" && b.owner === "p1"));
  assert.ok(hasCard(state, "p1", "underwater-cult"));
});

test("a village needs a dedication at setup", () => {
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
  dispatch(state, act("pickKin", "p1", { kin: "deepones" }));
  const choices = setupChoices(state)!;
  assert.match(String(dispatch(state, act("setupPlace", "p1", { tile: choices.tiles[0] }))), /Dedicate/);
});

test("the Sleeping City stands on the ocean, costs 10 gold (9 with Jahatri), houses 4, makes 4 gold and raises the army limit", () => {
  const state = playing();
  clear(state);
  addItem(state, "sleeping-city", "court:p1", "p1");
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: OCEAN, dedication: "gold" } as never);
  const land = tileIndex(6, 14);
  assert.match(placementError(state, "p1", "sleeping-city", { tile: land, side: 0 }) ?? "", /ocean/i);
  const spot = neighbors(OCEAN)[0];
  state.tiles[spot].terrain = "ocean";
  assert.equal(placementError(state, "p1", "sleeping-city", { tile: spot, side: 0 }), null);
  state.players.p1.resources.gold = 9;
  assert.notEqual(costError(state, "p1", "sleeping-city", {}, { tile: spot, side: 0 }), null);
  state.players.p1.resources.gold = 10;
  assert.equal(costError(state, "p1", "sleeping-city", {}, { tile: spot, side: 0 }), null);
  own(state, "jahatri");
  state.players.p1.resources.gold = 9;
  assert.equal(costError(state, "p1", "sleeping-city", {}, { tile: spot, side: 0 }), null);
  const before = { pop: population(state, "p1"), limit: armyLimit(state, "p1"), gold: production(state, "p1").gold ?? 0 };
  addBuilding(state, { def: "sleeping-city", owner: "p1", kind: "tile", tile: spot } as never);
  assert.equal(population(state, "p1") - before.pop, 4);
  assert.equal(armyLimit(state, "p1") - before.limit, 1);
  assert.equal((production(state, "p1").gold ?? 0) - before.gold, 4);
});

test("Underwater Cult: villages only on the ocean, worksites produce the dedicated resource", () => {
  const state = playing();
  clear(state);
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: OCEAN, dedication: "lumber" } as never);
  const far = tileIndex(6, 16);
  assert.match(placementError(state, "p1", "village", { tile: far, side: 0 }) ?? "", /ocean/i);
  assert.equal(placementError(state, "p1", "worksite", { tile: OCEAN, side: 0 }), null);
  const before = production(state, "p1").lumber ?? 0;
  addBuilding(state, { def: "worksite", owner: "p1", kind: "slice", tile: OCEAN, side: 0 } as never);
  assert.equal((production(state, "p1").lumber ?? 0) - before, 1);
});

test("Benthic Walkers: no Embark", () => {
  const state = playing();
  clear(state);
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: OCEAN, dedication: "gold" } as never);
  addArmy(state, "p1", OCEAN);
  assert.deepEqual(embarkTiles(state, state.armies[0]), []);
});

test("Sha'shi'oq changes a dedication for 1 mana, Ogilgalog moves an army between villages", () => {
  const state = playing();
  clear(state);
  const second = tileIndex(6, 14);
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: OCEAN, dedication: "gold" } as never);
  const village = state.buildings[0];
  own(state, "sha-shi-oq");
  state.play!.phase = "expansion";
  state.players.p1.resources.mana = 0;
  assert.notEqual(dispatch(state, act("ability", "p1", { character: "sha-shi-oq", building: village.id, resource: "food" })), null);
  state.players.p1.resources.mana = 1;
  assert.notEqual(dispatch(state, act("ability", "p1", { character: "sha-shi-oq", building: village.id, resource: "gold" })), null);
  assert.equal(dispatch(state, act("ability", "p1", { character: "sha-shi-oq", building: village.id, resource: "food" })), null);
  assert.equal(village.dedication, "food");
  assert.equal(state.players.p1.resources.mana, 0);

  state.tiles[second].terrain = "ocean";
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: second, dedication: "gold" } as never);
  const army = addArmy(state, "p1", OCEAN);
  own(state, "ogilgalog");
  state.play!.phase = "discovery";
  state.play!.turn = "p1";
  state.play!.passes = 0;
  assert.equal(dispatch(state, act("ability", "p1", { character: "ogilgalog", army: army.id, tile: second })), null);
  assert.equal(army.tile, second);
});

test("Raheskah as general sets the opposing general's power to 0", () => {
  const state = playing();
  own(state, "raheskah");
  assert.equal(dominates(state, "p1", "raheskah"), true);
  assert.equal(dominates(state, "p1", "jahatri"), false);
  assert.equal(dominates(state, "p1", null), false);
});

test("Goahl'fiesj has power 1 only with more characters in court than any other player", () => {
  const state = playing();
  own(state, "goahl-fiesj");
  seasonsChange(state);
  assert.equal(state.charPower?.["goahl-fiesj"], 1);
  own(state, "jahatri", "p2");
  seasonsChange(state);
  assert.equal(state.charPower?.["goahl-fiesj"], 0);
  own(state, "raheskah");
  seasonsChange(state);
  assert.equal(state.charPower?.["goahl-fiesj"], 1);
});

test("Chosen Thrall: the secret character joins the court when used as general or to Move next to the army", () => {
  const state = playing();
  clear(state);
  own(state, "jahatri", "p2");
  own(state, "raheskah", "p2");
  addItem(state, "chosen-thrall", "board:phase", "p1");
  state.play!.phase = "event";
  assert.notEqual(dispatch(state, act("activateEvent", "p1", { def: "chosen-thrall", character: "nobody" })), null);
  assert.equal(dispatch(state, act("activateEvent", "p1", { def: "chosen-thrall", character: "jahatri" })), null);
  assert.equal(state.thralls?.p1, "jahatri");
  assert.equal(thrallInBattle(state, "p1", "raheskah"), false);
  assert.equal(thrallInBattle(state, "p1", "jahatri"), true);
  assert.equal(state.cards.jahatri.owner, "p1");
  assert.equal(state.thralls?.p1, undefined);

  own(state, "ogilgalog", "p2");
  (state.thralls ??= {}).p1 = "ogilgalog";
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: OCEAN, dedication: "gold" } as never);
  addArmy(state, "p1", OCEAN);
  const move = { player: "p2", source: { kind: "character", id: "ogilgalog" } } as never;
  assert.equal(thrallInMove(state, move, tileIndex(6, 20)), false);
});

test("Whispered Gifts gives another player a chosen card from the subterfuge deck", () => {
  const state = playing();
  addItem(state, "whispered-gifts", "board:phase", "p1");
  state.play!.phase = "event";
  const card = subterfugeBoard(state).deck[0];
  assert.notEqual(dispatch(state, act("activateEvent", "p1", { def: "whispered-gifts", to: "p1", card })), null);
  assert.equal(dispatch(state, act("activateEvent", "p1", { def: "whispered-gifts", to: "p2", card })), null);
  assert.ok(subterfugeBoard(state).hands.p2.includes(card));
});
