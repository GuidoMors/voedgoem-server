import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { addItem } from "./cards";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { kin } from "./index";
import { legalSteps, sourcesFor } from "./play";
import { sideBetween } from "./buildings";
import { neighbors, sideEdge } from "./world";
import { createRng, nextInt } from "./rng";
import { setupChoices } from "./setup";
import type { Action, KinState } from "./types";

const act = (type: string, id: string, extra: Record<string, unknown> = {}): Action => ({ type, actor: { id, username: id, isHost: id === "p1" }, ...extra });

// A solo game played through the whole setup, ending at the first Discovery phase.
function playing(kinId: string, testing = false, skipEvent = true): KinState {
  const state = createState(1);
  dispatch(state, act("join", "p1"));
  if (testing) dispatch(state, act("setOptions", "p1", { testing: true }));
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
  assert.equal(dispatch(state, act("pickKin", "p1", { kin: kinId })), null);
  for (let guard = 0; state.world!.step === "setup" && guard < 50; guard++) {
    const choices = setupChoices(state)!;
    assert.equal(dispatch(state, act("setupPlace", "p1", choices.task === "worksite" ? { side: choices.sides[0] } : { tile: choices.tiles[choices.tiles.length - 1] })), null);
  }
  while (state.world!.step === "characters") {
    const pick = eligibleCharacters(state, characterPicker(state)!, characterRound(state))[0];
    assert.equal(dispatch(state, act("pickCharacter", "p1", { character: pick.id })), null);
  }
  // The game starts in the Event phase; unless a test wants to see it, the only player passes it.
  assert.equal(state.play!.phase, "event");
  if (skipEvent) assert.equal(dispatch(state, act("pass", "p1")), null);
  return state;
}

test("the round loop starts in the Event phase and moves on to Discovery when everybody passes", () => {
  const state = playing("hammers", false, false);
  assert.equal(state.world!.step, "done");
  assert.equal(state.play!.phase, "event");
  assert.equal(state.play!.turn, "p1");
  assert.equal(state.round, 1);
  assert.equal(state.items.find(item => item.def === "seasons-change")!.tapped, true);
  assert.equal(dispatch(state, act("pass", "p1")), null);
  assert.equal(state.play!.phase, "discovery");
});

test("a Move taps the card, spends its power as speed and ends the turn when stopped", () => {
  const state = playing("hammers");
  const source = sourcesFor(state, "p1", "discovery")[0];
  const army = state.armies.find(candidate => candidate.owner === "p1" && candidate.tile >= 0)!;
  assert.match(dispatch(state, act("activateMove", "p1", { kind: source.kind, card: source.id, army: "nope" })) ?? "", /armies/);
  assert.equal(dispatch(state, act("activateMove", "p1", { kind: source.kind, card: source.id, army: army.id })), null);
  assert.equal(state.cards[source.id].tapped, true);
  assert.equal(state.play!.move!.speed, source.power * 2);
  assert.match(dispatch(state, act("pass", "p1")) ?? "", /Move/);

  const from = army.tile;
  const step = legalSteps(state, army, state.play!.move!.speed)[0];
  assert.match(dispatch(state, act("moveStep", "p1", { tile: -3 })) ?? "", /cannot move/);
  assert.equal(dispatch(state, act("moveStep", "p1", { tile: step.tile })), null);
  assert.notEqual(army.tile, from);
  assert.equal(army.tile, step.tile);
  if (state.play!.move) {
    assert.equal(state.play!.move.speed, source.power * 2 - step.cost);
    assert.equal(dispatch(state, act("moveStop", "p1")), null);
  }
  assert.equal(state.play!.move, null);
});

test("River Toll pauses a Move and preserves its remaining speed", () => {
  const state = playing("hammers");
  const army = state.armies.find(candidate => candidate.owner === "p1" && candidate.tile >= 0)!;
  const from = army.tile;
  const to = neighbors(from)[0];
  const side = sideBetween(from, to)!;
  state.order.push("p2");
  state.players.p2 = { id: "p2", username: "p2", connected: true, resources: {} };
  state.cards.velzero = { id: "velzero", def: "velzero", owner: "p2", zone: "court:p2", tapped: false };
  state.players.p1.resources.gold = 2;
  state.buildings = [{ id: "toll-village", def: "village", owner: "p2", kind: "tile", tile: from }];
  state.tiles.forEach(tile => { tile.terrain = "plains"; });
  state.world!.rivers = { [sideEdge(from, side)]: 1 };

  const initialSpeed = 8;
  state.play!.move = { player: "p1", army: army.id, source: { kind: "character", id: "test" }, speed: initialSpeed, moved: false };
  const cost = legalSteps(state, army, initialSpeed).find(step => step.tile === to)!.cost;
  assert.equal(dispatch(state, act("moveStep", "p1", { tile: to })), null);
  assert.equal(state.play!.reactions![0].kind, "river-toll");
  assert.equal(state.play!.move!.speed, initialSpeed - cost);
  assert.equal(dispatch(state, act("reactionRespond", "p2", { choices: ["demand"] })), null);
  assert.equal(state.play!.reactions![0].owner, "p1");
  state.players.p1.resources.gold = 0;
  assert.match(dispatch(state, act("reactionRespond", "p1", { choices: ["pay"] })) ?? "", /need 1 gold/);
  state.players.p1.resources.gold = 2;
  assert.equal(dispatch(state, act("reactionRespond", "p1", { choices: ["pay"] })), null);
  assert.equal(state.players.p1.resources.gold, 1);
  assert.equal(state.players.p2.resources.gold, 1);
  assert.equal(state.play!.move!.speed, initialSpeed - cost);
  assert.ok(state.play!.move);
});

test("declining River Toll breaks every treaty with the demander and pays per treaty", () => {
  const state = playing("hammers");
  const army = state.armies.find(candidate => candidate.owner === "p1" && candidate.tile >= 0)!;
  const from = army.tile;
  const to = neighbors(from)[0];
  const side = sideBetween(from, to)!;
  state.order.push("p2");
  state.players.p2 = { id: "p2", username: "p2", connected: true, resources: {} };
  state.cards.velzero = { id: "velzero", def: "velzero", owner: "p2", zone: "court:p2", tapped: false };
  state.players.p1.resources.gold = 3;
  state.buildings = [{ id: "toll-village", def: "village", owner: "p2", kind: "tile", tile: from }];
  state.tiles.forEach(tile => { tile.terrain = "plains"; });
  state.world!.rivers = { [sideEdge(from, side)]: 1 };
  addItem(state, "trade-treaty", "court:p2", "p2", "p1");
  addItem(state, "trade-treaty", "court:p1", "p1", "p2");
  state.play!.move = { player: "p1", army: army.id, source: { kind: "character", id: "test" }, speed: 8, moved: false };

  assert.equal(dispatch(state, act("moveStep", "p1", { tile: to })), null);
  assert.equal(dispatch(state, act("reactionRespond", "p2", { choices: ["demand"] })), null);
  assert.equal(dispatch(state, act("reactionRespond", "p1", { choices: ["decline"] })), null);
  assert.equal(state.items.filter(item => item.def === "trade-treaty").length, 0);
  assert.equal(state.players.p1.resources.gold, 1);
  assert.equal(state.players.p2.resources.gold, 2);
  assert.ok(state.play!.move);
});

test("stopping before the first step keeps the card tapped and ends the turn", () => {
  const state = playing("hammers");
  const source = sourcesFor(state, "p1", "discovery")[0];
  const army = state.armies.find(candidate => candidate.owner === "p1" && candidate.tile >= 0)!;
  dispatch(state, act("activateMove", "p1", { kind: source.kind, card: source.id, army: army.id }));
  assert.equal(state.cards[source.id].tapped, true);
  assert.equal(dispatch(state, act("moveStop", "p1")), null);
  // The card stays tapped through the rest of the round; passing out of the Discovery phase leads to Seasons Change.
  assert.equal(state.play!.move, null);
  assert.equal(state.round, 1);
  assert.equal(state.cards[source.id].tapped, true);
  // Players that can still Build, Deploy or Demolish get their Expansion phase, so passing may take a few turns.
  for (let guard = 0; state.round < 2 && guard < 8; guard++) assert.equal(dispatch(state, act("pass", state.play!.turn)), null);
  assert.equal(state.round, 2);
  assert.equal(state.cards[source.id].tapped, false);
});

test("passing ends the phase and the round loop untaps everything at the next round", () => {
  const state = playing("hammers");
  const source = sourcesFor(state, "p1", "discovery")[0];
  const army = state.armies.find(candidate => candidate.owner === "p1" && candidate.tile >= 0)!;
  dispatch(state, act("activateMove", "p1", { kind: source.kind, card: source.id, army: army.id }));
  dispatch(state, act("moveStep", "p1", { tile: legalSteps(state, army, state.play!.move!.speed)[0].tile }));
  dispatch(state, act("moveStop", "p1"));
  // With no other card that can move, the phase may already have ended by itself.
  for (let guard = 0; state.round < 2 && guard < 8; guard++) assert.equal(dispatch(state, act("pass", state.play!.turn)), null);
  assert.equal(state.round, 2);
  assert.equal(state.play!.phase, "event");
  assert.equal(state.cards[source.id].tapped, false);
});

test("activation cards can be tapped for a Move (testing cheat)", () => {
  const state = playing("hammers", true);
  assert.match(dispatch(state, act("giveActivation", "p1", { card: "bogus" })) ?? "", /Unknown/);
  assert.equal(dispatch(state, act("giveActivation", "p1", { card: "activation-discovery" })), null);
  const card = sourcesFor(state, "p1", "discovery").find(source => source.kind === "item")!;
  assert.equal(card.power, 1);
  const army = state.armies.find(candidate => candidate.owner === "p1" && candidate.tile >= 0)!;
  assert.equal(dispatch(state, act("activateMove", "p1", { kind: "item", card: card.id, army: army.id })), null);
  assert.equal(state.items.find(item => item.id === card.id)!.tapped, true);
});

test("a Move cannot enter the building tile of another player or leave next to their army", () => {
  const state = playing("hammers");
  const army = state.armies.find(candidate => candidate.owner === "p1" && candidate.tile >= 0)!;
  const [first] = legalSteps(state, army, 20);
  state.buildings.push({ id: "bx", def: "village", owner: "other", kind: "tile", tile: first.tile });
  assert.ok(!legalSteps(state, army, 20).some(step => step.tile === first.tile));
  state.buildings.pop();
  const [target] = legalSteps(state, army, 20);
  state.armies.push({ id: "ax", owner: "other", tile: target.tile, strength: 1 });
  assert.deepEqual(legalSteps(state, army, 20), []);
});

test("the snapshot shows the round loop and Move options", () => {
  const state = playing("hammers");
  const world = (kin.snapshot(state, "p1", new Set(["p1"])) as { world: { play: { phase: string; options: { sources: unknown[]; armies: string[] } } } }).world;
  assert.equal(world.play.phase, "discovery");
  assert.ok(world.play.options.sources.length > 0);
  assert.ok(world.play.options.armies.length > 0);
});
