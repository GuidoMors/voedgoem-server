import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { buildPower, costError, production, placementError } from "./buildings";
import { buildOptions, demolishOptions } from "./expansion";
import { recruitPayment } from "./control";
import { abilityOptions, hasChar } from "./neutrals";
import { sourcesFor, stepCost } from "./play";
import { createRng, nextInt } from "./rng";
import { addBuilding, setupChoices } from "./setup";
import { neighbors, tileDistance, tileIndex, TILE_COUNT } from "./world";
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
  state.buildings = [];
  state.armies = [];
  state.items = state.items.filter(item => !item.zone.startsWith("court:"));
  state.world!.rivers = {};
  for (const tile of state.tiles) tile.terrain = "plains";
  state.players.p1.resources = {};
  state.play!.turn = "p1";
  state.play!.passes = 0;
  return state;
}

const own = (state: KinState, id: string, player = "p1") => {
  state.cards[id] ??= { id, def: id, owner: player, zone: `court:${player}`, tapped: false } as never;
  state.cards[id].owner = player;
  state.cards[id].zone = `court:${player}`;
  state.cards[id].tapped = false;
};

const HOME = tileIndex(6, 10);
const NEXT = tileIndex(6, 11);

test("the Great Tree produces 1 mana and takes any number of Mage Colleges, but nothing else", () => {
  const state = playing();
  addBuilding(state, { def: "the-great-tree", owner: "p1", kind: "tile", tile: HOME });
  assert.equal(production(state, "p1").mana, 1);
  addItem(state, "mage-college", "court:p1", "p1");
  addItem(state, "barracks", "court:p1", "p1");
  assert.equal(placementError(state, "p1", "mage-college", { tile: HOME, side: 0 }), null);
  addBuilding(state, { def: "mage-college", owner: "p1", kind: "slice", tile: HOME, side: 0 });
  assert.equal(placementError(state, "p1", "mage-college", { tile: HOME, side: 1 }), null);
  addBuilding(state, { def: "mage-college", owner: "p1", kind: "slice", tile: HOME, side: 1 });
  assert.match(placementError(state, "p1", "mage-college", { tile: HOME, side: 0 }) ?? "", /already built/);
  assert.match(placementError(state, "p1", "barracks", { tile: HOME, side: 2 }) ?? "", /Mage Colleges/);
  assert.equal(production(state, "p1").mana, 3);
});

test("the Great Tree cannot be demolished by its owner", () => {
  const state = playing();
  const tree = addBuilding(state, { def: "the-great-tree", owner: "p1", kind: "tile", tile: HOME });
  state.armies = [{ id: "army", owner: "p1", tile: HOME, strength: 1 }];
  assert.ok(!demolishOptions(state, "p1").some(option => option.building === tree.id));
});

test("the Great Tree cannot be built", () => {
  const state = playing();
  addItem(state, "the-great-tree", "court:p1", "p1");
  assert.match(placementError(state, "p1", "the-great-tree", { tile: HOME }) ?? "", /Kin/);
});

test("Rootwalkers: forest to forest costs a half", () => {
  const state = playing();
  state.tiles[HOME].terrain = "forest";
  state.tiles[NEXT].terrain = "forest";
  assert.equal(stepCost(state, "p1", HOME, NEXT), 2);
  addItem(state, "rootwalkers", "court:p1", "p1");
  assert.equal(stepCost(state, "p1", HOME, NEXT), 1);
});

test("Woodkin: a village can be built on a forest", () => {
  const state = playing();
  state.armies = [{ id: "a1", owner: "p1", tile: HOME, strength: 1 }];
  state.tiles[HOME].terrain = "forest";
  addItem(state, "village", "court:p1", "p1");
  assert.match(placementError(state, "p1", "village", { tile: HOME }) ?? "", /plains or snow/);
  addItem(state, "woodkin", "court:p1", "p1");
  assert.equal(placementError(state, "p1", "village", { tile: HOME }), null);
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: HOME });
  addItem(state, "barracks", "court:p1", "p1");
  assert.match(placementError(state, "p1", "barracks", { tile: HOME, side: 0 }) ?? "", /plains or snow/);
});

// A chain of tiles from the Great Tree to a forest 3 tiles away.
function chain(): number[] {
  for (let target = 0; target < TILE_COUNT; target++) {
    if (tileDistance(HOME, target) !== 3) continue;
    for (const first of neighbors(HOME)) for (const second of neighbors(first)) if (tileDistance(HOME, second) === 2 && neighbors(second).includes(target)) return [HOME, first, second, target];
  }
  throw new Error("no chain");
}
test("Seedling Villages: a village on a forest connected to the Great Tree by roads costs nothing", () => {
  const state = playing();
  addBuilding(state, { def: "the-great-tree", owner: "p1", kind: "tile", tile: HOME });
  const path = chain();
  const site = path[3];
  state.tiles[site].terrain = "forest";
  addItem(state, "village", "court:p1", "p1");
  addItem(state, "woodkin", "court:p1", "p1");
  state.players.p1.resources = {};
  for (let step = 0; step < 3; step++) addBuilding(state, { def: "road", owner: null, kind: "cross", tile: path[step], to: path[step + 1] });
  assert.match(costError(state, "p1", "village", {}, { tile: site }) ?? "", /need/);
  addItem(state, "seedling-villages", "court:p1", "p1");
  assert.equal(costError(state, "p1", "village", {}, { tile: site }), null);
  assert.equal(placementError(state, "p1", "village", { tile: site }), null);
  const option = buildOptions(state, "p1").find(entry => entry.def === "village");
  assert.ok(option?.places.some(place => place.tile === site && place.free));
  // Not connected, or not a forest: no discount.
  state.tiles[site].terrain = "plains";
  assert.match(costError(state, "p1", "village", {}, { tile: site }) ?? "", /need/);
  assert.equal(buildPower(state, "village", { tile: site }) >= 0, true);
});

test("Mana Affluent: everyone holding it gains 1 mana when someone explores a warp", () => {
  const state = playing();
  state.armies = [{ id: "a", owner: "p1", tile: HOME, strength: 1 }];
  state.blocks = [{ tile: HOME, kind: "ruins" }];
  state.play!.phase = "control";
  addItem(state, "explore", "board:phase");
  addItem(state, "quantum-collapse", "court:p1", "p1");
  addItem(state, "mana-affluent", "court:p2", "p2");
  const card = addItem(state, "activation-universal", "court:p1", "p1");
  assert.equal(dispatch(state, act("explore", "p1", { kind: "item", card: card.id, army: "a", choice: "warp" })), null);
  assert.equal(state.players.p1.resources.mana, 2);
  assert.equal(state.players.p2.resources.mana, 1);
});

test("Daegobark: recruiting can be paid with mana", () => {
  const state = playing();
  state.armies = [{ id: "a1", owner: "p1", tile: HOME, strength: 1 }];
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: HOME });
  addBuilding(state, { def: "barracks", owner: "p1", kind: "slice", tile: HOME, side: 0 });
  addItem(state, "recruit", "court:p1", "p1");
  addItem(state, "activation-control", "court:p1", "p1");
  state.players.p1.resources = { mana: 2 };
  state.play!.phase = "control";
  const source = sourcesFor(state, "p1", "control")[0];
  const action = { kind: source.kind, card: source.id, army: "a1", mana: true };
  assert.match(dispatch(state, act("recruit", "p1", action)) ?? "", /Daegobark/);
  own(state, "daegobark");
  assert.equal(recruitPayment(state, "p1", "mana"), "mana");
  assert.equal(dispatch(state, act("recruit", "p1", action)), null);
  assert.equal(state.players.p1.resources.mana, 0);
  assert.equal(state.armies[0].strength, 2);
});

test("Leavavel converts lumber into another resource for 2 mana", () => {
  const state = playing();
  own(state, "leavavel");
  state.play!.phase = "expansion";
  state.players.p1.resources = { mana: 2, lumber: 3 };
  assert.match(String(dispatch(state, act("ability", "p1", { character: "leavavel", to: "wood", amount: 1 }))), /gold, stone or food/);
  assert.match(String(dispatch(state, act("ability", "p1", { character: "leavavel", to: "gold", amount: 4 }))), /lumber/);
  assert.equal(dispatch(state, act("ability", "p1", { character: "leavavel", to: "gold", amount: 2 })), null);
  assert.deepEqual([state.players.p1.resources.mana, state.players.p1.resources.lumber, state.players.p1.resources.gold], [0, 1, 2]);
  assert.equal(state.cards.leavavel.tapped, true);
});

test("Maprassil adds 1 strength to an army on a forest", () => {
  const state = playing();
  own(state, "maprassil");
  state.play!.phase = "discovery";
  state.players.p1.resources = { mana: 2 };
  state.armies = [{ id: "a1", owner: "p1", tile: HOME, strength: 1 }];
  assert.match(String(dispatch(state, act("ability", "p1", { character: "maprassil", army: "a1" }))), /forest/);
  state.tiles[HOME].terrain = "forest";
  assert.equal(dispatch(state, act("ability", "p1", { character: "maprassil", army: "a1" })), null);
  assert.equal(state.armies[0].strength, 2);
  assert.equal(state.players.p1.resources.mana, 0);
});

test("Yewanna swaps an unbuilt armiless forest with an adjacent tile", () => {
  const state = playing();
  own(state, "yewanna");
  state.play!.phase = "discovery";
  state.players.p1.resources = { mana: 2 };
  state.tiles[HOME].terrain = "forest";
  state.armies = [{ id: "a1", owner: "p1", tile: NEXT, strength: 1 }];
  assert.match(String(dispatch(state, act("ability", "p1", { character: "yewanna", forest: HOME, tile: NEXT }))), /Choose/);
  const other = neighbors(HOME).find(tile => tile !== NEXT)!;
  state.tiles[other].terrain = "mountain";
  assert.equal(abilityOptions(state, "p1").find(option => option.character === "yewanna")?.forests?.some(entry => entry.forest === HOME && entry.tiles.includes(other)), true);
  assert.equal(dispatch(state, act("ability", "p1", { character: "yewanna", forest: HOME, tile: other })), null);
  assert.equal(state.tiles[HOME].terrain, "mountain");
  assert.equal(state.tiles[other].terrain, "forest");
  assert.equal(state.players.p1.resources.mana, 0);
});

test("Yewanna cannot move a built forest", () => {
  const state = playing();
  own(state, "yewanna");
  state.play!.phase = "discovery";
  state.players.p1.resources = { mana: 2 };
  state.tiles[HOME].terrain = "forest";
  addBuilding(state, { def: "village", owner: "p2", kind: "tile", tile: HOME });
  assert.notEqual(dispatch(state, act("ability", "p1", { character: "yewanna", forest: HOME, tile: NEXT })), null);
});

test("Birchawe borrows the ability of a character in another court until the end of the round", () => {
  const state = playing();
  own(state, "birchawe");
  own(state, "daegobark", "p2");
  own(state, "steen", "p2");
  state.play!.phase = "expansion";
  state.players.p1.resources = { mana: 4 };
  assert.equal(hasChar(state, "p1", "daegobark"), false);
  assert.match(String(dispatch(state, act("ability", "p1", { character: "birchawe", target: "birchawe" }))), /another player/);
  assert.equal(dispatch(state, act("ability", "p1", { character: "birchawe", target: "daegobark" })), null);
  assert.equal(hasChar(state, "p1", "daegobark"), true);
  assert.equal(hasChar(state, "p2", "daegobark"), false);
  assert.equal(state.players.p1.resources.mana, 2);
  assert.equal(state.cards.birchawe.tapped, true);
  // A borrowed tap ability is used through Birchawe, once he is untapped.
  state.borrowed = { birchawe: "steen" };
  state.cards.birchawe.tapped = false;
  state.play!.turn = "p1";
  assert.equal(abilityOptions(state, "p1").find(option => option.character === "birchawe")?.ability, "steen");
  assert.equal(dispatch(state, act("ability", "p1", { character: "birchawe" })), null);
  assert.equal(state.players.p1.resources.stone, 1);
  assert.equal(state.cards.birchawe.tapped, true);
});

test("Thorngast adds 3 hits when he is the attacking general", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const state = playing();
    state.rng = createRng(seed);
    own(state, "thorngast");
    state.armies = [{ id: "a1", owner: "p1", tile: HOME, strength: 1 }, { id: "a2", owner: "p2", tile: NEXT, strength: 2 }];
    state.play!.phase = "control";
    assert.equal(dispatch(state, act("battle", "p1", { kind: "character", card: "thorngast", army: "a1", tile: NEXT, dice: { strategic: 1 } })), null);
    assert.equal(dispatch(state, act("battleRespond", "p2", { dice: { strategic: 2 } })), null);
    assert.ok(state.play!.report!.attacker.hits >= 3);
  }
});
