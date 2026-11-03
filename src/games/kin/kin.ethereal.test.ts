import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem, hasCard } from "./cards";
import { grantObservatoryTreaties, observatoryChoices, observatoryError, observatoryKins } from "./expansion";
import { placementError } from "./buildings";
import { abilityOptions } from "./neutrals";
import { startCouncil } from "./council";
import { breakOnAttack } from "./treaties";
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

test("the Grand Observatory needs a city, is limited to one, and gives up to 3 Faction Treaties of Kin not in the game", () => {
  const state = playing();
  state.buildings = [];
  state.armies = [];
  state.world!.rivers = {};
  for (const tile of state.tiles) tile.terrain = "plains";
  addItem(state, "grand-observatory", "court:p1", "p1");
  state.players.p1.resources = { gold: 20, lumber: 20, stone: 20, food: 20 };
  const village = addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: HOME });
  assert.match(placementError(state, "p1", "grand-observatory", { tile: HOME, side: 0 }) ?? "", /city/);
  village.def = "city";
  assert.equal(placementError(state, "p1", "grand-observatory", { tile: HOME, side: 0 }), null);

  state.world!.kinPicks = { p1: "hammers", p2: "hanshu" };
  assert.equal(observatoryKins(state, "p1").includes("hammers"), false);
  assert.equal(observatoryKins(state, "p1").includes("hanshu"), false);
  assert.equal(hasCard(state, "p1", "open-source"), false);
  grantObservatoryTreaties(state, "p1", ["ethereal"]);
  const treaties = state.items.filter(item => item.def === "faction-treaty" && item.zone === "court:p1");
  assert.equal(treaties.length, 1);
  assert.equal(treaties.some(item => item.giver === "kin:ethereal"), true);
  assert.equal(hasCard(state, "p1", "open-source"), true);
  assert.equal(observatoryKins(state, "p1").includes("ethereal"), false);
  grantObservatoryTreaties(state, "p1");
  assert.equal(state.items.filter(item => item.def === "faction-treaty" && item.zone === "court:p1").length, 4);

  addBuilding(state, { def: "grand-observatory", owner: "p1", kind: "slice", tile: HOME, side: 0 } as never);
  assert.match(placementError(state, "p1", "grand-observatory", { tile: HOME, side: 1 }) ?? "", /only one/);
});

test("the Grand Observatory rejects invalid Kin selections and lists the available Kin with names", () => {
  const state = playing();
  state.world!.kinPicks = { p1: "hammers", p2: "hanshu" };
  const choices = observatoryChoices(state, "p1");
  assert.equal(choices.some(kin => kin.id === "ethereal" && kin.name === "The Ethereal"), true);
  assert.equal(choices.some(kin => kin.id === "hanshu"), false);
  assert.equal(observatoryError(state, "p1", undefined), null);
  assert.equal(observatoryError(state, "p1", []), null);
  assert.equal(observatoryError(state, "p1", ["ethereal", "ark"]), null);
  assert.match(observatoryError(state, "p1", ["hanshu"]) ?? "", /not in the game/);
  assert.match(observatoryError(state, "p1", ["ethereal", "ethereal"]) ?? "", /only once/);
  assert.match(observatoryError(state, "p1", ["ethereal", "ark", "lumon", "tree"]) ?? "", /at most 3/);
  assert.match(observatoryError(state, "p1", "ethereal") ?? "", /list/);
  grantObservatoryTreaties(state, "p1", ["ark"]);
  assert.equal(observatoryError(state, "p1", ["ark"]) === null, false);
});

test("Open Source gives a gear when you Publicize", () => {
  const state = playing();
  state.play!.phase = "discovery";
  addItem(state, "open-source", "court:p1", "p1");
  const tech = addItem(state, "market-construction", "court:p1", "p1");
  const source = addItem(state, "activation-universal", "court:p1", "p1");
  state.players.p1.resources.gear = 0;
  assert.equal(dispatch(state, act("publicize", "p1", { kind: "item", card: source.id, tech: tech.id })), null);
  assert.equal(state.players.p1.resources.gear, 1);
});

test("Student of the Ways: Faction Treaties are not broken by attacking", () => {
  const state = playing();
  state.world!.kinPicks = { p1: "ethereal", p2: "hammers" };
  const treaty = addItem(state, "faction-treaty", "court:p1", "p1", "p2");
  addItem(state, "student-of-the-ways", "court:p1", "p1");
  breakOnAttack(state, "p1", "p2");
  assert.equal(state.items.includes(treaty), true);
});

test("Quantum Collapse: choose the law cards that are drawn at the Council", () => {
  const state = playing();
  addItem(state, "quantum-collapse", "court:p1", "p1");
  state.laws = { deck: ["general-blockade", "block-inquiry", "enforce-copyright", "blockade-trade", "enforce-treaties"], discard: [], enacted: null };
  state.play!.phase = "event";
  startCouncil(state, "p2");
  const quantum = state.play!.quantum!;
  assert.equal(quantum.player, "p1");
  assert.equal(quantum.pick, 3);
  assert.equal(state.play!.turn, "p1");
  assert.match(dispatch(state, act("quantum", "p2", { cards: ["general-blockade", "block-inquiry", "enforce-copyright"] })) ?? "", /Only the Ethereal/);
  assert.notEqual(dispatch(state, act("quantum", "p1", { cards: ["general-blockade", "block-inquiry"] })), null);
  assert.equal(dispatch(state, act("quantum", "p1", { cards: ["general-blockade", "blockade-trade", "enforce-treaties"] })), null);
  assert.deepEqual(state.play!.council!.laws, ["general-blockade", "blockade-trade", "enforce-treaties"]);
  assert.deepEqual(state.laws!.deck.sort(), ["block-inquiry", "enforce-copyright"]);
  assert.equal(state.play!.quantum, null);
});

test("Quantum Collapse: choose the outcome when you Explore ruins", () => {
  const state = playing();
  state.armies = [{ id: "a", owner: "p1", tile: HOME, strength: 1 }] as KinState["armies"];
  state.blocks = [{ tile: HOME, kind: "ruins" }];
  state.play!.phase = "control";
  addItem(state, "explore", "board:phase");
  addItem(state, "quantum-collapse", "court:p1", "p1");
  const card = addItem(state, "activation-universal", "court:p1", "p1");
  assert.match(dispatch(state, act("explore", "p1", { kind: "item", card: card.id, army: "a" })) ?? "", /choose warp, treasure or relic/);
  assert.equal(dispatch(state, act("explore", "p1", { kind: "item", card: card.id, army: "a", choice: "relic" })), null);
  assert.equal(state.blocks.some(block => block.kind === "relic"), true);
});

test("Quantum Collapse: the winner of a secret bid chooses the subterfuge card", () => {
  const state = playing();
  state.armies = [];
  addItem(state, "quantum-collapse", "court:p1", "p1");
  const science = state.items.find(item => item.def === "subterfuge-science") ?? addItem(state, "subterfuge-science", "court:p1");
  science.zone = "court:p1";
  state.players.p1.resources.gold = 5;
  state.tactics = { deck: ["secret"], discard: [], hands: {}, shuffled: { tactics: true, secret: true }, archeologists: [] };
  state.subterfuge = { deck: ["bank-heist", "retaliation"], discard: [], hands: {} };
  state.play!.phase = "event";
  assert.equal(dispatch(state, act("activateEvent", "p1", { def: "tactician" })), null);
  assert.equal(dispatch(state, act("bid", "p1", { amount: 1 })), null);
  assert.equal(state.play!.quantum!.kind, "subterfuge");
  assert.deepEqual(state.play!.quantum!.options.sort(), ["bank-heist", "retaliation"]);
  assert.equal(dispatch(state, act("quantum", "p1", { cards: ["bank-heist"] })), null);
  assert.deepEqual(state.subterfuge!.hands.p1, ["bank-heist"]);
  assert.equal(state.play!.quantum, null);
});

test("Foresight swaps a character in your court with one from the deck", () => {
  const state = playing();
  state.cards.ethereal = { id: "ethereal", def: "ethereal", zone: "court:p1", owner: "p1", tapped: false };
  state.play!.phase = "discovery";
  state.cards.torke.owner = "p1";
  state.cards.torke.zone = "court:p1";
  state.cards.ostraria.owner = null;
  state.cards.ostraria.zone = "deck:character";
  const option = abilityOptions(state, "p1").find(entry => entry.character === "ethereal")!;
  assert.equal(option.reason, null);
  assert.equal(option.give!.includes("ethereal"), false);
  assert.equal(option.give!.includes("torke"), true);
  assert.notEqual(dispatch(state, act("ability", "p1", { character: "ethereal", take: "ostraria", give: "ethereal" })), null);
  assert.equal(dispatch(state, act("ability", "p1", { character: "ethereal", take: "ostraria", give: "torke" })), null);
  assert.equal(state.cards.ostraria.owner, "p1");
  assert.equal(state.cards.torke.owner, null);
  assert.equal(state.cards.torke.zone, "deck:character");
  assert.equal(state.cards.ethereal.tapped, true);
});
