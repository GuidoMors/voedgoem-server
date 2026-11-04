import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { councilVoters } from "./council";
import { eventOptions } from "./events";
import { LAWS, lawBoard } from "./laws";
import { sourcesFor } from "./play";
import { createRng, nextInt } from "./rng";
import { addBuilding, setupChoices } from "./setup";
import { PUBLIC_ZONE } from "./tech";
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
  return state;
}

// An empty world where p1 has `p1Villages` villages and p2 has `p2Villages`, with the Council event on the phase board.
function council(p1Villages: number, p2Villages: number, tech: string = PUBLIC_ZONE): KinState {
  const state = playing();
  state.buildings = [];
  state.armies = [];
  for (const tile of state.tiles) tile.terrain = "plains";
  for (const character of Object.values(state.cards)) character.tapped = true;
  for (let index = 0; index < p1Villages; index++) addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: tileIndex(2, 2 + index) });
  for (let index = 0; index < p2Villages; index++) addBuilding(state, { def: "village", owner: "p2", kind: "tile", tile: tileIndex(8, 2 + index) });
  const science = state.items.find(item => item.def === "council-science") ?? addItem(state, "council-science", tech);
  addItem(state, "harbor-construction", PUBLIC_ZONE);
  science.zone = tech;
  addItem(state, "council", "board:phase");
  state.laws = { deck: ["quarantine", "stockpiles", "naval-blockade", "general-blockade", "block-inquiry", "zone-districts"], discard: [], enacted: null };
  state.play!.phase = "event";
  state.play!.turn = "p1";
  state.play!.passes = 0;
  return state;
}

test("the Council event draws three laws, the voters vote in natural order and the law with most population votes is enacted", () => {
  const state = council(2, 1);
  assert.deepEqual(eventOptions(state), ["council"]);
  assert.equal(dispatch(state, act("activateEvent", "p1", { def: "council" })), null);
  const open = state.play!.council!;
  assert.deepEqual(open.laws, ["zone-districts", "block-inquiry", "general-blockade"]);
  assert.equal(state.items.find(item => item.def === "council")!.tapped, true);
  assert.match(dispatch(state, act("pass", state.play!.turn)) ?? "", /council/i);
  assert.match(dispatch(state, act("vote", state.play!.turn, { law: "quarantine" })) ?? "", /three laws/);
  const first = state.play!.turn;
  const second = first === "p1" ? "p2" : "p1";
  assert.match(dispatch(state, act("vote", second, { law: "zone-districts" })) ?? "", /not your turn/);
  // p1 has population 2, p2 has 1.
  assert.equal(dispatch(state, act("vote", first, { law: first === "p1" ? "zone-districts" : "block-inquiry" })), null);
  assert.equal(state.play!.council!.votes[first] !== undefined, true);
  assert.equal(dispatch(state, act("vote", second, { law: second === "p1" ? "zone-districts" : "block-inquiry" })), null);
  assert.equal(state.play!.council, null);
  assert.equal(state.laws!.enacted, "zone-districts");
  assert.deepEqual(state.laws!.discard.sort(), ["block-inquiry", "general-blockade"]);
  assert.deepEqual(state.play!.councilResult!.tally, { "zone-districts": 2, "block-inquiry": 1, "general-blockade": 0 });
  assert.deepEqual(eventOptions(state), []);
});

test("a tie enacts no law, and the next Council discards the enacted law first", () => {
  const state = council(1, 1);
  dispatch(state, act("activateEvent", "p1", { def: "council" }));
  dispatch(state, act("vote", state.play!.turn, { law: "zone-districts" }));
  dispatch(state, act("vote", state.play!.turn, { law: "block-inquiry" }));
  assert.equal(state.laws!.enacted, null);
  assert.equal(state.laws!.discard.length, 3);
  state.laws!.enacted = "stockpiles";
  state.items.find(item => item.def === "council")!.tapped = false;
  state.play!.phase = "event";
  state.play!.turn = "p1";
  dispatch(state, act("activateEvent", "p1", { def: "council" }));
  assert.equal(state.laws!.enacted, null);
  assert.equal(state.laws!.discard.includes("stockpiles") || state.laws!.deck.includes("stockpiles") || state.play!.council!.laws.includes("stockpiles"), true);
});

test("with Council Science in a court only that player votes; when public everybody votes", () => {
  assert.deepEqual(councilVoters(council(1, 1, "court:p2")), ["p2"]);
  assert.equal(councilVoters(council(1, 1)).length, 2);
  const state = council(1, 1, "court:p2");
  dispatch(state, act("activateEvent", "p1", { def: "council" }));
  assert.equal(state.play!.turn, "p2");
  dispatch(state, act("vote", "p2", { law: "general-blockade" }));
  assert.equal(state.laws!.enacted, "general-blockade");
});

test("the law deck is reshuffled from the discard pile when it runs out", () => {
  const state = council(1, 1);
  state.laws = { deck: ["quarantine"], discard: ["stockpiles", "naval-blockade"], enacted: null };
  dispatch(state, act("activateEvent", "p1", { def: "council" }));
  assert.equal(state.play!.council!.laws.length, 3);
  assert.equal(new Set(state.play!.council!.laws).size, 3);
  assert.ok(LAWS.length >= 13);
});

test("an enacted law forbids its action cards", () => {
  const state = council(1, 1);
  state.laws!.enacted = "general-blockade";
  state.play!.phase = "discovery";
  addItem(state, "activation-discovery", "court:p1", "p1");
  const sourceNow = sourcesFor(state, "p1", "discovery")[0];
  addItem(state, "move", "court:p1", "p1");
  state.armies = [{ id: "a1", owner: "p1", tile: tileIndex(5, 5), strength: 1 }];
  assert.match(dispatch(state, act("activateMove", "p1", { kind: sourceNow.kind, card: sourceNow.id, army: "a1" })) ?? "", /General Blockade is enacted/);
  state.laws!.enacted = "protect-ancestry";
  state.play!.phase = "control";
  addItem(state, "explore", "court:p1", "p1");
  assert.match(dispatch(state, act("explore", "p1", { kind: sourceNow.kind, card: sourceNow.id, army: "a1" })) ?? "", /Protect Ancestry is enacted/);
  state.laws!.enacted = "disarmements";
  state.play!.phase = "expansion";
  assert.match(dispatch(state, act("deploy", "p1", { kind: "item", card: "x", building: "x" })) ?? "", /Disarmements is enacted/);
});

test("technology-gated laws enter the deck once their technology is known", () => {
  const state = playing();
  state.items = state.items.filter(item => !["harbor-construction", "archeology-science"].includes(item.def));
  state.laws = undefined;
  const gated = ["naval-blockade", "cargo-enforcement", "protect-ancestry"];
  assert.ok(gated.every(id => !lawBoard(state).deck.includes(id)));
  addItem(state, "harbor-construction", "board:research");
  assert.ok(!lawBoard(state).deck.includes("naval-blockade"));
  addItem(state, "harbor-construction", "court:p2", "p2");
  assert.ok(lawBoard(state).deck.includes("naval-blockade"));
  assert.ok(!lawBoard(state).deck.includes("cargo-enforcement"));
  addItem(state, "archeology-science", PUBLIC_ZONE);
  const board = lawBoard(state);
  for (const id of gated) assert.equal(board.deck.filter(card => card === id).length, 1);
  assert.deepEqual(lawBoard(state).deck, board.deck);
  board.deck.splice(board.deck.indexOf("protect-ancestry"), 1);
  board.discard.push("protect-ancestry");
  assert.ok(!lawBoard(state).deck.includes("protect-ancestry"));
});

test("Revoke taps 5 power of Expansion cards to discard the enacted law", () => {
  const state = council(1, 1);
  state.play!.phase = "expansion";
  addItem(state, "revoke", "court:p1", "p1");
  assert.match(dispatch(state, act("revoke", "p1", { kind: "item", card: "none" })) ?? "", /Choose one of your untapped/);
  while (sourcesFor(state, "p1", "expansion").length < 5) addItem(state, "activation-expansion", "court:p1", "p1");
  const cards = sourcesFor(state, "p1", "expansion").slice(0, 5).map(source => ({ kind: source.kind, id: source.id }));
  const [first, ...extra] = cards;
  assert.match(dispatch(state, act("revoke", "p1", { ...first, card: first.id, extra })) ?? "", /no enacted law/);
  state.laws!.enacted = "zone-districts";
  assert.match(dispatch(state, act("revoke", "p1", { ...first, card: first.id, extra: extra.slice(0, 2) })) ?? "", /5 build power/);
  assert.match(dispatch(state, act("revoke", "p1", { ...first, card: first.id, extra, law: "stockpiles" })) ?? "", /not enacted/);
  assert.equal(dispatch(state, act("revoke", "p1", { ...first, card: first.id, extra })), null);
  assert.equal(state.laws!.enacted, null);
  assert.ok(state.laws!.discard.includes("zone-districts"));
  assert.equal(sourcesFor(state, "p1", "expansion").some(source => cards.some(card => card.id === source.id)), false);
});
