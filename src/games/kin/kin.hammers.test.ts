import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { buildPower, placementError, smithDiscount } from "./buildings";
import { hammersSeasons } from "./hammers";
import { characterPower } from "./neutrals";
import { bidders } from "./tactics";
import { createRng, nextInt } from "./rng";
import { addBuilding, setupChoices } from "./setup";
import { PUBLIC_ZONE } from "./tech";
import { neighbors, sideEdge, sideNeighbor, tileIndex } from "./world";
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

const own = (state: KinState, id: string, player = "p1") => {
  state.cards[id] ??= { id, def: id, owner: player, zone: `court:${player}`, tapped: false } as never;
  state.cards[id].owner = player;
  state.cards[id].zone = `court:${player}`;
  state.cards[id].tapped = false;
};

const HOME = tileIndex(6, 10);
const side = (tile: number, next: number) => [0, 1, 2, 3, 4, 5].find(s => sideNeighbor(tile, s) === next)!;

// An empty plains world with a village of p1 at HOME.
function blank(): KinState {
  const state = playing();
  state.buildings = [];
  state.armies = [];
  state.items = state.items.filter(item => !item.zone.startsWith("court:") || item.def === "tactician-science");
  addItem(state, "subterfuge-science", "board:research");
  state.world!.rivers = {};
  for (const tile of state.tiles) tile.terrain = "plains";
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: HOME } as never);
  state.players.p1.resources = { gold: 20, lumber: 20, stone: 20, food: 20 };
  return state;
}

const breweryAt = (state: KinState, tile: number, next: number, owner = "p1") =>
  addBuilding(state, { def: "brewery", owner, kind: "slice", tile, side: side(tile, next) } as never);

test("a Brewery needs a river next to its side, and there is one per tile building; building it draws a tactics card", () => {
  const state = blank();
  addItem(state, "brewery", "court:p1", "p1");
  own(state, "khaz");
  const [a, b] = neighbors(HOME);
  assert.match(placementError(state, "p1", "brewery", { tile: HOME, side: side(HOME, a) }) ?? "", /river/);
  state.world!.rivers[sideEdge(HOME, side(HOME, a))] = 0;
  assert.equal(placementError(state, "p1", "brewery", { tile: HOME, side: side(HOME, a) }), null);
  state.tactics = { deck: ["blackmail"], discard: [], hands: {}, shuffled: { tactics: true, secret: true }, archeologists: [] };
  state.play!.phase = "expansion";
  const result = dispatch(state, act("build", "p1", { kind: "character", card: "khaz", def: "brewery", place: { tile: HOME, side: side(HOME, a) }, extra: [], basic: {} }));
  assert.equal(result, null);
  assert.equal(state.buildings.some(building => building.def === "brewery"), true);
  assert.deepEqual(state.tactics.hands.p1, ["blackmail"]);
  assert.equal(state.players.p1.resources.lumber, 19);
  assert.equal(state.players.p1.resources.stone, 18);
  state.world!.rivers[sideEdge(HOME, side(HOME, b))] = 0;
  assert.match(placementError(state, "p1", "brewery", { tile: HOME, side: side(HOME, b) }) ?? "", /only one Brewery/);
});

test("Mountain Folk lets a Village and a Barracks stand on a mountain", () => {
  const state = blank();
  addItem(state, "barracks", "court:p1", "p1");
  state.armies.push({ id: "a1", owner: "p1", tile: tileIndex(6, 14), strength: 1 } as never);
  const spot = tileIndex(6, 14);
  state.tiles[spot].terrain = "mountain";
  assert.match(placementError(state, "p1", "village", { tile: spot }) ?? "", /plains or snow/);
  addItem(state, "village", "court:p1", "p1");
  addItem(state, "mountain-folk", "court:p1", "p1");
  assert.equal(placementError(state, "p1", "village", { tile: spot }), null);
  const home = neighbors(HOME)[0];
  state.tiles[HOME].terrain = "mountain";
  assert.equal(placementError(state, "p1", "barracks", { tile: HOME, side: side(HOME, home) }), null);
});

test("Master Smiths makes each of your Smiths lower the build power by 2", () => {
  const state = blank();
  const [a, b] = neighbors(HOME);
  addBuilding(state, { def: "smith", owner: "p1", kind: "slice", tile: HOME, side: side(HOME, a) } as never);
  addItem(state, "market", "court:p1", "p1");
  assert.equal(smithDiscount(state, [HOME]), 1);
  addItem(state, "master-smiths", "court:p1", "p1");
  assert.equal(smithDiscount(state, [HOME]), 2);
  addBuilding(state, { def: "smith", owner: "p1", kind: "slice", tile: HOME, side: side(HOME, b) } as never);
  assert.equal(smithDiscount(state, [HOME]), 4);
  assert.equal(buildPower(state, "market", { tile: HOME, side: 0 }), 0);
});

test("Craftdwarves claims the top tactics card for 5 gold", () => {
  const state = blank();
  addItem(state, "craftdwarves", "court:p1", "p1");
  own(state, "khaz");
  state.tactics = { deck: ["blackmail", "alchemical-plague"], discard: [], hands: {}, shuffled: { tactics: true, secret: true }, archeologists: [] };
  state.play!.phase = "expansion";
  state.players.p1.resources.gold = 4;
  assert.match(dispatch(state, act("craftdwarves", "p1", { kind: "character", card: "khaz" })) ?? "", /5 gold/);
  state.players.p1.resources.gold = 6;
  assert.equal(dispatch(state, act("craftdwarves", "p1", { kind: "character", card: "khaz" })), null);
  assert.deepEqual(state.tactics.hands.p1, ["alchemical-plague"]);
  assert.equal(state.players.p1.resources.gold, 1);
  assert.equal(state.cards.khaz.tapped, true);
  state.tactics.deck = [];
  state.play!.turn = "p1";
  state.play!.phase = "expansion";
  state.cards.khaz.tapped = false;
  state.players.p1.resources.gold = 6;
  assert.match(dispatch(state, act("craftdwarves", "p1", { kind: "character", card: "khaz" })) ?? "", /empty/);
});

test("Finders Keepers bids first for a regular tactics card, but not for a secret one", () => {
  const state = blank();
  state.items.find(item => item.def === "tactician-science")!.zone = PUBLIC_ZONE;
  state.items.find(item => item.def === "subterfuge-science")!.zone = PUBLIC_ZONE;
  const natural = bidders(state, "blackmail");
  assert.equal(natural.length, 2);
  const last = natural[natural.length - 1];
  addItem(state, "finders-keepers", `court:${last}`, last);
  assert.equal(bidders(state, "blackmail")[0], last);
  assert.deepEqual(bidders(state, "secret"), natural);
});

test("Jaggengrog gains 1 gold per brewery, Uhzrun turns stone into gold up to the breweries", () => {
  const state = blank();
  const [a, b] = neighbors(HOME);
  own(state, "jaggengrog");
  own(state, "uhzrun");
  state.play!.phase = "control";
  assert.match(dispatch(state, act("ability", "p1", { character: "jaggengrog" })) ?? "", /brewery/);
  breweryAt(state, HOME, a);
  breweryAt(state, HOME, b);
  state.players.p1.resources.gold = 0;
  assert.equal(dispatch(state, act("ability", "p1", { character: "jaggengrog" })), null);
  assert.equal(state.players.p1.resources.gold, 2);
  assert.equal(state.cards.jaggengrog.tapped, true);

  state.play!.turn = "p1";
  state.play!.phase = "expansion";
  state.players.p1.resources.stone = 5;
  assert.match(dispatch(state, act("ability", "p1", { character: "uhzrun", amount: 3 })) ?? "", /1 to 2/);
  assert.equal(dispatch(state, act("ability", "p1", { character: "uhzrun", amount: 2 })), null);
  assert.equal(state.players.p1.resources.stone, 3);
  assert.equal(state.players.p1.resources.gold, 4);
});

test("Daxgrim pays 2 gold to move 1 strength from an adjacent army to yours", () => {
  const state = blank();
  const [a, b] = neighbors(HOME);
  own(state, "daxgrim");
  state.play!.phase = "control";
  state.armies.push({ id: "mine", owner: "p1", tile: HOME, strength: 1 } as never, { id: "theirs", owner: "p2", tile: a, strength: 2 } as never);
  state.players.p1.resources.gold = 2;
  assert.match(dispatch(state, act("ability", "p1", { character: "daxgrim", from: "theirs", to: "mine" })) ?? "", /2 breweries/);
  breweryAt(state, HOME, b);
  breweryAt(state, HOME, neighbors(HOME)[2]);
  assert.match(dispatch(state, act("ability", "p1", { character: "daxgrim", from: "mine", to: "mine" })) ?? "", /Choose an army/);
  assert.equal(dispatch(state, act("ability", "p1", { character: "daxgrim", from: "theirs", to: "mine" })), null);
  assert.equal(state.armies.find(army => army.id === "mine")!.strength, 2);
  assert.equal(state.armies.find(army => army.id === "theirs")!.strength, 1);
  assert.equal(state.players.p1.resources.gold, 0);
  assert.equal(state.cards.daxgrim.tapped, true);
});

test("Khaz and Gottrek get their power at Seasons Change from the number of breweries", () => {
  const state = blank();
  const around = neighbors(HOME);
  own(state, "khaz");
  own(state, "gottrek");
  hammersSeasons(state);
  assert.equal(characterPower(state, "p1", "khaz", 2), 2);
  assert.equal(characterPower(state, "p1", "gottrek", 0), 0);
  for (const next of around.slice(0, 3)) breweryAt(state, HOME, next);
  // Nothing changes until Seasons Change resolves.
  assert.equal(characterPower(state, "p1", "gottrek", 0), 0);
  hammersSeasons(state);
  assert.equal(characterPower(state, "p1", "khaz", 2), 4);
  assert.equal(characterPower(state, "p1", "gottrek", 0), 3);
});

function auctionState(deck: string[]): KinState {
  const state = blank();
  state.items.find(item => item.def === "tactician-science")!.zone = PUBLIC_ZONE;
  state.items.find(item => item.def === "subterfuge-science")!.zone = PUBLIC_ZONE;
  addItem(state, "tactician", "board:phase");
  state.players.p1.resources.gold = 5;
  state.players.p2.resources.gold = 5;
  state.tactics = { deck, discard: [], hands: {}, shuffled: { tactics: true, secret: true }, archeologists: [] };
  state.play!.phase = "event";
  state.play!.turn = "p1";
  return state;
}

test("Rohdrimbral's Counterfuge may discard a secret tactics card drawn for the auction", () => {
  const state = auctionState(["blackmail", "secret"]);
  own(state, "rohdrimbral", "p2");
  assert.equal(dispatch(state, act("activateEvent", "p1", { def: "tactician" })), null);
  assert.equal(state.play!.auction ?? null, null);
  assert.equal(state.play!.consent!.owner, "p2");
  assert.match(dispatch(state, act("consentRespond", "p1", { accept: true })) ?? "", /not for you/);
  assert.equal(dispatch(state, act("consentRespond", "p2", { accept: true })), null);
  assert.equal(state.play!.auction!.card, "blackmail");
  assert.deepEqual(state.tactics!.discard, ["secret"]);
  assert.equal(state.cards.rohdrimbral.tapped, true);
});

test("Counterfuge can be declined, and does not trigger for a regular card or a tapped Rohdrimbral", () => {
  const declined = auctionState(["blackmail", "secret"]);
  own(declined, "rohdrimbral", "p2");
  dispatch(declined, act("activateEvent", "p1", { def: "tactician" }));
  assert.equal(dispatch(declined, act("consentRespond", "p2", { accept: false })), null);
  assert.equal(declined.play!.auction!.card, "secret");
  assert.equal(declined.cards.rohdrimbral.tapped, false);

  const regular = auctionState(["secret", "blackmail"]);
  own(regular, "rohdrimbral", "p2");
  dispatch(regular, act("activateEvent", "p1", { def: "tactician" }));
  assert.equal(regular.play!.consent ?? null, null);
  assert.equal(regular.play!.auction!.card, "blackmail");

  const tapped = auctionState(["blackmail", "secret"]);
  own(tapped, "rohdrimbral", "p2");
  tapped.cards.rohdrimbral.tapped = true;
  dispatch(tapped, act("activateEvent", "p1", { def: "tactician" }));
  assert.equal(tapped.play!.consent ?? null, null);
  assert.equal(tapped.play!.auction!.card, "secret");
});
