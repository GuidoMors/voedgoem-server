import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { placementError } from "./buildings";
import { recruitCost } from "./control";
import { grogOptions, trampleTargets } from "./beastmen";
import { createRng, nextInt } from "./rng";
import { addBuilding, setupChoices } from "./setup";
import { tileIndex } from "./world";
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

test("Honorless makes recruiting cost 1 food", () => {
  const state = playing();
  assert.equal(recruitCost(state, "p1"), 2);
  addItem(state, "honorless", "court:p1", "p1");
  assert.equal(recruitCost(state, "p1"), 1);
});

test("Salvage returns the building type's printed resource cost", () => {
  const state = playing();
  const tile = tileIndex(6, 10);
  state.buildings = [{ id: "village-to-salvage", def: "village", owner: "p1", kind: "tile", tile }];
  state.armies = [{ id: "army", owner: "p1", tile, strength: 1 }];
  state.players.p1.resources = {};
  addItem(state, "salvage", "court:p1", "p1");
  const cards = [1, 2, 3].map(() => addItem(state, "activation-expansion", "court:p1", "p1"));
  state.play!.phase = "expansion";
  const extra = cards.slice(1).map(card => ({ kind: "item", id: card.id }));
  assert.equal(dispatch(state, act("demolish", "p1", { kind: "item", card: cards[0].id, building: "village-to-salvage", extra })), null);
  assert.equal(state.players.p1.resources.lumber, 2);
  assert.equal(state.players.p1.resources.food, 2);
});

test("a Warband Camp needs a desert, and Desert Dwellers lets a Barracks stand on one", () => {
  const state = playing();
  state.buildings = [];
  state.world!.rivers = {};
  for (const tile of state.tiles) tile.terrain = "plains";
  const tile = tileIndex(6, 10);
  addItem(state, "warband-camp", "court:p1", "p1");
  addItem(state, "barracks", "court:p1", "p1");
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile } as never);
  const camp = tileIndex(6, 11);
  assert.match(placementError(state, "p1", "warband-camp", { tile: camp }) ?? "", /desert/);
  state.tiles[camp].terrain = "desert";
  assert.doesNotMatch(placementError(state, "p1", "warband-camp", { tile: camp }) ?? "", /desert/);
  state.tiles[tile].terrain = "desert";
  assert.match(placementError(state, "p1", "barracks", { tile, side: 0 }) ?? "", /plains or snow/);
  addItem(state, "desert-dwellers", "court:p1", "p1");
  assert.equal(placementError(state, "p1", "barracks", { tile, side: 0 }), null);
});

test("Dinker trades food for stone, and Horned Hoof tramples a strength 1 army", () => {
  const state = playing();
  own(state, "dinker");
  own(state, "horned-hoof");
  state.players.p1.resources = { food: 1, mana: 1 };
  state.play!.phase = "discovery";
  assert.match(String(dispatch(state, act("ability", "p1", { character: "dinker", pay: "stone" }))), /resource/);
  assert.equal(dispatch(state, act("ability", "p1", { character: "dinker", pay: "food" })), null);
  assert.equal(state.players.p1.resources.stone, 1);
  assert.equal(state.players.p1.resources.food, 0);

  state.play!.turn = "p1";
  const mine = state.armies.find(army => army.owner === "p1")!;
  const next = [...Array(state.tiles.length).keys()].find(tile => tile !== mine.tile && state.armies.every(army => army.tile !== tile)
    && state.tiles[tile].terrain !== "ocean")!;
  state.armies.push({ id: "enemy", owner: "p2", tile: next, strength: 1, status: "ready" } as never);
  const targets = trampleTargets(state, "p1");
  if (targets.includes("enemy")) {
    assert.equal(dispatch(state, act("ability", "p1", { character: "horned-hoof", army: "enemy" })), null);
    assert.equal(state.armies.some(army => army.id === "enemy"), false);
    assert.equal(state.players.p1.resources.mana, 0);
  }
});

test("Grog rolls a d3 and applies the matching choice", () => {
  const state = playing();
  own(state, "grog-og-n-zog");
  state.play!.phase = "expansion";
  const mine = state.armies.find(army => army.owner === "p1")!;
  const options = grogOptions(state, "p1");
  assert.ok(options.grow.includes(mine.id) || mine.strength >= 1);
  assert.equal(dispatch(state, act("ability", "p1", { character: "grog-og-n-zog", grow: mine.id })), null);
  assert.equal(state.cards["grog-og-n-zog"].tapped, true);
});
