import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { placementError } from "./buildings";
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

const HOME = tileIndex(6, 10);
const own = (state: KinState, id: string, player = "p1") => {
  state.cards[id] ??= { id, def: id, owner: player, zone: `court:${player}`, tapped: false } as never;
  state.cards[id].owner = player;
  state.cards[id].zone = `court:${player}`;
};

test("the Daimyo Castle cannot be built within 3 tiles of another Castle", () => {
  const state = playing();
  state.buildings = [];
  state.world!.rivers = {};
  for (const tile of state.tiles) tile.terrain = "plains";
  addItem(state, "daimyo-castle", "court:p1", "p1");
  state.players.p1.resources = { gold: 20, lumber: 20, stone: 20, food: 20 };
  addBuilding(state, { def: "daimyo-castle", owner: "p1", kind: "center", tile: HOME } as never);
  assert.match(placementError(state, "p1", "daimyo-castle", { tile: tileIndex(6, 12) }) ?? "", /within 3/);
  assert.doesNotMatch(placementError(state, "p1", "daimyo-castle", { tile: tileIndex(6, 16) }) ?? "", /within 3/);
});

test("Influential: voters of the enacted law gain influence; Yamanano adds 3 votes for 1 influence", () => {
  const state = playing();
  addItem(state, "influential", "court:p1", "p1");
  addItem(state, "influential", "court:p2", "p2");
  own(state, "yamanano");
  state.players.p1.resources.influence = 1;
  state.play!.phase = "expansion";
  state.play!.council = { activator: "p1", laws: ["a", "b", "c"], voters: ["p1", "p2"], votes: {} };
  state.play!.turn = "p1";
  assert.equal(dispatch(state, act("vote", "p1", { law: "a", grand: true })), null);
  assert.equal(state.players.p1.resources.influence, 0);
  assert.equal(dispatch(state, act("vote", "p2", { law: "b" })), null);
  assert.equal(state.laws?.enacted, "a");
  assert.equal(state.players.p1.resources.influence, 1);
  assert.equal(state.players.p2.resources.influence ?? 0, 0);
});

test("Yuguan recruits for 1 influence without tapping the source", () => {
  const state = playing();
  state.play!.phase = "control";
  own(state, "yuguan");
  addItem(state, "recruit", "board:phase", null);
  const source = addItem(state, "activation-universal", "court:p1", "p1");
  state.players.p1.resources = { influence: 1 };
  const army = state.armies.find(candidate => candidate.owner === "p1")!;
  army.strength = 1;
  state.buildings.push({ id: "castle-t", def: "daimyo-castle", owner: "p1", kind: "center", tile: army.tile } as never);
  const result = dispatch(state, act("recruit", "p1", { kind: "item", card: source.id, army: army.id, yuguan: true }));
  assert.equal(result, null);
  assert.equal(army.strength, 2);
  assert.equal(state.players.p1.resources.influence, 0);
  assert.equal(source.tapped, false);
});

test("Beiliu converts a hostage for 4 influence", () => {
  const state = playing();
  state.play!.phase = "expansion";
  own(state, "beiliu");
  own(state, "torke");
  state.cards.torke.hostageOf = "p2";
  state.players.p1.resources.influence = 3;
  assert.match(dispatch(state, act("ability", "p1", { character: "beiliu", hostage: "torke" })) ?? "", /influence/);
  state.players.p1.resources.influence = 4;
  assert.equal(dispatch(state, act("ability", "p1", { character: "beiliu", hostage: "torke" })), null);
  assert.equal(state.cards.torke.hostageOf, undefined);
  assert.equal(state.players.p1.resources.influence, 0);
});
