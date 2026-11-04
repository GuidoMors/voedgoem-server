import assert from "node:assert/strict";
import { test } from "node:test";
import { addItem, dealBoardCards } from "./cards";
import { cardById } from "./cards.data";
import { kinBotMove } from "./bots";
import { createState, deserialize, dispatch, serialize } from "./engine";
import { eventOptions } from "./events";
import { kin } from "./index";
import { cleanupKingdom, personalStrength, startKingdom } from "./kingdom";
import { activeLaws, availableLaws, forbiddenBy, lawBoard } from "./laws";
import { hasActionCard } from "./play";
import { removeItem } from "./treaties";
import { kingdomWinner } from "./victory";
import { createWorld, TILE_COUNT } from "./world";
import type { Action, KinState } from "./types";

const act = (type: string, player = "p1", extra: Record<string, unknown> = {}): Action =>
  ({ type, actor: { id: player, username: player, isHost: player === "p1" }, ...extra });
const send = (state: KinState, type: string, player = "p1", extra: Record<string, unknown> = {}) =>
  assert.equal(dispatch(state, act(type, player, extra)), null);

function beforeKingdom(): KinState {
  const state = createState(42);
  state.phase = "playing";
  state.options.mode = "long";
  state.order = ["p1", "p2", "p3", "p4"];
  state.seats = [...state.order];
  for (const id of state.order) state.players[id] = { id, username: id, connected: true, resources: { gold: 10, gear: 20, lumber: 20, stone: 20, food: 20 } };
  state.world = createWorld();
  state.world.step = "done";
  state.world.kinPicks = { p1: "ethereal", p2: "hanshu", p3: "wanderers", p4: "lumon" };
  state.tiles = Array.from({ length: TILE_COUNT }, () => ({ col: 0, row: 0, terrain: "plains", tapped: false }));
  state.round = 2;
  state.play = { phase: "control", turn: "p1", passes: 0, move: null, barter: null, verdicts: [] };
  state.chapter = { current: "kingdom", leader: "p1", history: [{ chapter: "new-dawn", winner: "p1", round: 1 }], points: { p1: 1 } };
  dealBoardCards(state);
  for (const id of state.order) {
    addItem(state, "activation-control", `court:${id}`, id);
    addItem(state, "activation-discovery", `court:${id}`, id);
    addItem(state, "activation-expansion", `court:${id}`, id);
  }
  return state;
}

function game(): KinState {
  const state = beforeKingdom();
  startKingdom(state, "p1");
  return state;
}

function source(state: KinState, player = "p1", phase: "control" | "expansion" | "discovery" = "control") {
  const item = state.items.find(item => item.def === `activation-${phase}` && item.owner === player)!;
  item.tapped = false;
  state.play!.phase = phase;
  state.play!.turn = player;
  return { kind: "item", card: item.id };
}

function release(state: KinState, player: string) {
  removeItem(state, state.items.find(item => item.def === "vassal-treaty" && item.giver === player)!);
}

function council(state: KinState) {
  const science = state.items.find(item => item.def === "council-science")!;
  science.zone = "court:p2";
  science.owner = "p2";
  const event = state.items.find(item => item.def === "council") ?? addItem(state, "council", "board:phase");
  event.tapped = false;
  state.play!.phase = "event";
  state.play!.turn = "p2";
  send(state, "activateEvent", "p2", { def: "council" });
}

function armies(state: KinState, strength: Record<string, number>) {
  state.armies = Object.entries(strength).map(([owner, amount], index) => ({ id: `a${index + 1}`, owner, tile: index + 20, strength: amount }));
}

test("Kingdom setup publicizes only Vassal Diplomacy and replaces all old vassal relationships without penalties", () => {
  const state = beforeKingdom();
  const diplomacy = state.items.find(item => item.def === "vassal-diplomacy")!;
  diplomacy.zone = "court:p2";
  diplomacy.owner = "p2";
  addItem(state, "vassal-treaty", "court:p2", "p2", "p1");
  addItem(state, "vassal-treaty", "court:p3", "p3", "p2");
  for (const player of state.order) addItem(state, "vassal-ban", `court:${player}`, player);
  state.laws = { deck: ["block-inquiry"], discard: ["general-blockade"], enacted: "stockpiles" };
  startKingdom(state, "p1");
  assert.equal(diplomacy.zone, "board:public");
  assert.equal(diplomacy.owner, null);
  assert.equal(state.items.find(item => item.def === "council-science")!.zone, "board:research");
  assert.equal(state.items.some(item => item.def === "vassal-ban"), false);
  assert.deepEqual(state.items.filter(item => item.def === "vassal-treaty").map(item => [item.giver, item.owner]), [["p2", "p1"], ["p3", "p1"], ["p4", "p1"]]);
  assert.deepEqual(state.players.p1.resources.gold, 10);
  assert.deepEqual([...state.laws!.deck].sort(), ["block-inquiry", "general-blockade", "stockpiles"]);
  assert.deepEqual(state.laws!.discard, []);
  assert.equal(state.laws!.enacted, null);
  assert.equal(state.items.find(item => item.def === "iron-grip")!.zone, "court:p1");
  assert.equal(state.items.find(item => item.def === "righteous-ruler")!.owner, "p1");
  assert.equal(state.items.find(item => item.def === "taxation")!.zone, "board:phase");
  assert.equal(new Set(state.items.map(item => item.id)).size, state.items.length);
});

test("Taxation automatically transfers one gold from each solvent non-King and taps", () => {
  const state = game();
  state.players.p2.resources.gold = 0;
  delete state.players.p3.resources.gold;
  state.players.p4.resources.gold = 1;
  state.play!.phase = "event";
  send(state, "activateEvent", "p1", { def: "taxation" });
  assert.equal(state.players.p1.resources.gold, 11);
  assert.equal(state.players.p2.resources.gold, 0);
  assert.equal(state.players.p3.resources.gold, undefined);
  assert.equal(state.players.p4.resources.gold, 0);
  assert.equal(state.items.find(item => item.def === "taxation")!.tapped, true);
  assert.equal(state.play!.council, undefined);
  assert.equal(state.play!.donation, undefined);
});

test("Kingdom Council needs a known Science but lets the King choose despite another private owner", () => {
  const state = game();
  addItem(state, "council", "board:phase");
  state.play!.phase = "event";
  assert.equal(eventOptions(state).includes("council"), false);
  council(state);
  assert.equal(state.play!.council!.laws.length, 3);
  assert.equal(state.play!.council!.king, "p1");
  assert.equal(state.play!.turn, "p1");
  const laws = [...state.play!.council!.laws];
  assert.notEqual(dispatch(state, act("vote", "p1", { law: laws[0] })), null);
  assert.notEqual(dispatch(state, act("pass")), null);
  assert.notEqual(dispatch(state, act("royalEnact", "p2", { law: laws[0], track: "rebel" })), null);
  assert.notEqual(dispatch(state, act("royalEnact", "p1", { law: laws[0], track: "invalid" })), null);
  assert.notEqual(dispatch(state, act("royalEnact", "p1", { law: "missing", track: "rebel" })), null);
  send(state, "royalEnact", "p1", { law: laws[0], track: "rebel" });
  assert.deepEqual(state.kingdom!.rebel, [laws[0]]);
  assert.equal(laws.slice(1).every(law => state.laws!.discard.includes(law)), true);
  assert.equal(state.play!.council, null);
  assert.equal(state.play!.councilResult!.track, "rebel");
  assert.equal(state.laws!.enacted, null);
});

test("royal Councils preserve existing laws and do not award voting influence or spend Grand Works", () => {
  const state = game();
  state.kingdom!.rebel = ["stockpiles"];
  state.kingdom!.kingdom = ["zone-districts"];
  state.laws!.deck = state.laws!.deck.filter(id => !activeLaws(state).includes(id));
  addItem(state, "influential", "court:p1", "p1");
  state.cards.yamanano = { id: "yamanano", def: "yamanano", zone: "court:p1", owner: "p1", tapped: false };
  state.players.p1.resources.influence = 3;
  council(state);
  const law = state.play!.council!.laws[0];
  assert.equal(kin.snapshot(state, "p1", new Set(state.order)).world!.play!.council!.canGrand, false);
  send(state, "royalEnact", "p1", { law, track: "kingdom", grand: true });
  assert.equal(state.players.p1.resources.influence, 3);
  assert.deepEqual(state.kingdom!.rebel, ["stockpiles"]);
  assert.deepEqual(state.kingdom!.kingdom, ["zone-districts", law]);
  assert.equal(state.laws!.discard.includes("stockpiles"), false);
});

test("Quantum Collapse chooses the three drawn laws before the King's decision and survives serialization", () => {
  const state = game();
  addItem(state, "quantum-collapse", "court:p3", "p3");
  council(state);
  assert.equal(state.play!.quantum!.player, "p3");
  assert.equal(state.play!.council, undefined);
  const chosen = state.play!.quantum!.options.slice(0, 3);
  send(state, "quantum", "p3", { cards: chosen });
  const restored = deserialize(serialize(state));
  assert.deepEqual(restored.play!.council!.laws, chosen);
  assert.equal(restored.play!.turn, "p1");
  send(restored, "royalEnact", "p1", { law: chosen[0], track: "kingdom" });
  assert.deepEqual(restored.kingdom!.kingdom, [chosen[0]]);
});

test("Council draws fewer laws when exhausted and handles zero available laws without a stuck decision", () => {
  const state = game();
  state.laws = { deck: ["general-blockade"], discard: [], enacted: null };
  council(state);
  assert.deepEqual(state.play!.council!.laws, ["general-blockade"]);
  send(state, "royalEnact", "p1", { law: "general-blockade", track: "kingdom" });
  council(state);
  assert.equal(state.play!.council, null);
});

test("law tracks apply cumulatively, with rebel-track immunity only for the King and current direct vassals", () => {
  const state = game();
  state.kingdom!.rebel = ["block-inquiry", "enforce-treaties"];
  state.kingdom!.kingdom = ["stockpiles", "general-blockade"];
  release(state, "p3");
  release(state, "p4");
  addItem(state, "vassal-treaty", "court:p2", "p2", "p3");
  for (const player of ["p1", "p2"]) {
    assert.equal(forbiddenBy(state, "research", player), undefined);
    assert.equal(forbiddenBy(state, "harvest", player)!.id, "stockpiles");
    assert.equal(forbiddenBy(state, "move", player)!.id, "general-blockade");
  }
  for (const player of ["p3", "p4"]) {
    assert.equal(forbiddenBy(state, "research", player)!.id, "block-inquiry");
    assert.equal(hasActionCard(state, player, "research"), false);
  }
  assert.equal(hasActionCard(state, "p2", "research"), true);
  release(state, "p2");
  assert.equal(hasActionCard(state, "p2", "research"), false);
  addItem(state, "vassal-treaty", "court:p1", "p1", "p4");
  assert.equal(hasActionCard(state, "p4", "research"), true);
  const snapshot = kin.snapshot(state, "p3", new Set(state.order));
  assert.equal(snapshot.world!.forbiddenActions.p3.includes("research"), true);
  assert.equal(snapshot.world!.forbiddenActions.p1.includes("research"), false);
  assert.equal(snapshot.world!.activeLaws.length, 4);
});

test("Iron Grip taps at least one source at zero power, then uses necessary multiple Control sources", () => {
  const state = game();
  state.laws!.discard = ["stockpiles", "block-inquiry", "general-blockade", "zone-districts"];
  state.laws!.deck = state.laws!.deck.filter(law => !state.laws!.discard.includes(law));
  const zeroTap = source(state);
  assert.notEqual(dispatch(state, act("ironGrip", "p1", { law: "stockpiles", track: "rebel" })), null);
  send(state, "ironGrip", "p1", { ...zeroTap, law: "stockpiles", track: "rebel" });
  assert.equal(state.items.find(item => item.id === zeroTap.card)!.tapped, true);
  send(state, "ironGrip", "p1", { ...source(state), law: "block-inquiry", track: "rebel" });
  const tap = source(state);
  assert.notEqual(dispatch(state, act("ironGrip", "p1", { ...tap, law: "general-blockade", track: "rebel" })), null);
  const extra = addItem(state, "activation-control", "court:p1", "p1");
  send(state, "ironGrip", "p1", { ...tap, extra: [{ kind: "item", id: extra.id }], law: "general-blockade", track: "kingdom" });
  assert.equal(extra.tapped, true);
  assert.deepEqual(state.kingdom!.rebel, ["stockpiles", "block-inquiry"]);
  assert.deepEqual(state.kingdom!.kingdom, ["general-blockade"]);
  assert.equal(state.laws!.discard.includes("general-blockade"), false);
});

test("Iron Grip rejects extra, duplicate, wrong-phase, non-King, invalid track and non-discard selections", () => {
  const state = game();
  state.laws!.discard = ["stockpiles"];
  const tap = source(state);
  const extra = addItem(state, "activation-control", "court:p1", "p1");
  for (const payload of [
    { extra: [{ kind: "item", id: extra.id }] },
    { extra: [{ kind: "item", id: tap.card }] },
    { track: "invalid" },
    { law: "general-blockade" }
  ]) assert.notEqual(dispatch(state, act("ironGrip", "p1", { ...tap, law: "stockpiles", track: "kingdom", ...payload })), null);
  assert.notEqual(dispatch(state, act("ironGrip", "p2", { ...source(state, "p2"), law: "stockpiles", track: "kingdom" })), null);
  assert.notEqual(dispatch(state, act("ironGrip", "p1", { ...source(state, "p1", "expansion"), law: "stockpiles", track: "kingdom" })), null);
});

test("Iron Grip accepts a Graphiscope Control source and consumes it instead of tapping an unrelated card", () => {
  const state = game();
  state.kingdom!.rebel = ["general-blockade", "stockpiles"];
  state.laws!.discard = ["block-inquiry"];
  state.laws!.deck = state.laws!.deck.filter(id => ![...activeLaws(state), "block-inquiry"].includes(id));
  state.tactics = { deck: [], discard: [], hands: { p1: ["graphiscope"] }, shuffled: { tactics: true, secret: false }, archeologists: [] };
  send(state, "ironGrip", "p1", { kind: "tactic", card: "graphiscope", law: "block-inquiry", track: "kingdom" });
  assert.deepEqual(state.tactics.hands.p1, []);
  assert.equal(state.tactics.discard.includes("graphiscope"), true);
  assert.deepEqual(state.kingdom!.kingdom, ["block-inquiry"]);
});

test("Rebel compares only personal deployed strength, dissolves without penalties, and ignores Enforce Treaties", () => {
  const state = game();
  armies(state, { p1: 2, p2: 2, p3: 20 });
  state.armies.push({ id: "ark", owner: "p2", tile: -1, strength: 8 });
  assert.equal(personalStrength(state, "p2"), 2);
  assert.notEqual(dispatch(state, act("rebel", "p2", source(state, "p2"))), null);
  state.armies.find(army => army.owner === "p2" && army.tile >= 0)!.strength = 3;
  state.kingdom!.kingdom = ["enforce-treaties"];
  assert.equal(hasActionCard(state, "p2", "dissolve"), false);
  const tap = source(state, "p2");
  send(state, "rebel", "p2", tap);
  assert.equal(state.items.find(item => item.id === tap.card)!.tapped, true);
  assert.equal(state.items.some(item => item.def === "vassal-treaty" && item.giver === "p2"), false);
  assert.equal(state.items.some(item => item.def === "vassal-ban"), false);
  assert.equal(state.players.p2.resources.gold, 10);
  assert.equal(state.play!.turn, "p3");
  assert.notEqual(dispatch(state, act("rebel", "p2", source(state, "p2"))), null);
});

test("after rebelling players may barter new Vassal Treaties normally, but a Vassal Ban still prevents it", () => {
  const state = game();
  armies(state, { p1: 1, p2: 2 });
  send(state, "rebel", "p2", source(state, "p2"));
  const offer = { to: "p3", mint: [{ def: "vassal-treaty", giver: "from" }] };
  send(state, "barter", "p2", { ...source(state, "p2", "discovery"), ...offer });
  send(state, "barterRespond", "p3", { accept: true });
  assert.equal(state.items.some(item => item.def === "vassal-treaty" && item.giver === "p2" && item.zone === "court:p3"), true);
  release(state, "p2");
  addItem(state, "vassal-ban", "court:p2", "p2");
  assert.match(dispatch(state, act("barter", "p2", { ...source(state, "p2", "discovery"), ...offer })) ?? "", /Ban/);
});

test("the King can Dissolve a subject and Revoke any selected law from either track", () => {
  const state = game();
  addItem(state, "dissolve", "board:phase");
  const treaty = state.items.find(item => item.def === "vassal-treaty" && item.giver === "p2")!;
  send(state, "dissolve", "p1", { ...source(state, "p1", "discovery"), treaty: treaty.id });
  assert.equal(state.items.some(item => item.id === treaty.id), false);
  addItem(state, "revoke", "board:phase");
  state.kingdom!.rebel = ["general-blockade"];
  state.kingdom!.kingdom = ["stockpiles"];
  state.laws!.deck = state.laws!.deck.filter(id => !activeLaws(state).includes(id));
  addItem(state, "influential", "court:p1", "p1");
  state.players.p1.resources.influence = 2;
  for (const law of ["general-blockade", "stockpiles"]) {
    send(state, "revoke", "p1", { ...source(state, "p1", "expansion"), influence: true, law });
    assert.equal(activeLaws(state).includes(law), false);
    assert.equal(state.laws!.discard.includes(law), true);
  }
});

test("Revoke from a Kingdom track still requires five Expansion power and a specific law when multiple are active", () => {
  const state = game();
  state.kingdom!.rebel = ["general-blockade"];
  state.kingdom!.kingdom = ["stockpiles"];
  addItem(state, "revoke", "board:phase");
  const tap = source(state, "p2", "expansion");
  const extras = Array.from({ length: 4 }, () => ({ kind: "item", id: addItem(state, "activation-expansion", "court:p2", "p2").id }));
  assert.notEqual(dispatch(state, act("revoke", "p2", { ...tap, extra: extras })), null);
  assert.notEqual(dispatch(state, act("revoke", "p2", { ...tap, law: "stockpiles" })), null);
  send(state, "revoke", "p2", { ...tap, extra: extras, law: "stockpiles" });
  assert.equal(extras.every(extra => state.items.find(item => item.id === extra.id)!.tapped), true);
  assert.deepEqual(state.kingdom!.rebel, ["general-blockade"]);
  assert.deepEqual(state.kingdom!.kingdom, []);
  assert.equal(state.laws!.discard.includes("stockpiles"), true);
});

test("effective laws reject Rebel research while allowing immune direct vassals, and block everyone on the Kingdom track", () => {
  const state = game();
  state.kingdom!.rebel = ["block-inquiry"];
  release(state, "p3");
  const technology = state.items.find(item => item.def === "harbor-construction")!;
  assert.match(dispatch(state, act("research", "p3", { ...source(state, "p3", "discovery"), tech: technology.id })) ?? "", /Block Inquiry/);
  send(state, "research", "p2", { ...source(state, "p2", "discovery"), tech: technology.id });
  state.kingdom!.rebel = [];
  state.kingdom!.kingdom = ["block-inquiry"];
  const other = state.items.find(item => item.def === "archeology-science")!;
  assert.match(dispatch(state, act("research", "p1", { ...source(state, "p1", "discovery"), tech: other.id })) ?? "", /Block Inquiry/);
});

test("Kingdom victory requires both law piles empty and takes priority over a stronger Rebel", () => {
  const state = game();
  release(state, "p2");
  armies(state, { p1: 1, p2: 5, p3: 1, p4: 1 });
  state.laws!.deck = ["general-blockade"];
  state.laws!.discard = [];
  assert.equal(kingdomWinner(state), "p2");
  state.laws!.deck = [];
  state.laws!.discard = ["general-blockade"];
  assert.equal(kingdomWinner(state), "p2");
  state.laws!.discard = [];
  assert.equal(kingdomWinner(state), "p1");
  state.play!.turn = "p1";
  for (const player of state.order) send(state, "pass", player);
  assert.equal(state.result!.winner, "p1");
  assert.equal(state.result!.chapter, "kingdom");
});

test("technology-locked laws do not block victory but newly researched laws enter once, never duplicating tracked laws", () => {
  const state = game();
  state.kingdom!.kingdom = availableLaws(state).map(law => law.id);
  state.laws = { deck: [], discard: [], enacted: null };
  assert.equal(kingdomWinner(state), "p1");
  const technology = state.items.find(item => item.def === "archeology-science")!;
  technology.zone = "court:p2";
  technology.owner = "p2";
  assert.equal(kingdomWinner(state), null);
  assert.deepEqual([...lawBoard(state).deck].sort(), ["cargo-enforcement", "protect-ancestry"]);
  state.kingdom!.rebel.push(...state.laws!.deck);
  state.laws!.deck = [];
  assert.equal(kingdomWinner(state), "p1");
  assert.equal(lawBoard(state).deck.length, 0);
});

test("Rebel victory aggregates chains, excludes Ark armies and vassals, and requires strict superiority to every other side", () => {
  const state = game();
  release(state, "p2");
  release(state, "p3");
  release(state, "p4");
  addItem(state, "vassal-treaty", "court:p2", "p2", "p3");
  addItem(state, "vassal-treaty", "court:p3", "p3", "p4");
  armies(state, { p1: 5, p2: 2, p3: 2, p4: 2 });
  assert.equal(kingdomWinner(state), "p2");
  state.armies.find(army => army.owner === "p1")!.strength = 6;
  assert.equal(kingdomWinner(state), null);
  state.armies.push({ id: "ark", owner: "p2", tile: -1, strength: 8 });
  assert.equal(kingdomWinner(state), null);
  state.armies.find(army => army.owner === "p3")!.strength = 20;
  assert.equal(kingdomWinner(state), "p2");
  state.items = state.items.filter(item => !(item.def === "vassal-treaty" && item.giver === "p3"));
  armies(state, { p1: 1, p2: 2, p3: 2, p4: 0 });
  assert.equal(kingdomWinner(state), null);
});

test("the King's victory strength includes indirect vassals even though their rebel-track immunity does not", () => {
  const state = game();
  release(state, "p3");
  release(state, "p4");
  addItem(state, "vassal-treaty", "court:p2", "p2", "p3");
  armies(state, { p1: 1, p2: 1, p3: 6, p4: 7 });
  assert.equal(kingdomWinner(state), null);
  state.armies.find(army => army.owner === "p4")!.strength = 9;
  assert.equal(kingdomWinner(state), "p4");
  state.kingdom!.rebel = ["block-inquiry"];
  assert.equal(forbiddenBy(state, "research", "p2"), undefined);
  assert.equal(forbiddenBy(state, "research", "p3")!.id, "block-inquiry");
});

test("cleanup returns and reshuffles tracked laws, removes chapter cards, and preserves treaties and public diplomacy", () => {
  const state = game();
  state.kingdom!.rebel = ["general-blockade"];
  state.kingdom!.kingdom = ["stockpiles"];
  state.laws!.deck = state.laws!.deck.filter(id => !activeLaws(state).includes(id));
  state.laws!.discard = [state.laws!.deck.pop()!];
  const before = [...state.laws!.deck, ...state.laws!.discard, ...activeLaws(state)].sort();
  const treaties = structuredClone(state.items.filter(item => item.def === "vassal-treaty"));
  cleanupKingdom(state);
  assert.equal(state.kingdom, undefined);
  assert.deepEqual([...state.laws!.deck].sort(), before);
  assert.deepEqual(state.laws!.discard, []);
  assert.deepEqual(state.items.filter(item => item.def === "vassal-treaty"), treaties);
  assert.equal(state.items.find(item => item.def === "vassal-diplomacy")!.zone, "board:public");
  assert.equal(state.items.some(item => cardById(item.def)?.chapter === "kingdom"), false);
});

test("chapter selection starts Kingdom and later cleans it up before Commonwealth starts", () => {
  const state = beforeKingdom();
  state.chapter!.current = "new-dawn";
  state.chapter!.pending = { player: "p1", choices: ["kingdom"] };
  send(state, "chooseChapter", "p1", { chapter: "kingdom" });
  assert.equal(state.chapter!.current, "kingdom");
  assert.equal(state.kingdom!.king, "p1");
  assert.equal(state.round, 3);
  assert.equal(state.play!.phase, "event");
  state.kingdom!.rebel = ["general-blockade"];
  state.laws!.deck = state.laws!.deck.filter(id => id !== "general-blockade");
  state.chapter!.pending = { player: "p1", choices: ["commonwealth"] };
  send(state, "chooseChapter", "p1", { chapter: "commonwealth" });
  assert.equal(state.kingdom, undefined);
  assert.equal(state.commonwealth!.leader, "p1");
  assert.equal(state.commonwealth!.regularLaws.deck.includes("general-blockade"), true);
  assert.equal(state.items.filter(item => item.def === "vassal-treaty").length, 3);
  assert.equal(state.items.some(item => item.def === "righteous-ruler"), false);
  assert.equal(state.round, 4);
});

test("Kingdom snapshots expose tracks, direct subjects, aggregated strength, royal choices, and Revoke law targets", () => {
  const state = game();
  state.kingdom!.rebel = ["general-blockade"];
  armies(state, { p1: 1, p2: 2, p3: 3, p4: 4 });
  const snapshot = kin.snapshot(state, "p1", new Set(state.order));
  assert.deepEqual(snapshot.world!.kingdom!.strength, { p1: 10 });
  assert.equal(snapshot.world!.kingdom!.personalStrength.p2, 2);
  assert.deepEqual(snapshot.world!.kingdom!.directVassals, ["p2", "p3", "p4"]);
  assert.equal(snapshot.world!.play!.options!.ironGrip!.power, 1);
  source(state, "p1", "expansion");
  assert.deepEqual(kin.snapshot(state, "p1", new Set(state.order)).world!.play!.options!.revokeLaws, ["general-blockade"]);
});

test("autopilot completes royal decisions and Quantum Collapse without invalid passes", () => {
  const state = game();
  addItem(state, "quantum-collapse", "court:p3", "p3");
  council(state);
  assert.deepEqual(kinBotMove(state, "p3"), { type: "quantum", cards: state.play!.quantum!.options.slice(0, 3) });
  send(state, "quantum", "p3", { cards: state.play!.quantum!.options.slice(0, 3) });
  assert.deepEqual(kinBotMove(state, "p1"), { type: "royalEnact", law: state.play!.council!.laws[0], track: "rebel" });
  assert.equal(kinBotMove(state, "p2"), null);
  assert.equal(kinBotMove(state, "p1", { forcePass: false }), null);
});
