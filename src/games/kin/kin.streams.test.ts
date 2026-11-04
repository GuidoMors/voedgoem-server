import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { placementError, production } from "./buildings";
import { demolishOptions } from "./expansion";
import { defenderBase } from "./battle";
import { abilityOptions } from "./neutrals";
import { sourcesFor } from "./play";
import { riverRoamTiles } from "./streams";
import { createRng, nextInt } from "./rng";
import { addBuilding, setupChoices } from "./setup";
import { corners, edgeId, neighbors, tileIndex, vertexNeighbors } from "./world";
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
  state.cards[id].tapped = false;
};

const HOME = tileIndex(6, 10);
const NEXT = neighbors(HOME)[0];

// An empty plains world with a village of p1 at HOME and a village of p2 next to it.
function blank(): KinState {
  const state = playing();
  state.buildings = [];
  state.armies = [];
  state.items = state.items.filter(item => !item.zone.startsWith("court:"));
  state.world!.rivers = {};
  for (const tile of state.tiles) tile.terrain = "plains";
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: HOME } as never);
  addBuilding(state, { def: "village", owner: "p2", kind: "tile", tile: NEXT } as never);
  state.players.p1.resources = { gold: 20, lumber: 20, stone: 20, food: 20 };
  state.players.p2.resources = { gold: 5, mana: 5 };
  state.play!.phase = "discovery";
  return state;
}

const trade = (state: KinState, holder: string, giver: string) => addItem(state, "trade-treaty", `court:${holder}`, holder, giver);
const holds = (state: KinState, holder: string, giver: string) => state.items.some(item => item.def === "trade-treaty" && item.zone === `court:${holder}` && item.giver === giver);

test("Tradegoods: harbors and held Trade Treaties produce 1 each at Seasons Change", () => {
  const state = blank();
  trade(state, "p1", "p2");
  addBuilding(state, { def: "harbor", owner: "p1", kind: "slice", tile: HOME, side: 0 } as never);
  assert.equal(production(state, "p1").tradegood, undefined);
  addItem(state, "tradegoods", "court:p1", "p1");
  assert.equal(production(state, "p1").tradegood, 2);
});

test("Tradegoods are bartered as a chosen basic resource; Tradespeople gain gold for a received Trade Treaty", () => {
  const state = blank();
  addItem(state, "tradegoods", "court:p1", "p1");
  state.players.p1.resources.tradegood = 3;
  own(state, "anvatsio");
  const base = { kind: "character", card: "anvatsio", to: "p2" };
  assert.match(dispatch(state, act("barter", "p1", { ...base, give: { resources: { tradegood: 2 } } })) ?? "", /basic resource/);
  assert.equal(dispatch(state, act("barter", "p1", { ...base, give: { resources: { tradegood: 2 }, tradegoodAs: "stone" } })), null);
  assert.equal(dispatch(state, act("barterRespond", "p2", { accept: true })), null);
  assert.equal(state.players.p1.resources.tradegood, 1);
  assert.equal(state.players.p2.resources.stone, 2);
  assert.equal(state.players.p2.resources.tradegood ?? 0, 0);

  state.cards.anvatsio.tapped = false;
  state.play!.turn = "p1";
  addItem(state, "trade-diplomacy", "court:p1", "p1");
  addItem(state, "tradespeopple", "court:p2", "p2");
  assert.equal(dispatch(state, act("barter", "p1", { ...base, mint: [{ def: "trade-treaty", giver: "from" }] })), null);
  assert.equal(dispatch(state, act("barterRespond", "p2", { accept: true })), null);
  assert.equal(state.players.p2.resources.gold, 6);
});

test("Guild Hall: built in a city, once per city; converts tradegoods; cannot be demolished", () => {
  const state = blank();
  state.buildings.find(building => building.tile === HOME)!.def = "city";
  addItem(state, "guild-hall", "court:p1", "p1");
  own(state, "khaz");
  state.charPower = { khaz: 4 };
  state.players.p1.resources.tradegood = 3;
  state.play!.phase = "expansion";
  const place = { tile: HOME, side: 1 };
  const go = (extra: Record<string, unknown> = {}) => dispatch(state, act("build", "p1", { kind: "character", card: "khaz", def: "guild-hall", place, extra: [], basic: {}, ...extra }));
  assert.match(go() ?? "", /Choose gold/);
  assert.equal(go({ resource: "food" }), null);
  assert.equal(state.players.p1.resources.tradegood, 0);
  assert.equal(state.players.p1.resources.food, 23);
  assert.match(placementError(state, "p1", "guild-hall", { tile: HOME, side: 2 }) ?? "", /only one Guild Hall/);
  state.armies.push({ id: "a1", owner: "p1", tile: HOME, strength: 1 } as never);
  assert.equal(demolishOptions(state, "p1").some(option => state.buildings.find(building => building.id === option.building)!.def === "guild-hall"), false);
  assert.equal(demolishOptions(state, "p1").length, 1);
  const village = state.buildings.find(building => building.def === "city")!;
  village.def = "village";
  addItem(state, "guild-hall", "court:p1", "p1");
  assert.match(placementError(state, "p1", "guild-hall", { tile: HOME, side: 3 }) ?? "", /city/);
});

test("River Roamers: a village on any tile of a river a village of yours is on, without army or adjacent building", () => {
  const state = blank();
  const FAR = tileIndex(6, 14);
  addItem(state, "village", "court:p1", "p1");
  // A river from a corner of HOME to a corner of FAR.
  const start = corners(HOME)[0];
  const end = corners(FAR)[0];
  const previous = new Map<string, string>([[start, ""]]);
  const queue = [start];
  while (queue.length && !previous.has(end)) {
    const vertex = queue.shift()!;
    for (const next of vertexNeighbors(vertex)) if (!previous.has(next)) { previous.set(next, vertex); queue.push(next); }
  }
  for (let vertex = end; previous.get(vertex); vertex = previous.get(vertex)!) state.world!.rivers[edgeId(vertex, previous.get(vertex)!)] = 0;
  for (const tile of [HOME, FAR]) { const ring = corners(tile); for (let index = 0; index < 6; index++) state.world!.rivers[edgeId(ring[index], ring[(index + 1) % 6])] = 0; }
  assert.match(placementError(state, "p1", "village", { tile: FAR }) ?? "", /one of your armies/);
  addItem(state, "river-roamers", "court:p1", "p1");
  assert.equal(riverRoamTiles(state, "p1").has(FAR), true);
  assert.equal(placementError(state, "p1", "village", { tile: FAR }), null);
  // The other rules of a village still hold: 3 tiles from every other tile building.
  assert.match(placementError(state, "p1", "village", { tile: neighbors(HOME)[3] }) ?? "", /distance/);
  // A tile away from the river is still out of reach.
  assert.match(placementError(state, "p1", "village", { tile: tileIndex(2, 3) }) ?? "", /one of your armies/);
});

test("Ruthless Capitalists: 3 tradegoods to exchange Trade Treaties with a connected player", () => {
  const state = blank();
  addItem(state, "ruthless-capitalists", "court:p1", "p1");
  own(state, "anvatsio");
  const go = () => dispatch(state, act("ruthless", "p1", { kind: "character", card: "anvatsio", target: "p2" }));
  assert.match(go() ?? "", /3 tradegoods/);
  state.players.p1.resources.tradegood = 4;
  assert.equal(go(), null);
  assert.equal(state.players.p1.resources.tradegood, 1);
  assert.equal(holds(state, "p1", "p2"), true);
  assert.equal(holds(state, "p2", "p1"), true);
  assert.equal(state.cards.anvatsio.tapped, true);
  state.cards.anvatsio.tapped = false;
  state.play!.turn = "p1";
  state.players.p1.resources.tradegood = 4;
  assert.match(go() ?? "", /connected|Trade Treaty/);
});

test("Anvatsio gives 2 gold to a player holding your Trade Treaty; Koroko turns a tradegood into 2 gold", () => {
  const state = blank();
  own(state, "anvatsio");
  own(state, "koroko");
  state.play!.phase = "discovery";
  assert.match(dispatch(state, act("ability", "p1", { character: "anvatsio", target: "p2" })) ?? "", /Trade Treaty/);
  trade(state, "p2", "p1");
  assert.equal(dispatch(state, act("ability", "p1", { character: "anvatsio", target: "p2" })), null);
  assert.equal(state.players.p2.resources.gold, 7);
  state.play!.turn = "p1";
  assert.match(dispatch(state, act("ability", "p1", { character: "koroko" })) ?? "", /tradegood/);
  state.players.p1.resources.tradegood = 1;
  assert.equal(dispatch(state, act("ability", "p1", { character: "koroko" })), null);
  assert.equal(state.players.p1.resources.gold, 22);
  assert.equal(state.players.p1.resources.tradegood, 0);
});

test("Carvano: Great Festival once per chapter, when every other player holds your Trade Treaty", () => {
  const state = blank();
  own(state, "carvano");
  state.play!.phase = "expansion";
  const go = () => dispatch(state, act("ability", "p1", { character: "carvano" }));
  assert.match(go() ?? "", /no Trade Treaties/);
  trade(state, "p1", "p2");
  assert.match(go() ?? "", /Every other player/);
  trade(state, "p2", "p1");
  const relics = state.players.p1.resources.relic ?? 0;
  assert.equal(go(), null);
  assert.equal(state.players.p1.resources.relic, relics + 1);
  state.cards.carvano.tapped = false;
  state.play!.turn = "p1";
  state.play!.phase = "expansion";
  assert.match(go() ?? "", /chapter/);
  assert.equal(abilityOptions(state, "p1").find(option => option.character === "carvano")!.reason, "Already used this chapter.");
});

test("Sunumo: Tsunami destroys a building next to an ocean within 3 tiles of your army, paying 3 mana", () => {
  const state = blank();
  own(state, "sunumo");
  state.play!.phase = "discovery";
  state.players.p1.resources.mana = 3;
  state.armies.push({ id: "a1", owner: "p1", tile: HOME, strength: 1 } as never);
  const target = state.buildings.find(building => building.owner === "p2")!;
  const go = () => dispatch(state, act("ability", "p1", { character: "sunumo", building: target.id }));
  assert.match(go() ?? "", /ocean/);
  const sea = neighbors(NEXT).find(tile => tile !== HOME)!;
  state.tiles[sea].terrain = "ocean";
  trade(state, "p1", "p2");
  assert.equal(go(), null);
  assert.equal(state.buildings.some(building => building.id === target.id), false);
  assert.equal(state.players.p1.resources.mana, 0);
  assert.equal(holds(state, "p1", "p2"), false);
});

function attackState(): KinState {
  const state = blank();
  state.play!.phase = "control";
  state.armies.push({ id: "a1", owner: "p1", tile: HOME, strength: 1 } as never);
  own(state, "qumono", "p2");
  own(state, "sneachy", "p1");
  const general = sourcesFor(state, "p1", "control").find(source => source.id === "sneachy")!;
  assert.equal(dispatch(state, act("battle", "p1", { kind: "character", card: "sneachy", army: "a1", tile: NEXT, dice: { strategic: general.power + 1 } })), null);
  return state;
}

const plea = (state: KinState) => {
  const base = defenderBase(state, "p2", NEXT);
  const power = sourcesFor(state, "p2", "control").find(source => source.id === "qumono")!.power;
  return act("battleRespond", "p2", { general: "qumono", plea: true, dice: { strategic: power + base.army + base.garrison } });
};

test("Qumono, Merciful Plea: the attacker pays 2 gold and the battle goes on", () => {
  const state = attackState();
  state.players.p2.resources.mana = 1;
  assert.match(dispatch(state, plea(state)) ?? "", /Qumono/);
  state.players.p2.resources.mana = 2;
  assert.equal(dispatch(state, plea(state)), null);
  assert.equal(state.players.p2.resources.mana, 0);
  assert.equal(state.play!.consent!.owner, "p1");
  assert.match(dispatch(state, act("battleRespond", "p2", { dice: {} })) ?? "", /Merciful Plea/);
  assert.match(dispatch(state, act("consentRespond", "p2", { accept: true })) ?? "", /not for you/);
  assert.equal(dispatch(state, act("consentRespond", "p1", { accept: true })), null);
  assert.equal(state.play!.consent, null);
  assert.equal(state.play!.battle, null);
  assert.ok(state.play!.report);
  assert.equal(state.players.p1.resources.gold, 18);
  assert.equal(state.players.p2.resources.gold, 7);
});

test("Qumono, Merciful Plea: declining cancels the attack", () => {
  const state = attackState();
  assert.equal(dispatch(state, plea(state)), null);
  assert.equal(dispatch(state, act("consentRespond", "p1", { accept: false })), null);
  assert.equal(state.play!.battle, null);
  assert.equal(state.play!.report, undefined);
  assert.equal(state.players.p1.resources.gold, 20);
  assert.equal(state.armies.find(army => army.id === "a1")!.strength, 1);
  assert.equal(state.play!.turn, "p2");
  // Qumono was chosen as general, so he is tapped even though the attack was cancelled.
  assert.equal(state.cards.qumono.tapped, true);
});

test("Qumono, Merciful Plea: an attacker with less than 2 gold pays what they have", () => {
  const state = attackState();
  state.players.p1.resources.gold = 1;
  assert.equal(dispatch(state, plea(state)), null);
  assert.equal(dispatch(state, act("consentRespond", "p1", { accept: true })), null);
  assert.equal(state.players.p1.resources.gold, 0);
  assert.equal(state.players.p2.resources.gold, 6);
});
