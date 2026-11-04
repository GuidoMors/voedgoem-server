import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { placementError } from "./buildings";
import { blocksAt, exploreOptions, isUnbuiltTile, reclaimOptions, ruinsSpots } from "./archeology";
import { eventOptions } from "./events";
import { kin } from "./index";
import { sourcesFor } from "./play";
import { createRng, nextInt } from "./rng";
import { addBuilding, setupChoices } from "./setup";
import { tileIndex } from "./world";
import type { Action, KinState } from "./types";

const act = (type: string, id: string, extra: Record<string, unknown> = {}): Action => ({ type, actor: { id, username: id, isHost: id === "p1" }, ...extra });

// Two players in the Event phase of the first round.
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

// An empty plains world: p1 has one army and all of their characters are tapped, so only activation cards pay.
function empty(phase: "event" | "expansion" | "control"): KinState {
  const state = playing();
  state.buildings = [];
  state.armies = [{ id: "a1", owner: "p1", tile: HOME, strength: 1 }];
  state.world!.rivers = {};
  for (const tile of state.tiles) tile.terrain = "plains";
  for (const character of Object.values(state.cards)) character.tapped = true;
  for (const item of state.items) if (item.zone === "court:p1") item.tapped = false;
  state.play!.phase = phase;
  state.play!.turn = "p1";
  state.play!.passes = 0;
  return state;
}

const onBoard = (state: KinState, def: string) => state.items.find(item => item.def === def && item.zone === "board:phase") ?? addItem(state, def, "board:phase");

test("an empty Event phase is skipped with Seasons Change already activated", () => {
  const state = playing();
  assert.equal(state.play!.phase, "discovery");
  assert.equal(state.round, 1);
  assert.equal(state.items.find(item => item.def === "seasons-change")!.tapped, true);
  assert.deepEqual(eventOptions(state), []);
});

test("Event turns without playable cards skip to a player with a faction event", () => {
  const state = empty("event");
  state.world!.kinPicks.p2 = "ark";
  addItem(state, "the-eternal-ark", "court:p2", "p2");
  onBoard(state, "calculators");
  assert.deepEqual(eventOptions(state, "p1"), []);
  assert.deepEqual(eventOptions(state, "p2"), ["calculators"]);
  const snap = kin.snapshot(state, "p1", new Set(["p1", "p2"])) as { world: { play: { autoEventPass: boolean } } };
  assert.equal(snap.world.play.autoEventPass, true);
  assert.equal(dispatch(state, act("forcePass", "p2")), null);
  assert.equal(state.play!.phase, "discovery");
  assert.deepEqual(state.play!.forcePass, []);
});

test("automatic Event passes leave a playable player's turn available", () => {
  const state = empty("event");
  state.world!.kinPicks.p1 = "ark";
  addItem(state, "the-eternal-ark", "court:p1", "p1");
  state.cards["other-character"] = { id: "other-character", def: "steen", owner: "p2", zone: "court:p2", tapped: false };
  onBoard(state, "calculators");
  onBoard(state, "archeology");
  assert.equal(dispatch(state, act("activateEvent", "p1", { def: "archeology" })), null);
  assert.equal(state.play!.phase, "event");
  assert.equal(state.play!.turn, "p1");
  assert.equal(state.play!.passes, 1);
  assert.deepEqual(eventOptions(state, "p1"), ["calculators"]);
});

test("automatic Event passes wait for pending council votes", () => {
  const state = empty("event");
  onBoard(state, "council");
  assert.equal(dispatch(state, act("activateEvent", "p1", { def: "council" })), null);
  assert.ok(state.play!.council);
  assert.equal(state.play!.phase, "event");
  assert.equal(state.play!.passes, 0);
});

test("after the Control phase the Event phase starts again, and Seasons Change untaps the other event cards", () => {
  const state = empty("control");
  const archeology = onBoard(state, "archeology");
  archeology.tapped = true;
  dispatch(state, act("pass", "p1"));
  dispatch(state, act("pass", "p2"));
  assert.equal(state.round, 2);
  assert.equal(state.play!.phase, "event");
  assert.equal(archeology.tapped, false);
  assert.equal(state.items.find(item => item.def === "seasons-change")!.tapped, true);
});

test("the Archeology event places ruins on an unbuilt land tile without an army, then taps", () => {
  const state = empty("event");
  assert.match(dispatch(state, act("activateEvent", "p1", { def: "archeology" })) ?? "", /cannot/);
  onBoard(state, "archeology");
  assert.deepEqual(eventOptions(state), ["archeology"]);
  assert.equal(dispatch(state, act("activateEvent", "p2", { def: "archeology" })), "It is not your turn.");
  assert.equal(dispatch(state, act("activateEvent", "p1", { def: "archeology" })), null);
  const ruins = (state.blocks ?? []).filter(block => block.kind === "ruins");
  assert.equal(ruins.length, 1);
  assert.notEqual(ruins[0].tile, HOME);
  assert.equal(state.tiles[ruins[0].tile].terrain, "plains");
  assert.equal(state.play!.turn, "p2");
  assert.deepEqual(eventOptions(state), []);
  assert.equal(isUnbuiltTile(state, ruins[0].tile), false);
});

test("ruins only go on unbuilt tiles without armies that are not ocean", () => {
  const state = empty("event");
  for (const tile of state.tiles) tile.terrain = "ocean";
  state.tiles[HOME].terrain = "plains";
  state.tiles[NEXT].terrain = "plains";
  assert.deepEqual(ruinsSpots(state), [NEXT]);
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: NEXT });
  assert.deepEqual(ruinsSpots(state), []);
  onBoard(state, "archeology");
  assert.deepEqual(eventOptions(state), []);
});

test("Attrition takes 1 strength from armies on unbuilt snow, and removes armies that run out", () => {
  const state = empty("event");
  state.tiles[HOME].terrain = "snow";
  state.tiles[NEXT].terrain = "snow";
  state.armies.push({ id: "a2", owner: "p1", tile: NEXT, strength: 2 });
  onBoard(state, "attrition");
  assert.equal(dispatch(state, act("activateEvent", "p1", { def: "attrition" })), null);
  assert.deepEqual(state.armies.map(army => [army.id, army.strength]), [["a2", 1]]);
  assert.deepEqual(eventOptions(state), []);
});

test("Attrition spares armies on tiles with ruins or buildings", () => {
  const state = empty("event");
  state.tiles[HOME].terrain = "snow";
  state.blocks = [{ tile: HOME, kind: "ruins" }];
  onBoard(state, "attrition");
  assert.deepEqual(eventOptions(state), []);
});

test("passing the Event phase moves on to Discovery", () => {
  const state = empty("event");
  dispatch(state, act("pass", "p1"));
  dispatch(state, act("pass", "p2"));
  assert.equal(state.play!.phase, "discovery");
});

test("Explore turns ruins into a warp, a treasure block or a relic block depending on the d6", () => {
  const seen = new Set<string>();
  for (let seed = 1; seed <= 40; seed++) {
    const state = empty("control");
    state.rng = createRng(seed);
    state.blocks = [{ tile: HOME, kind: "ruins" }];
    addItem(state, "explore", "court:p1", "p1");
    addItem(state, "activation-control", "court:p1", "p1");
    assert.deepEqual(exploreOptions(state, "p1"), ["a1"]);
    const source = sourcesFor(state, "p1", "control")[0];
    assert.match(dispatch(state, act("explore", "p1", { kind: source.kind, card: source.id, army: "nope" })) ?? "", /ruins/);
    assert.equal(dispatch(state, act("explore", "p1", { kind: source.kind, card: source.id, army: "a1" })), null);
    const found = state.play!.found!;
    assert.equal(found.result, found.roll <= 2 ? "warp" : found.roll <= 4 ? "treasure" : "relic");
    assert.equal(blocksAt(state, HOME, "ruins").length, 0);
    assert.equal(blocksAt(state, HOME, "treasure").length, found.result === "treasure" ? 1 : 0);
    assert.equal(blocksAt(state, HOME, "relic").length, found.result === "relic" ? 1 : 0);
    assert.equal(state.players.p1.resources.mana ?? 0, found.result === "warp" ? 2 : 0);
    assert.equal(state.items.find(item => item.id === source.id)!.tapped, true);
    assert.equal(state.play!.turn, "p2");
    seen.add(found.result);
  }
  assert.equal(seen.size, 3);
});

test("Explore needs an army of yours on ruins and the Explore card", () => {
  const state = empty("control");
  addItem(state, "activation-control", "court:p1", "p1");
  state.blocks = [{ tile: NEXT, kind: "ruins" }];
  const source = sourcesFor(state, "p1", "control")[0];
  assert.match(dispatch(state, act("explore", "p1", { kind: source.kind, card: source.id, army: "a1" })) ?? "", /Explore/);
  addItem(state, "explore", "court:p1", "p1");
  assert.match(dispatch(state, act("explore", "p1", { kind: source.kind, card: source.id, army: "a1" })) ?? "", /ruins/);
});

test("Reclaim collects treasure and relic blocks from your tile building", () => {
  const state = empty("expansion");
  state.players.p1.resources = {};
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: HOME });
  addItem(state, "reclaim", "court:p1", "p1");
  addItem(state, "activation-expansion", "court:p1", "p1");
  const source = sourcesFor(state, "p1", "expansion")[0];
  assert.deepEqual(reclaimOptions(state, "p1"), []);
  state.blocks = [{ tile: HOME, kind: "treasure" }, { tile: HOME, kind: "relic" }, { tile: NEXT, kind: "relic" }];
  assert.equal(reclaimOptions(state, "p1").length, 1);
  const tap = { kind: source.kind, card: source.id, building: reclaimOptions(state, "p1")[0].building };
  assert.match(dispatch(state, act("reclaim", "p1", { ...tap, basic: { food: 2 } })) ?? "", /3 basic/);
  assert.match(dispatch(state, act("reclaim", "p1", { ...tap, basic: { mana: 3 } })) ?? "", /gold/);
  assert.equal(dispatch(state, act("reclaim", "p1", { ...tap, basic: { food: 2, stone: 1 } })), null);
  assert.equal(state.players.p1.resources.food, 2);
  assert.equal(state.players.p1.resources.stone, 1);
  assert.equal(state.players.p1.resources.relic, 1);
  assert.deepEqual(state.blocks, [{ tile: NEXT, kind: "relic" }]);
  assert.equal(state.items.find(item => item.id === source.id)!.tapped, true);
});

test("a Move can bring one treasure or relic block along each step, but not ruins", () => {
  const state = empty("event");
  state.play!.phase = "discovery";
  addItem(state, "move", "court:p1", "p1");
  addItem(state, "activation-discovery", "court:p1", "p1");
  const source = sourcesFor(state, "p1", "discovery")[0];
  state.blocks = [{ tile: HOME, kind: "treasure" }, { tile: HOME, kind: "relic" }, { tile: HOME, kind: "ruins" }];
  assert.equal(dispatch(state, act("activateMove", "p1", { kind: source.kind, card: source.id, army: "a1" })), null);
  state.play!.move!.speed = 10;
  assert.match(dispatch(state, act("moveStep", "p1", { tile: NEXT, blocks: ["ruins"] })) ?? "", /one treasure block and one relic/);
  assert.match(dispatch(state, act("moveStep", "p1", { tile: NEXT, blocks: ["treasure", "treasure"] })) ?? "", /one treasure block and one relic/);
  assert.equal(dispatch(state, act("moveStep", "p1", { tile: NEXT, blocks: ["treasure", "relic"] })), null);
  assert.deepEqual(state.blocks.filter(block => block.tile === NEXT).map(block => block.kind).sort(), ["relic", "treasure"]);
  assert.deepEqual(state.blocks.filter(block => block.tile === HOME), [{ tile: HOME, kind: "ruins" }]);
  assert.match(dispatch(state, act("moveStep", "p1", { tile: HOME, blocks: ["ruins"] })) ?? "", /one treasure block and one relic/);
  assert.equal(dispatch(state, act("moveStep", "p1", { tile: HOME, blocks: ["relic"] })), null);
  assert.deepEqual(state.blocks.filter(block => block.tile === HOME).map(block => block.kind).sort(), ["relic", "ruins"]);
  assert.deepEqual(state.blocks.filter(block => block.tile === NEXT), [{ tile: NEXT, kind: "treasure" }]);
});

test("a tile building cannot be built on ruins, but can on a treasure block", () => {
  const state = empty("expansion");
  const far = tileIndex(6, 14);
  addItem(state, "village", "court:p1", "p1");
  state.armies.push({ id: "a2", owner: "p1", tile: far, strength: 1 });
  state.blocks = [{ tile: far, kind: "ruins" }];
  assert.match(placementError(state, "p1", "village", { tile: far }) ?? "", /already built/);
  state.blocks = [{ tile: far, kind: "treasure" }];
  assert.equal(placementError(state, "p1", "village", { tile: far }), null);
});
