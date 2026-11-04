import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { placementError, production } from "./buildings";
import { battleTargets } from "./battle";
import { intimidates, redeemed, shownResources, virtue } from "./lumon";
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
    dispatch(state, act("setupPlace", "p1", choices.tile !== null ? { side: choices.sides[0] } : { tile: choices.tiles[choices.tiles.length - 1] }));
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

const treaties = (state: KinState, count: number) => {
  for (let index = 0; index < count; index++) addItem(state, ["peace", "access", "trade", "faction", "vassal", "promise"][index] + "-treaty", "court:p2", "p2", "p1");
};

test("Virtue counts your treaties held by other players", () => {
  const state = playing();
  addItem(state, "virtue", "court:p1", "p1");
  treaties(state, 3);
  assert.equal(virtue(state, "p1"), 3);
  assert.equal(shownResources(state, "p1").virtue, 3);
  assert.equal(virtue(state, "p2"), 0);
});

test("the Divine Sanctum costs relics, is limited to 1 and produces 4 mana", () => {
  const state = playing();
  state.buildings = [];
  state.blocks = [];
  state.world!.rivers = {};
  for (const tile of state.tiles) tile.terrain = "plains";
  const tile = tileIndex(6, 10);
  addItem(state, "divine-sanctum", "court:p1", "p1");
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile } as never);
  assert.equal(placementError(state, "p1", "divine-sanctum", { tile, side: 0 }), null);
  addBuilding(state, { def: "divine-sanctum", owner: "p1", kind: "slice", tile, side: 0 } as never);
  assert.match(placementError(state, "p1", "divine-sanctum", { tile, side: 2 }) ?? "", /only one/);
  assert.equal(production(state, "p1").mana, 4);
});

test("Open Markets lets a Market be built without a river", () => {
  const state = playing();
  state.buildings = [];
  state.world!.rivers = {};
  for (const tile of state.tiles) tile.terrain = "plains";
  const tile = tileIndex(6, 10);
  addItem(state, "market", "court:p1", "p1");
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile } as never);
  assert.match(placementError(state, "p1", "market", { tile, side: 0 }) ?? "", /river/);
  addItem(state, "open-markets", "court:p1", "p1");
  assert.equal(placementError(state, "p1", "market", { tile, side: 0 }), null);
});

test("Lumon forces a treaty and Diplomats gifts the receiver; Prishna turns basics into mana", () => {
  const state = playing();
  own(state, "lumon");
  own(state, "prishna");
  addItem(state, "virtue", "court:p1", "p1");
  addItem(state, "diplomats", "court:p1", "p1");
  addItem(state, "peace-diplomacy", "court:p1", "p1");
  for (const type of ["access", "trade", "faction", "vassal"]) addItem(state, `${type}-treaty`, "court:p2", "p2", "p1");
  state.players.p1.resources = { mana: 6, gold: 1, lumber: 1, stone: 1, food: 1 };
  state.play!.phase = "discovery";
  assert.equal(dispatch(state, act("ability", "p1", { character: "lumon", player: "p2", treaty: "peace", duration: 3 })), null);
  assert.equal(state.players.p1.resources.mana, 2);
  assert.equal(state.players.p2.resources.gear, 1);
  assert.equal(virtue(state, "p1"), 5);
  state.play!.turn = "p1";
  state.play!.phase = "expansion";
  assert.equal(dispatch(state, act("ability", "p1", { character: "prishna" })), null);
  assert.equal(state.players.p1.resources.mana, 4);
  assert.equal(state.players.p1.resources.gold, 0);
});

test("Anant and Goldenmane need enough virtue", () => {
  const state = playing();
  own(state, "anant");
  own(state, "goldenmane");
  addItem(state, "virtue", "court:p1", "p1");
  treaties(state, 4);
  assert.equal(redeemed(state, "p1"), false);
  assert.equal(intimidates(state, "p1", 2), false);
  addItem(state, "trade-treaty", "court:p2", "p2", "p1");
  addItem(state, "peace-treaty", "court:p2", "p2", "p1");
  addItem(state, "access-treaty", "court:p2", "p2", "p1");
  assert.equal(intimidates(state, "p1", 2), true);
  assert.equal(intimidates(state, "p1", 3), false);
  assert.equal(redeemed(state, "p1"), true);
  assert.equal(typeof battleTargets, "function");
});
