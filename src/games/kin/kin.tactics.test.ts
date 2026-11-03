import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { eventOptions } from "./events";
import { kin } from "./index";
import { sourcesFor } from "./play";
import { createRng, nextInt } from "./rng";
import { setupChoices } from "./setup";
import { PUBLIC_ZONE } from "./tech";
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

// Two players with gold, the Tactician event on the phase board and a known deck.
function auction(deck: string[], tactician: string, subterfuge: string = "board:research"): KinState {
  const state = playing();
  state.armies = [];
  for (const character of Object.values(state.cards)) character.tapped = true;
  state.players.p1.resources.gold = 5;
  state.players.p2.resources.gold = 5;
  const science = state.items.find(item => item.def === "tactician-science") ?? addItem(state, "tactician-science", tactician);
  science.zone = tactician;
  const secret = state.items.find(item => item.def === "subterfuge-science") ?? addItem(state, "subterfuge-science", subterfuge);
  secret.zone = subterfuge;
  if (!state.items.some(item => item.def === "tactician" && item.zone === "board:phase")) addItem(state, "tactician", "board:phase");
  state.tactics = { deck, discard: [], hands: {}, shuffled: { tactics: true, secret: true }, archeologists: [] };
  state.play!.phase = "event";
  state.play!.turn = "p1";
  state.play!.passes = 0;
  return state;
}

test("the Tactician auction is only for those who know the Science; the highest bidder pays and claims the card", () => {
  const state = auction(["blackmail"], "court:p2");
  assert.deepEqual(eventOptions(state), ["tactician"]);
  assert.equal(dispatch(state, act("activateEvent", "p1", { def: "tactician" })), null);
  assert.equal(state.play!.auction!.card, "blackmail");
  assert.deepEqual(state.play!.auction!.order, ["p2"]);
  assert.equal(state.play!.turn, "p2");
  assert.match(dispatch(state, act("bid", "p2", { amount: 0 })) ?? "", /starts at 1/);
  assert.match(dispatch(state, act("bid", "p2", { amount: 9 })) ?? "", /much gold/);
  assert.equal(dispatch(state, act("bid", "p2", { amount: 2 })), null);
  assert.equal(state.play!.auction, null);
  assert.deepEqual(state.tactics!.hands.p2, ["blackmail"]);
  assert.equal(state.players.p2.resources.gold, 3);
  assert.equal(state.items.find(item => item.def === "tactician")!.tapped, true);
});

test("with a public Science everyone bids in natural order, bids must rise and dropping out leaves the card to the highest bid", () => {
  const state = auction(["blackmail"], PUBLIC_ZONE);
  dispatch(state, act("activateEvent", "p1", { def: "tactician" }));
  const [first, second] = state.play!.auction!.order;
  assert.equal(state.play!.turn, first);
  assert.equal(dispatch(state, act("bid", first, { amount: 2 })), null);
  assert.equal(state.play!.turn, second);
  assert.match(dispatch(state, act("bid", second, { amount: 2 })) ?? "", /more than 2/);
  assert.equal(dispatch(state, act("bid", second, { amount: 3 })), null);
  assert.equal(state.play!.turn, first);
  assert.match(dispatch(state, act("pass", first)) ?? "", /auction/);
  assert.equal(dispatch(state, act("fold", first)), null);
  assert.equal(state.play!.auction, null);
  assert.deepEqual(state.tactics!.hands[second], ["blackmail"]);
  assert.equal(state.players[second].resources.gold, 2);
  assert.equal(state.players[first].resources.gold, 5);
});

test("a card nobody bids on goes to the discard pile, and an empty deck is refilled from it", () => {
  const state = auction(["blackmail"], PUBLIC_ZONE);
  dispatch(state, act("activateEvent", "p1", { def: "tactician" }));
  dispatch(state, act("fold", state.play!.turn));
  dispatch(state, act("fold", state.play!.turn));
  assert.deepEqual(state.tactics!.discard, ["blackmail"]);
  state.items.find(item => item.def === "tactician")!.tapped = false;
  state.play!.phase = "event";
  state.play!.turn = "p1";
  dispatch(state, act("activateEvent", "p1", { def: "tactician" }));
  assert.equal(state.play!.auction!.card, "blackmail");
});

test("researching a Science shuffles its cards into the tactics deck; there is no auction without gold", () => {
  const state = auction([], "court:p1", "court:p1");
  state.tactics!.shuffled = { tactics: false, secret: false };
  assert.deepEqual(eventOptions(state), ["tactician"]);
  assert.equal(state.tactics!.deck.length, 12);
  assert.equal(state.tactics!.deck.filter(card => card === "secret").length, 6);
  state.players.p1.resources.gold = 0;
  assert.deepEqual(eventOptions(state), []);
});

test("winning a secret tactics card draws a subterfuge card that only its holder can see", () => {
  const state = auction(["secret"], "board:research", "court:p1");
  state.subterfuge = { deck: ["bank-heist", "retaliation"], discard: [], hands: {} };
  dispatch(state, act("activateEvent", "p1", { def: "tactician" }));
  assert.deepEqual(state.play!.auction!.order, ["p1"]);
  dispatch(state, act("bid", "p1", { amount: 1 }));
  assert.deepEqual(state.subterfuge!.hands.p1, ["retaliation"]);
  assert.deepEqual(state.tactics!.discard, ["secret"]);
  const world = (viewer: string) => (kin.snapshot(state, viewer, new Set()) as { world: { subterfuge: { mine: string[]; counts: Record<string, number> } } }).world.subterfuge;
  assert.deepEqual(world("p1").mine, ["retaliation"]);
  assert.deepEqual(world("p2").mine, []);
  assert.equal(world("p2").counts.p1, 1);
  assert.equal(JSON.stringify(world("p2")).includes("retaliation"), false);
});

function tactics(hand: string[]): KinState {
  const state = auction([], PUBLIC_ZONE);
  state.tactics!.hands.p1 = hand;
  state.play!.phase = "discovery";
  state.play!.turn = "p1";
  return state;
}

test("Blackmail, Alchemical Plague and Diplomatic Maneuvering are played from the court and do not use the turn", () => {
  const state = tactics(["blackmail", "alchemical-plague", "diplomatic-maneuvering"]);
  state.armies = [{ id: "a1", owner: "p2", tile: 40, strength: 3 }, { id: "a2", owner: "p2", tile: 41, strength: 4 }] as KinState["armies"];
  state.cards[Object.keys(state.cards)[0]].tapped = false;
  const victim = Object.values(state.cards).find(card => card.owner && !card.tapped)!;
  const treaty = addItem(state, "trade-treaty", "court:p2", "p2", "p1");
  assert.match(dispatch(state, act("playTactic", "p1", { card: "blackmail", target: "a2" })) ?? "", /valid target/);
  assert.equal(dispatch(state, act("playTactic", "p1", { card: "blackmail", target: "a1" })), null);
  assert.deepEqual(state.armies.map(army => army.id), ["a2"]);
  assert.equal(dispatch(state, act("playTactic", "p1", { card: "alchemical-plague", target: victim.id })), null);
  assert.equal(victim.tapped, true);
  assert.equal(dispatch(state, act("playTactic", "p1", { card: "diplomatic-maneuvering", target: treaty.id })), null);
  assert.equal(state.items.includes(treaty), false);
  assert.equal(state.play!.turn, "p1");
  assert.deepEqual(state.tactics!.hands.p1, []);
  assert.deepEqual(state.tactics!.discard.sort(), ["alchemical-plague", "blackmail", "diplomatic-maneuvering"]);
  assert.match(dispatch(state, act("playTactic", "p1", { card: "blackmail", target: "a2" })) ?? "", /do not hold/);
});

test("Shoulders of Giants publicizes a technology for free, but not Steampower", () => {
  const state = tactics(["shoulders-of-giants"]);
  const tech = state.items.find(item => item.def === "tactician-science")!;
  tech.zone = "court:p2";
  tech.owner = "p2";
  addItem(state, "steampower", "court:p2", "p2");
  const gears = state.players.p1.resources.gear;
  assert.match(dispatch(state, act("playTactic", "p1", { card: "shoulders-of-giants", target: state.items.find(item => item.def === "steampower")!.id })) ?? "", /valid target/);
  assert.equal(dispatch(state, act("playTactic", "p1", { card: "shoulders-of-giants", target: tech.id })), null);
  assert.equal(tech.zone, PUBLIC_ZONE);
  assert.equal(state.players.p1.resources.gear, gears);
});

test("the Graphiscope is a universal activation card of power 2 that is discarded when used", () => {
  const state = tactics(["graphiscope"]);
  state.play!.phase = "expansion";
  const source = sourcesFor(state, "p1", "expansion").find(entry => entry.kind === "tactic");
  assert.equal(source?.power, 2);
  assert.equal(sourcesFor(state, "p1", "control").some(entry => entry.kind === "tactic"), true);
});

test("the Great Archeologist lets the player choose the outcome of Explore for the round", () => {
  const state = tactics(["great-archeologist"]);
  state.play!.phase = "control";
  state.blocks = [{ tile: 40, kind: "ruins" }];
  state.armies = [{ id: "a1", owner: "p1", tile: 40, strength: 1 }] as KinState["armies"];
  addItem(state, "explore", "board:phase");
  addItem(state, "activation-universal", "court:p1", "p1");
  const card = state.items.find(item => item.def === "activation-universal" && item.owner === "p1")!;
  assert.equal(dispatch(state, act("playTactic", "p1", { card: "great-archeologist" })), null);
  assert.match(dispatch(state, act("explore", "p1", { kind: "item", card: card.id, army: "a1" })) ?? "", /choose warp, treasure or relic/);
  assert.equal(dispatch(state, act("explore", "p1", { kind: "item", card: card.id, army: "a1", choice: "relic" })), null);
  assert.deepEqual(state.blocks, [{ tile: 40, kind: "relic" }]);
  assert.equal(state.play!.found!.roll, 0);
});

test("Retaliation turns a tactics card back on the player who played it", () => {
  const state = tactics(["blackmail"]);
  state.armies = [{ id: "a1", owner: "p2", tile: 40, strength: 2 }, { id: "a2", owner: "p1", tile: 41, strength: 1 }] as KinState["armies"];
  state.subterfuge = { deck: [], discard: [], hands: { p2: ["retaliation"] } };
  assert.equal(dispatch(state, act("playTactic", "p1", { card: "blackmail", target: "a1" })), null);
  assert.deepEqual(state.armies.map(army => army.id), ["a1"]);
  assert.deepEqual(state.subterfuge.discard, ["retaliation"]);
});

// A barter where `give` goes from p1 to p2 and `take` the other way, accepted by p2.
function bartered(hand: string[], give: Record<string, unknown>, take: Record<string, unknown>, mint?: unknown[]): KinState {
  const state = tactics([]);
  state.subterfuge = { deck: [], discard: [], hands: { p1: hand } };
  state.players.p1.resources.gold = 4;
  state.players.p2.resources.gold = 6;
  state.players.p2.resources.lumber = 2;
  state.players.p1.resources.lumber = 2;
  const card = addItem(state, "activation-discovery", "court:p1", "p1");
  addItem(state, "barter", "board:phase");
  assert.equal(dispatch(state, act("barter", "p1", { kind: "item", card: card.id, to: "p2", give, take, ...(mint ? { mint } : {}) })), null);
  assert.equal(dispatch(state, act("barterRespond", "p2", { accept: true })), null);
  return state;
}

test("Bank Heist takes all the gold of the player who received gold in the barter", () => {
  const state = bartered(["bank-heist"], { resources: { gold: 1 } }, { resources: { lumber: 1 } });
  assert.equal(state.players.p2.resources.gold, 0);
  assert.equal(state.players.p1.resources.gold, 10);
  assert.deepEqual(state.subterfuge!.discard, ["bank-heist"]);
});

test("Trojan Trade taps their characters when you give and receive nothing", () => {
  const state = bartered(["trojan-trade"], { resources: { lumber: 1 } }, {});
  assert.equal(Object.values(state.cards).filter(card => card.owner === "p2").every(card => card.tapped), true);
  assert.deepEqual(state.subterfuge!.discard, ["trojan-trade"]);
});

test("a barter that does not meet the condition leaves the subterfuge card in the hand", () => {
  const state = bartered(["trojan-trade"], { resources: { lumber: 1 } }, { resources: { lumber: 1 } });
  assert.deepEqual(state.subterfuge!.hands.p1, ["trojan-trade"]);
});

test("Veil of the Deep stops subterfuge cards from being played against its holder", () => {
  const state = playing();
  state.players.p2.resources.gold = 6;
  addItem(state, "veil-of-the-deep", "court:p2", "p2");
  state.play!.phase = "discovery";
  state.play!.turn = "p1";
  state.subterfuge = { deck: [], discard: [], hands: { p1: ["bank-heist"] } };
  state.players.p1.resources.gold = 4;
  const card = addItem(state, "activation-discovery", "court:p1", "p1");
  addItem(state, "barter", "board:phase");
  dispatch(state, act("barter", "p1", { kind: "item", card: card.id, to: "p2", give: { resources: { gold: 1 } }, take: {} }));
  dispatch(state, act("barterRespond", "p2", { accept: true }));
  assert.deepEqual(state.subterfuge.hands.p1, ["bank-heist"]);
  assert.equal(state.players.p2.resources.gold, 7);
});

test("Counterattack removes 3 strength from the attacking army, and skips the battle when it is disbanded", () => {
  const state = playing();
  state.buildings = [];
  for (const tile of state.tiles) tile.terrain = "plains";
  for (const character of Object.values(state.cards)) character.tapped = true;
  state.armies = [{ id: "a1", owner: "p1", tile: 40, strength: 3 }, { id: "a2", owner: "p2", tile: 41, strength: 2 }] as KinState["armies"];
  state.subterfuge = { deck: [], discard: [], hands: { p2: ["counterattack"] } };
  state.play!.phase = "control";
  state.play!.turn = "p1";
  state.play!.battle = { attacker: "p1", defender: "p2", army: "a1", tile: 41, source: { kind: "item", id: "x" }, generalPower: 1, dice: { strategic: 4 } };
  assert.equal(dispatch(state, act("battleRespond", "p2", { dice: { strategic: 2 } })), null);
  assert.equal(state.armies.some(army => army.id === "a1"), false);
  assert.equal(state.armies.find(army => army.id === "a2")!.strength, 2);
  assert.equal(state.play!.report!.disbanded[0], "a1");
  assert.deepEqual(state.subterfuge.discard, ["counterattack"]);
});
