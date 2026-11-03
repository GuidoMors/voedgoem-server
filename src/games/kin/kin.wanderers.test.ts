import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { armyLimit, placementError } from "./buildings";
import { applyAttrition } from "./events";
import { characterPower } from "./neutrals";
import { nomadOptions } from "./wanderers";
import { sourcesFor } from "./play";
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
  for (const card of Object.values(state.cards)) { card.owner = undefined; card.tapped = false; }
  state.play!.turn = "p1";
  state.play!.passes = 0;
  return state;
}

const flat = (state: KinState) => {
  state.buildings = [];
  state.armies = [];
  state.blocks = [];
  state.world!.rivers = {};
  for (const tile of state.tiles) tile.terrain = "snow";
};

test("the Vault is built on snow and costs one army slot", () => {
  const state = playing();
  flat(state);
  addItem(state, "vault", "court:p1", "p1");
  state.players.p1.resources = { gold: 20, lumber: 20, stone: 20, food: 20 };
  const tile = tileIndex(6, 10);
  state.armies = [{ id: "a1", owner: "p1", tile, strength: 1 } as never];
  assert.match(placementError(state, "p1", "vault", { tile }) ?? "", /army limit/);
  addBuilding(state, { def: "barracks", owner: "p1", kind: "slice", tile: tileIndex(6, 12) } as never);
  assert.equal(placementError(state, "p1", "vault", { tile }), null);
  state.tiles[tile].terrain = "plains";
  assert.match(placementError(state, "p1", "vault", { tile }) ?? "", /snow/i);
  state.tiles[tile].terrain = "snow";
  const before = armyLimit(state, "p1");
  addBuilding(state, { def: "vault", owner: "p1", kind: "center", tile } as never);
  assert.equal(armyLimit(state, "p1"), before - 1);
});

test("Attrition deals 1 extra damage to armies when another player owns a Vault", () => {
  const state = playing();
  flat(state);
  const tile = tileIndex(6, 10);
  state.armies = [{ id: "a1", owner: "p1", tile, strength: 3 } as never];
  applyAttrition(state);
  assert.equal(state.armies[0].strength, 2);
  addBuilding(state, { def: "vault", owner: "p2", kind: "center", tile: tileIndex(6, 20) } as never);
  applyAttrition(state);
  assert.equal(state.armies.length, 0);
});

test("Trotskyr's power equals his forts, capped at 5", () => {
  const state = playing();
  const base = characterPower(state, "p1", "trotskyr", 1);
  for (let index = 0; index < 7; index++) addBuilding(state, { def: "fort", owner: "p1", kind: "tile", tile: tileIndex(2 + index * 2, 2) } as never);
  assert.ok(characterPower(state, "p1", "trotskyr", 1) >= base);
  assert.ok(characterPower(state, "p1", "trotskyr", 1) <= 5);
});

test("Nomads moves a village to an adjacent free snow tile", () => {
  const state = playing();
  flat(state);
  const from = tileIndex(6, 10);
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: from } as never);
  addItem(state, "nomads", "court:p1", "p1");
  addItem(state, "activation-discovery", "court:p1", "p1");
  const options = nomadOptions(state, "p1");
  assert.equal(options.length, 1);
  assert.ok(options[0].tiles.every(tile => neighbors(from).includes(tile)));
  state.play!.phase = "discovery";
  const village = options[0].village;
  const target = options[0].tiles[0];
  const source = sourcesFor(state, "p1", "discovery")[0];
  assert.ok(source);
  const move = { village, tile: target, kind: source.kind, card: source.id };
  assert.equal(dispatch(state, act("nomads", "p1", { ...move, tile: from })) === null, false);
  assert.equal(dispatch(state, act("nomads", "p1", move)), null);
  assert.equal(state.buildings.find(building => building.id === village)!.tile, target);
});
