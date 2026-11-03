import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound, characterById } from "./draft";
import { addItem, maxArmyStrength } from "./cards";
import { battleOptions, defenderGenerals, DICE, unlockedDice } from "./battle";
import { sideBetween } from "./buildings";
import { sourcesFor } from "./play";
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
  return state;
}

const HOME = tileIndex(6, 10);
const NEXT = tileIndex(6, 11);

// p1 has an army on HOME and one activation card to tap; p2 has a general (the weakest Control character) and an army on NEXT.
function war(): KinState {
  const state = playing();
  state.buildings = [];
  state.armies = [{ id: "a1", owner: "p1", tile: HOME, strength: 3 }, { id: "a2", owner: "p2", tile: NEXT, strength: 2 }];
  for (const tile of state.tiles) tile.terrain = "plains";
  state.world!.rivers = {};
  for (const card of Object.values(state.cards)) card.tapped = true;
  const general = Object.values(state.cards)
    .filter(card => characterById(card.def)?.archetypes.includes("control") && !["ethereal", "lumon"].includes(card.def))
    .sort((a, b) => characterById(a.def)!.power - characterById(b.def)!.power)[0];
  general.owner = "p2";
  general.zone = "court:p2";
  general.tapped = false;
  general.hostageOf = undefined;
  state.items = state.items.filter(item => !item.zone.startsWith("court:"));
  addItem(state, "activation-control", "court:p1", "p1");
  state.play!.phase = "control";
  state.play!.turn = "p1";
  state.play!.passes = 0;
  return state;
}

const source = (state: KinState) => sourcesFor(state, "p1", "control")[0];
const attack = (state: KinState, dice: Record<string, number>, extra: Record<string, unknown> = {}) =>
  act("battle", "p1", { kind: source(state).kind, card: source(state).id, army: "a1", tile: NEXT, dice, ...extra });
const pool = (state: KinState) => source(state).power + state.armies[0].strength;

test("an army can attack an adjacent army or building, unless a wall is in between or the army is exhausted", () => {
  const state = war();
  assert.deepEqual(battleOptions(state, "p1"), [{ army: "a1", targets: [NEXT] }]);
  assert.deepEqual(battleOptions(state, "p2").map(option => option.army), ["a2"]);
  const wall = addBuilding(state, { def: "wall", owner: "p2", kind: "edge", tile: NEXT, side: sideBetween(NEXT, HOME)! });
  assert.deepEqual(battleOptions(state, "p1"), []);
  state.buildings = state.buildings.filter(building => building !== wall);
  state.armies[0].status = "exhausted";
  assert.deepEqual(battleOptions(state, "p1"), []);
});

test("the dice must match the strength pool and only use known technologies", () => {
  const state = war();
  assert.match(dispatch(state, attack(state, { strategic: pool(state) - 1 })) ?? "", /exactly/);
  assert.match(dispatch(state, attack(state, { aggressive: pool(state) })) ?? "", /technology/);
  assert.deepEqual(unlockedDice(state, "p1"), ["strategic"]);
  addItem(state, "aggresive-combat", "court:p1", "p1");
  assert.deepEqual(unlockedDice(state, "p1"), ["strategic", "aggressive"]);
  assert.equal(dispatch(state, attack(state, { strategic: 1, aggressive: pool(state) - 1 })), null);
  assert.equal(state.play!.battle!.defender, "p2");
  assert.equal(state.play!.turn, "p1");
  assert.match(dispatch(state, act("pass", "p1")) ?? "", /defender/);
});

test("a building without garrison and without an army is destroyed at once", () => {
  const state = war();
  state.armies.pop();
  addBuilding(state, { def: "market", owner: "p2", kind: "tile", tile: NEXT });
  assert.equal(dispatch(state, attack(state, { strategic: pool(state) })), null);
  assert.equal(state.buildings.length, 0);
  assert.equal(state.play!.report!.immediate, true);
  assert.equal(state.play!.battle ?? null, null);
  assert.equal(state.play!.turn, "p2");
});

test("combat dice have the faces of the rulebook", () => {
  assert.deepEqual(DICE.strategic[3], { blocks: 1, hits: 1 });
  assert.deepEqual(DICE.aggressive[0], { self: 2 });
  assert.deepEqual(DICE.ambush[5], { ambush: 1 });
  assert.deepEqual(DICE.defensive[5], { blocks: 3 });
});

test("a battle is rolled and resolved: self hits, blocks, damage to armies and hostages", () => {
  let hostages = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const state = war();
    state.rng = createRng(seed);
    addItem(state, "ambush-combat", "court:p1", "p1");
    addItem(state, "ambush-combat", "court:p2", "p2");
    assert.equal(dispatch(state, attack(state, { ambush: pool(state) })), null);
    const general = defenderGenerals(state, "p2")[0];
    const answer = dispatch(state, act("battleRespond", "p2", { general: general.id, dice: { ambush: general.power + 2 } }));
    assert.equal(answer, null);
    const report = state.play!.report!;
    const { attacker, defender } = report;
    assert.equal(attacker.dice.length, 4);
    assert.equal(defender.dice.length, general.power + 2);
    assert.equal(defender.unblocked, Math.max(0, attacker.hits + defender.selfHits - defender.blocks));
    assert.equal(attacker.unblocked, Math.max(0, defender.hits + attacker.selfHits - attacker.blocks));
    const a1 = state.armies.find(army => army.id === "a1");
    const a2 = state.armies.find(army => army.id === "a2");
    assert.equal(a1?.strength ?? 0, Math.max(0, 3 - attacker.unblocked));
    assert.equal(a2?.strength ?? 0, Math.max(0, 2 - defender.unblocked));
    assert.equal(state.cards[general.id].tapped || report.hostages.includes(general.id), true);
    assert.equal(state.play!.turn, "p2");
    for (const id of report.hostages) {
      hostages++;
      const card = state.cards[id];
      assert.ok(card.hostageOf);
      assert.equal(card.zone, `court:${card.owner}`);
      assert.notEqual(card.owner, card.hostageOf);
      if (id === general.id) assert.ok(defender.unblocked >= 1 && attacker.ambush > general.power);
      else assert.ok(attacker.unblocked >= 1 && defender.ambush > 1);
    }
  }
  assert.ok(hostages > 0);
});

test("a garrisoned building is destroyed only when the hits left over reach its garrison, and not when the tile is built the general is safe", () => {
  let destroyed = 0;
  let survived = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const state = war();
    state.rng = createRng(seed);
    state.armies = state.armies.filter(army => army.id === "a1");
    addBuilding(state, { def: "village", owner: "p2", kind: "tile", tile: NEXT });
    assert.equal(dispatch(state, attack(state, { strategic: pool(state) })), null);
    assert.equal(dispatch(state, act("battleRespond", "p2", { dice: { strategic: 2 } })), null);
    const report = state.play!.report!;
    if (report.defender.unblocked >= 2) { destroyed++; assert.equal(report.destroyed, "village"); assert.equal(state.buildings.length, 0); }
    else { survived++; assert.equal(report.destroyed, null); assert.equal(state.buildings.length, 1); }
    // Nobody can be taken hostage next to a building.
    assert.deepEqual(report.hostages, []);
  }
  assert.ok(destroyed > 0 && survived > 0);
});

test("attacking breaks treaties between the two players", () => {
  const state = war();
  addItem(state, "peace-treaty", "court:p2", "p2", "p1");
  assert.equal(state.items.some(item => item.def === "peace-treaty"), true);
  assert.equal(dispatch(state, attack(state, { strategic: pool(state) })), null);
  assert.equal(state.items.some(item => item.def === "peace-treaty"), false);
});

function withGeneral(id: string): KinState {
  const state = war();
  state.cards[id] ??= { id, def: id, owner: "p1", zone: "court:p1", tapped: false } as never;
  Object.assign(state.cards[id], { owner: "p1", zone: "court:p1", tapped: false, hostageOf: undefined });
  return state;
}
const withSource = (state: KinState, id: string, extra: Record<string, unknown> = {}) => {
  const general = sourcesFor(state, "p1", "control").find(candidate => candidate.id === id)!;
  return act("battle", "p1", { kind: general.kind, card: general.id, army: "a1", tile: NEXT, dice: { strategic: general.power + 3 }, ...extra });
};

test("Bull of Akantash grows a surviving army after attacking, and Gorengar adds 2 blocks", () => {
  for (const [id, check] of [["bull-of-akantash", true], ["gorengar-the-black", false]] as const) {
    const state = withGeneral(id);
    assert.equal(dispatch(state, withSource(state, id)), null);
    assert.equal(dispatch(state, act("battleRespond", "p2", { dice: { strategic: 2 } })), null);
    const report = state.play!.report!;
    const army = state.armies.find(candidate => candidate.id === "a1");
    if (check && army) assert.ok(army.strength === Math.min(maxArmyStrength(state, "p1"), 3 - report.attacker.unblocked + 1));
    if (!check) assert.ok(report.attacker.blocks >= 2);
  }
});
