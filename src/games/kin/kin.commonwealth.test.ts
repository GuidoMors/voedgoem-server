import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, deserialize, dispatch, serialize } from "./engine";
import { addItem, dealBoardCards } from "./cards";
import { kinBotMove } from "./bots";
import { COMMONWEALTH_LAWS } from "./cards.data";
import { cleanupCommonwealth, startCommonwealth } from "./commonwealth";
import { characterPicker, characterRound, eligibleCharacters, naturalOrder } from "./draft";
import { buildOptions } from "./expansion";
import { kin } from "./index";
import { availableLaws, lawBoard } from "./laws";
import { setupChoices } from "./setup";
import { commonwealthWinner, newDawnWinner, victoryGold } from "./victory";
import { createWorld, neighbors, TILE_COUNT } from "./world";
import type { Action, KinState } from "./types";

const act = (type: string, id = "p1", extra: Record<string, unknown> = {}): Action =>
  ({ type, actor: { id, username: id, isHost: id === "p1" }, ...extra });
const send = (state: KinState, type: string, id = "p1", extra: Record<string, unknown> = {}) =>
  assert.equal(dispatch(state, act(type, id, extra)), null);

function game(): KinState {
  const state = createState(42);
  state.phase = "playing";
  state.options.mode = "long";
  state.order = state.seats = ["p1", "p2", "p3"];
  for (const id of state.order) state.players[id] = { id, username: id, connected: true, resources: { gold: 10, gear: 20, lumber: 20, stone: 20, food: 20 } };
  state.world = createWorld();
  state.world.step = "done";
  state.world.kinPicks = { p1: "ethereal", p2: "hanshu", p3: "wanderers" };
  state.tiles = Array.from({ length: TILE_COUNT }, () => ({ col: 0, row: 0, terrain: "plains", tapped: false }));
  state.round = 2;
  state.play = { phase: "control", turn: "p1", passes: 0, move: null, barter: null, verdicts: [] };
  state.chapter = { current: "commonwealth", leader: "p1", history: [{ chapter: "new-dawn", winner: "p1", round: 1 }], points: { p1: 1 } };
  dealBoardCards(state);
  for (const id of state.order) {
    addItem(state, "activation-control", `court:${id}`, id);
    addItem(state, "activation-discovery", `court:${id}`, id);
    addItem(state, "activation-expansion", `court:${id}`, id);
  }
  startCommonwealth(state, "p1");
  return state;
}

function source(state: KinState, player: string, phase = "control") {
  const item = state.items.find(item => item.def === `activation-${phase}` && item.owner === player)!;
  item.tapped = false;
  state.play!.phase = phase as "control" | "discovery" | "expansion";
  state.play!.turn = player;
  return { kind: "item", card: item.id };
}

function donation(state: KinState, amounts: number[], last = false) {
  state.play!.phase = "event";
  state.play!.turn = "p1";
  state.items.find(item => item.def === "commonwealth-donation")!.tapped = false;
  send(state, "activateEvent", "p1", { def: "commonwealth-donation" });
  if (state.play!.schemer) send(state, "schemerRespond", "p1", { last });
  for (const amount of amounts) send(state, "donate", state.play!.turn, { gold: amount });
}

test("Commonwealth replaces the law deck without publicizing Council Science and restores it on cleanup", () => {
  const state = game();
  cleanupCommonwealth(state);
  state.laws = { deck: ["block-inquiry"], discard: [], enacted: "general-blockade" };
  startCommonwealth(state, "p1");
  assert.deepEqual(state.commonwealth!.members, state.order);
  assert.equal(state.commonwealth!.step, 1);
  assert.equal(state.commonwealth!.value, 1);
  assert.deepEqual(availableLaws(state).map(law => law.id), COMMONWEALTH_LAWS.map(law => law.id));
  assert.equal(state.laws!.enacted, null);
  assert.equal(state.laws!.deck.length, 8);
  assert.equal(state.items.find(item => item.def === "council-science")!.zone, "board:research");
  cleanupCommonwealth(state);
  assert.deepEqual(state.laws, { deck: ["block-inquiry"], discard: ["general-blockade"], enacted: null });
  assert.equal(state.items.some(item => item.def === "cautious-schemer" || item.def === "oppose"), false);
  assert.equal(lawBoard(state).deck.includes("freedom-of-movement"), false);
});

test("donations spend gold, advance once, cap the value at 20, and pay half rounded down to the current leader", () => {
  const state = game();
  donation(state, [2, 3, 0], true);
  assert.equal(state.commonwealth!.step, 2);
  assert.equal(state.commonwealth!.value, 5);
  assert.deepEqual(state.order.map(id => state.players[id].resources.gold), [12, 8, 7]);
  assert.equal(state.play!.donation, null);
  assert.equal(state.play!.eventLast, undefined);
  for (const player of state.order) state.players[player].resources.gold = 20;
  state.commonwealth!.step = 10;
  donation(state, [10, 10, 10]);
  assert.equal(state.commonwealth!.step, 10);
  assert.equal(state.commonwealth!.value, 20);
  assert.equal(state.players.p1.resources.gold, 25);
});

test("failed and zero donations keep the step and reduce the value to the donated total, minimum one", () => {
  const state = game();
  state.commonwealth!.step = 5;
  state.commonwealth!.value = 8;
  donation(state, [1, 1, 1]);
  assert.equal(state.commonwealth!.step, 5);
  assert.equal(state.commonwealth!.value, 3);
  donation(state, [0, 0, 0]);
  assert.equal(state.commonwealth!.value, 1);
  assert.equal(state.commonwealth!.step, 5);
});

test("an Opposition majority skips donations and moves left without changing the value", () => {
  const state = game();
  state.commonwealth!.members = ["p1"];
  state.commonwealth!.oppositionLeader = "p2";
  state.commonwealth!.step = 4;
  state.commonwealth!.value = 7;
  donation(state, []);
  assert.equal(state.commonwealth!.step, 3);
  assert.equal(state.commonwealth!.value, 7);
  assert.equal(state.play!.schemer, undefined);
  assert.equal(state.play!.donation, undefined);
  assert.deepEqual(state.order.map(id => state.players[id].resources.gold), [10, 10, 10]);
  state.commonwealth!.step = 1;
  donation(state, []);
  assert.equal(state.commonwealth!.step, 1);
});

test("donation decisions validate amounts, actors and pending-state blocking and survive a save", () => {
  const state = game();
  state.play!.phase = "event";
  send(state, "activateEvent", "p1", { def: "commonwealth-donation" });
  assert.match(dispatch(state, act("pass")) ?? "", /Commonwealth decision/);
  assert.match(dispatch(state, act("schemerRespond", "p2", { last: true })) ?? "", /owner/);
  send(state, "schemerRespond", "p1", { last: false });
  for (const gold of [-1, 0.5, 11, "1", NaN]) assert.notEqual(dispatch(state, act("donate", "p1", { gold })), null);
  assert.notEqual(dispatch(state, act("donate", "p2", { gold: 0 })), null);
  const restored = deserialize(serialize(state));
  send(restored, "donate", "p1", { gold: 0 });
  assert.equal(restored.play!.turn, "p2");
});

test("Oppose asks permission at equal population; refusal still taps and ends the offering turn", () => {
  const state = game();
  const tap = source(state, "p2");
  send(state, "oppose", "p2", tap);
  assert.equal(state.items.find(item => item.id === tap.card)!.tapped, true);
  assert.deepEqual(state.play!.oppose, { player: "p2", leader: "p1" });
  assert.match(dispatch(state, act("opposeRespond", "p3", { accept: true })) ?? "", /leader/);
  send(state, "opposeRespond", "p1", { accept: false });
  assert.equal(state.play!.turn, "p3");
  assert.equal(state.commonwealth!.members.includes("p2"), true);
  assert.equal(state.items.find(item => item.id === tap.card)!.tapped, true);
  send(state, "oppose", "p2", source(state, "p2"));
  send(state, "opposeRespond", "p1", { accept: true });
  assert.equal(state.commonwealth!.members.includes("p2"), false);
  assert.equal(state.commonwealth!.oppositionLeader, "p2");
  assert.notEqual(dispatch(state, act("oppose", "p2", source(state, "p2"))), null);
});

test("larger personal population bypasses permission and returning members do not replace the Opposition Leader", () => {
  const state = game();
  state.buildings.push({ id: "b1", def: "village", kind: "tile", owner: "p2", tile: 20 });
  send(state, "oppose", "p2", source(state, "p2"));
  assert.equal(state.play!.oppose, undefined);
  assert.equal(state.commonwealth!.oppositionLeader, "p2");
  send(state, "oppose", "p3", source(state, "p3"));
  send(state, "opposeRespond", "p1", { accept: true });
  send(state, "oppose", "p3", source(state, "p3"));
  send(state, "opposeRespond", "p2", { accept: true });
  assert.equal(state.commonwealth!.members.includes("p3"), true);
  assert.equal(state.commonwealth!.oppositionLeader, "p2");
});

test("Overthrow uses personal gold, changes only the party leader, and does not transfer Cautious Schemer", () => {
  const state = game();
  assert.notEqual(dispatch(state, act("overthrow", "p2", source(state, "p2"))), null);
  state.players.p2.resources.gold = 11;
  send(state, "overthrow", "p2", source(state, "p2"));
  assert.equal(state.commonwealth!.leader, "p2");
  assert.equal(state.chapter!.leader, "p1");
  assert.equal(state.items.find(item => item.def === "cautious-schemer")!.owner, "p1");
  state.buildings.push({ id: "b1", def: "village", kind: "tile", owner: "p1", tile: 20 });
  send(state, "oppose", "p1", source(state, "p1"));
  assert.equal(state.commonwealth!.oppositionLeader, "p1");
  assert.equal(state.items.find(item => item.def === "cautious-schemer")!.owner, "p1");
});

test("Cautious Schemer chooses before Council, orders only eligible voters, and Opposition may vote", () => {
  const state = game();
  const science = state.items.find(item => item.def === "council-science")!;
  science.zone = "board:public";
  addItem(state, "council", "board:phase");
  state.commonwealth!.members = ["p1", "p3"];
  state.commonwealth!.oppositionLeader = "p2";
  state.play!.phase = "event";
  send(state, "activateEvent", "p1", { def: "council" });
  assert.equal(state.play!.council, undefined);
  send(state, "schemerRespond", "p1", { last: true });
  assert.deepEqual(state.play!.council!.voters, ["p2", "p3", "p1"]);
  assert.equal(state.play!.council!.laws.every(id => id.startsWith("freedom-of-")), true);
  for (const id of ["p2", "p3", "p1"]) send(state, "vote", id, { law: state.play!.council!.laws[0] });
  science.zone = "court:p2";
  science.owner = "p2";
  state.play!.phase = "event";
  state.play!.turn = "p1";
  state.items.find(item => item.def === "council")!.tapped = false;
  send(state, "activateEvent", "p1", { def: "council" });
  assert.equal(state.play!.schemer, null);
  assert.deepEqual(state.play!.council!.voters, ["p2"]);
});

test("Cautious Schemer can order the Tactician auction without granting participation", () => {
  const state = game();
  state.items.find(item => item.def === "tactician-science")!.zone = "board:public";
  addItem(state, "tactician", "board:phase");
  state.tactics = { deck: ["blackmail"], discard: [], hands: {}, shuffled: { tactics: true, secret: false }, archeologists: [] };
  state.play!.phase = "event";
  send(state, "activateEvent", "p1", { def: "tactician" });
  assert.equal(state.play!.schemer!.event, "tactician");
  send(state, "schemerRespond", "p1", { last: true });
  assert.deepEqual(state.play!.auction!.order, ["p2", "p3", "p1"]);
  assert.equal(state.play!.auction!.card, "blackmail");
});

test("Commonwealth victory checks gold first, then marker conditions; vassals cannot win", () => {
  const state = game();
  state.commonwealth!.oppositionLeader = "p2";
  state.commonwealth!.members = ["p1", "p3"];
  state.commonwealth!.step = 10;
  assert.equal(commonwealthWinner(state), "p1");
  state.players.p2.resources.gold = 21;
  assert.equal(commonwealthWinner(state), "p2");
  state.players.p2.resources.gold = 20;
  assert.equal(commonwealthWinner(state), "p1");
  state.commonwealth!.step = 1;
  assert.equal(commonwealthWinner(state), "p2");
  addItem(state, "vassal-treaty", "court:p3", "p3", "p2");
  assert.deepEqual(victoryGold(state), { p1: 10, p3: 30 });
  assert.equal(commonwealthWinner(state), "p3");
  state.players.p1.resources.gold = 30;
  assert.equal(commonwealthWinner(state), null);
});

test("the Opposition can win at the initial step, but victory is only checked after Control", () => {
  const state = game();
  state.commonwealth!.members = ["p1", "p3"];
  state.commonwealth!.oppositionLeader = "p2";
  state.play!.phase = "discovery";
  for (const player of state.order) send(state, "pass", player);
  assert.equal(state.result, undefined);
  state.play!.phase = "control";
  state.play!.turn = "p1";
  for (const player of state.order) send(state, "pass", player);
  assert.equal(state.chapter!.history.at(-1)!.winner, "p2");
  assert.equal(state.chapter!.history.at(-1)!.chapter, "commonwealth");
  assert.deepEqual(state.chapter!.pending, { player: "p2", choices: ["kingdom", "exploration"] });
});

test("the same player winning New Dawn and Commonwealth wins a long game", () => {
  const state = game();
  state.commonwealth!.step = 10;
  for (const id of state.order) send(state, "pass", id);
  assert.equal(state.result!.winner, "p1");
  assert.equal(state.result!.reason, "The winner won two chapters in a row.");
  assert.equal(state.result!.points.p1, 2);
});

test("campaign hubris returns to New Dawn and requires the chapter leader's replacement Kin", () => {
  const state = game();
  state.options.mode = "campaign";
  state.commonwealth!.step = 10;
  for (const id of state.order) send(state, "pass", id);
  assert.deepEqual(state.chapter!.pending, { player: "p1", choices: ["new-dawn"] });
  send(state, "chooseChapter", "p1", { chapter: "new-dawn" });
  assert.equal(state.commonwealth, undefined);
  assert.equal(state.world!.redraftPlayer, "p1");
  assert.deepEqual(state.chapter!.retiredKins, ["ethereal"]);
  assert.equal(state.items.some(item => item.def === "commonwealth-donation"), false);
});

test("autopilot answers Commonwealth decisions and chooses a pending chapter without invalid passes", () => {
  const state = game();
  state.play!.phase = "event";
  send(state, "activateEvent", "p1", { def: "commonwealth-donation" });
  assert.deepEqual(kinBotMove(state, "p1"), { type: "schemerRespond", last: false });
  send(state, "schemerRespond", "p1", { last: false });
  assert.deepEqual(kinBotMove(state, "p1"), { type: "donate", gold: 0 });
  state.play!.donation = null;
  state.play!.oppose = { player: "p2", leader: "p1" };
  assert.deepEqual(kinBotMove(state, "p1"), { type: "opposeRespond", accept: false });
  state.play!.oppose = null;
  state.chapter!.pending = { player: "p2", choices: ["commonwealth"] };
  assert.deepEqual(kinBotMove(state, "p2"), { type: "chooseChapter", chapter: "commonwealth" });
  assert.equal(kinBotMove(state, "p1"), null);
});

test("snapshots expose chapter/party state, eligible gold, decisions and Commonwealth laws", () => {
  const state = game();
  const snapshot = kin.snapshot(state, "p1", new Set(state.order));
  assert.equal(snapshot.victory!.chapter, "commonwealth");
  assert.deepEqual(snapshot.world!.commonwealth!.gold, { p1: 10, p2: 10, p3: 10 });
  assert.equal(snapshot.world!.lawList.filter(law => law.rewards).length, 8);
  assert.deepEqual(snapshot.victory!.history, state.chapter!.history);
});

for (const law of COMMONWEALTH_LAWS) test(`${law.name} pays exactly one gold per completed action, only to Commonwealth members`, () => {
  const state = game();
  const action = law.rewards[0];
  const phase = ["build", "reclaim"].includes(action) ? "expansion" : ["harvest", "embark"].includes(action) ? "control" : "discovery";
  const tap = source(state, "p1", phase);
  if (!state.items.some(item => item.def === action && item.zone === "board:phase")) addItem(state, action, "board:phase");
  state.buildings.push({ id: "b1", def: "village", kind: "tile", owner: "p1", tile: 30 });
  let payload: Record<string, unknown> = {};
  if (action === "research" || action === "publicize") {
    const tech = state.items.find(item => item.def === "harbor-construction")!;
    if (action === "publicize") { tech.zone = "court:p1"; tech.owner = "p1"; }
    payload = { tech: tech.id };
  } else if (action === "dissolve") payload = { treaty: addItem(state, "access-treaty", "court:p1", "p1", "p2").id };
  else if (action === "reclaim") {
    state.blocks = [{ tile: 30, kind: "relic" }];
    state.armies.push({ id: "a1", owner: "p1", tile: 30, strength: 1 });
    payload = { building: "b1" };
  } else if (action === "harvest") {
    state.tiles[60].terrain = "forest";
    state.armies.push({ id: "a1", owner: "p1", tile: 60, strength: 1 });
    payload = { army: "a1" };
  } else if (action === "embark") {
    const tile = neighbors(30)[0];
    state.tiles[tile].terrain = "ocean";
    state.buildings.push({ id: "b2", def: "harbor", kind: "slice", owner: "p1", tile: 30, side: 0 });
    state.armies.push({ id: "a1", owner: "p1", tile: 30, strength: 1 });
    payload = { army: "a1", tile };
  } else if (action === "build") {
    const option = buildOptions(state, "p1").find(option => option.def === "university")!;
    const place = option.places[0];
    const extra = Array.from({ length: place.power - 1 }, () => ({ kind: "item", id: addItem(state, "activation-expansion", "court:p1", "p1").id }));
    payload = { def: option.def, place, extra };
  } else if (action === "move") {
    state.armies.push({ id: "a1", owner: "p1", tile: 60, strength: 1 });
    payload = { army: "a1" };
  }
  const execute = (target: KinState) => {
    send(target, action === "move" ? "activateMove" : action, "p1", { ...tap, ...payload });
    if (action === "move") {
      assert.equal(target.players.p1.resources.gold, 10);
      send(target, "moveStep", "p1", { tile: neighbors(60)[0] });
      if (target.play!.move) send(target, "moveStop");
    }
  };
  const baseline = structuredClone(state);
  execute(baseline);
  const opposition = structuredClone(state);
  opposition.commonwealth!.members = ["p2", "p3"];
  opposition.commonwealth!.oppositionLeader = "p1";
  opposition.laws!.enacted = law.id;
  execute(opposition);
  assert.equal(opposition.players.p1.resources.gold, baseline.players.p1.resources.gold);
  state.laws!.enacted = law.id;
  execute(state);
  assert.equal(state.players.p1.resources.gold, baseline.players.p1.resources.gold + 1);
});

test("cancelled Moves and invalid actions do not earn law rewards; Revoke discards Commonwealth laws", () => {
  const state = game();
  state.laws!.enacted = "freedom-of-movement";
  state.armies.push({ id: "a1", owner: "p1", tile: 60, strength: 1 });
  send(state, "activateMove", "p1", { ...source(state, "p1", "discovery"), army: "a1" });
  send(state, "moveStop");
  assert.equal(state.players.p1.resources.gold, 10);
  state.laws!.enacted = "freedom-of-research";
  assert.notEqual(dispatch(state, act("research", "p1", { ...source(state, "p1", "discovery"), tech: "missing" })), null);
  assert.equal(state.players.p1.resources.gold, 10);
  addItem(state, "revoke", "board:phase");
  const tap = source(state, "p1", "expansion");
  const extra = Array.from({ length: 4 }, () => ({ kind: "item", id: addItem(state, "activation-expansion", "court:p1", "p1").id }));
  send(state, "revoke", "p1", { ...tap, extra });
  assert.equal(state.laws!.enacted, null);
  assert.equal(state.laws!.discard.includes("freedom-of-research"), true);
});

test("campaign chapter changes collapse only the old leader and resume after replacement setup and character draft", () => {
  const state = game();
  state.options.mode = "campaign";
  state.chapter!.history = [];
  state.chapter!.points = {};
  state.chapter!.current = "new-dawn";
  cleanupCommonwealth(state);
  state.items = [];
  state.players.p2.resources = { mana: 1, relic: 1 };
  state.armies = [{ id: "a1", owner: "p2", tile: 20, strength: 3 }];
  addItem(state, "trade-treaty", "court:p2", "p2");
  state.buildings = [{ id: "b1", def: "village", kind: "tile", tile: 30, owner: "p1" }];
  state.cards.hostage = { id: "hostage", def: "hostage", owner: "p1", zone: "court:p1", tapped: true, hostageOf: "p3" };
  assert.equal(newDawnWinner(state), "p2");
  for (const id of state.order) send(state, "pass", id);
  assert.equal(state.chapter!.collapse, "p1");
  send(state, "chooseChapter", "p2", { chapter: "commonwealth" });
  assert.equal(state.phase, "draft");
  assert.equal(state.cards.hostage.owner, "p3");
  assert.equal(state.armies[0].owner, "p2");
  assert.equal(state.blocks!.some(block => block.tile === 30 && block.kind === "ruins"), true);
  assert.notEqual(dispatch(state, act("pickKin", "p1", { kin: "ethereal" })), null);
  send(state, "pickKin", "p1", { kin: "lumon" });
  for (let guard = 0; state.world!.step === "setup" && guard < 50; guard++) {
    const choices = setupChoices(state)!;
    send(state, "setupPlace", "p1", choices.tile !== null ? { side: choices.sides[0] } : { tile: choices.tiles[0] });
  }
  for (let guard = 0; state.world!.step === "characters" && guard < 10; guard++) {
    assert.equal(characterPicker(state), "p1");
    send(state, "pickCharacter", "p1", { character: eligibleCharacters(state, "p1", characterRound(state))[0].id });
  }
  assert.equal(state.world!.step, "done");
  assert.equal(state.phase, "playing");
  assert.equal(state.commonwealth!.leader, "p2");
  assert.equal(state.round, 3);
  assert.equal(state.players.p2.resources.mana, 1);
  assert.equal(state.items.filter(item => item.def === "cautious-schemer").length, 1);
  assert.equal(new Set(state.items.map(item => item.id)).size, state.items.length);
  assert.deepEqual(naturalOrder(state), ["p2", "p3", "p1"]);
});
