import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem, hasCard } from "./cards";
import { legalSteps, sourcesFor } from "./play";
import { createRng, nextInt } from "./rng";
import { setupChoices } from "./setup";
import { barterInfo, breakOnAttack, connected, lapsedTreaties, seasonsChangeTreaties } from "./treaties";
import { edgeId, neighbors, sideCorners, sideEdge, tileIndex, vertexNeighbors } from "./world";
import type { Action, KinState } from "./types";

const act = (type: string, id: string, extra: Record<string, unknown> = {}): Action => ({ type, actor: { id, username: id, isHost: id === "p1" }, ...extra });

function waterRouteState() {
  const state = createState(1);
  for (const id of ["p1", "p2"]) dispatch(state, act("join", id));
  dispatch(state, act("start", "p1"));
  for (const tile of state.tiles) tile.terrain = "plains";
  const home = tileIndex(6, 1), target = tileIndex(6, 9);
  state.buildings = [
    { id: "home", def: "village", kind: "tile", owner: "p1", tile: home },
    { id: "harbor", def: "harbor", kind: "slice", owner: "p1", tile: home, side: 1 },
    { id: "target", def: "village", kind: "tile", owner: "p2", tile: target }
  ];
  return { state, home, target };
}

function riverRoute(state: KinState, from: string, to: string) {
  const queue = [from], previous = new Map<string, string | null>([[from, null]]);
  for (let index = 0; index < queue.length && !previous.has(to); index++) {
    for (const next of vertexNeighbors(queue[index])) if (!previous.has(next)) {
      previous.set(next, queue[index]);
      queue.push(next);
    }
  }
  assert.ok(previous.has(to));
  for (let node = to; previous.get(node) !== null;) {
    const parent = previous.get(node)!;
    state.world!.rivers[edgeId(node, parent)] = true;
    node = parent;
  }
}

test("one Harbor connects through oceans to another player's tile building without a destination Harbor", () => {
  const { state } = waterRouteState();
  for (let col = 2; col <= 8; col++) state.tiles[tileIndex(6, col)].terrain = "ocean";
  assert.equal(connected(state, "p1", "p2"), true);
  assert.equal(connected(state, "p2", "p1"), true);
  addItem(state, "trade-diplomacy", "court:p1", "p1");
  assert.ok(barterInfo(state, "p1").targets[0].giveMintable.includes("trade"));
  state.tiles[tileIndex(6, 5)].terrain = "plains";
  assert.equal(connected(state, "p1", "p2"), false);
  state.tiles[tileIndex(6, 5)].terrain = "ocean";
  state.buildings[2].kind = "center";
  assert.equal(connected(state, "p1", "p2"), false, "water destinations must be tile buildings");
  state.buildings[2].kind = "tile";
  state.buildings = state.buildings.filter(building => building.def !== "harbor");
  assert.equal(connected(state, "p1", "p2"), false, "a water route needs a Harbor at one end");
});

test("one Harbor connects through a river, including a river on an adjacent edge", () => {
  const { state, home, target } = waterRouteState();
  riverRoute(state, sideCorners(home, 1)[0], sideCorners(target, 4)[0]);
  assert.equal(connected(state, "p1", "p2"), true);
  assert.equal(connected(state, "p2", "p1"), true);
  state.world!.rivers = {};
  assert.equal(connected(state, "p1", "p2"), false);
});

test("Harbor routes can travel from river to ocean and back into another river", () => {
  const { state, home, target } = waterRouteState();
  const water = tileIndex(6, 5);
  state.tiles[water].terrain = "ocean";
  riverRoute(state, sideCorners(home, 1)[0], sideCorners(water, 4)[0]);
  riverRoute(state, sideCorners(water, 1)[0], sideCorners(target, 4)[0]);
  assert.equal(connected(state, "p1", "p2"), true);
  state.tiles[water].terrain = "plains";
  assert.equal(connected(state, "p1", "p2"), false, "land cannot bridge separate rivers");
});

test("barter lists eligible treaties separately for each giver", () => {
  const state = createState(1);
  for (const id of ["p1", "p2"]) assert.equal(dispatch(state, act("join", id)), null);
  state.order = ["p1", "p2"];
  addItem(state, "peace-diplomacy", "court:p1", "p1");
  addItem(state, "access-diplomacy", "court:p2", "p2");
  let target = barterInfo(state, "p1").targets[0];
  assert.deepEqual(target.giveMintable, ["peace"]);
  assert.deepEqual(target.mintable, ["access"]);
  addItem(state, "access-ban", "court:p1", "p1");
  addItem(state, "peace-treaty", "court:p2", "p2", "p1");
  target = barterInfo(state, "p1").targets[0];
  assert.deepEqual(target.giveMintable, []);
  assert.deepEqual(target.mintable, []);
});

function playing(kinId: string): KinState {
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
  dispatch(state, act("pickKin", "p1", { kin: kinId }));
  for (let guard = 0; state.world!.step === "setup" && guard < 50; guard++) {
    const choices = setupChoices(state)!;
    dispatch(state, act("setupPlace", "p1", choices.tile !== null ? { side: choices.sides[0] } : { tile: choices.tiles[choices.tiles.length - 1] }));
  }
  while (state.world!.step === "characters") {
    const pick = eligibleCharacters(state, characterPicker(state)!, characterRound(state))[0];
    dispatch(state, act("pickCharacter", "p1", { character: pick.id }));
  }
  if (state.play!.phase === "event") dispatch(state, act("pass", "p1"));
  // A second player, who has no setup of their own: enough to barter with.
  state.order.push("p2");
  state.players.p2 = { id: "p2", username: "p2", connected: true, resources: {} };
  state.players.p1.resources.gold = 10;
  state.play!.turn = "p1";
  return state;
}

const tap = (state: KinState) => { for (const card of Object.values(state.cards)) card.tapped = false; for (const item of state.items) item.tapped = false; const source = sourcesFor(state, "p1", "discovery")[0]; return { kind: source.kind, card: source.id }; };
const give = (state: KinState, player: string, def: string, giver?: string) => addItem(state, def, `court:${player}`, player, giver);
const courtOf = (state: KinState, player: string, def: string) => state.items.filter(item => item.def === def && item.zone === `court:${player}`);

test("an accepted Barter moves resources, and a declined one only taps the card", () => {
  const state = playing("hammers");
  const source = tap(state);
  assert.equal(dispatch(state, act("barter", "p1", { ...source, to: "p2", give: { resources: { gold: 4 } }, take: {} })), null);
  assert.match(dispatch(state, act("pass", "p1")) ?? "", /answer/);
  assert.match(dispatch(state, act("barterRespond", "p1", { accept: true })) ?? "", /not for you/);
  assert.equal(dispatch(state, act("barterRespond", "p2", { accept: true })), null);
  assert.equal(state.players.p1.resources.gold, 6);
  assert.equal(state.players.p2.resources.gold, 4);

  state.play!.turn = "p1";
  assert.equal(dispatch(state, act("barter", "p1", { ...tap(state), to: "p2", give: { resources: { gold: 1 } }, take: {} })), null);
  assert.equal(dispatch(state, act("barterRespond", "p2", { accept: false })), null);
  assert.equal(state.players.p1.resources.gold, 6);
});

test("declining Barter transfers nothing, keeps its source tapped and ends the offering player's turn", () => {
  for (const kind of ["character", "item"] as const) {
    const state = playing("hammers");
    const character = sourcesFor(state, "p1", "discovery").find(source => source.kind === "character")!;
    const activation = give(state, "p1", "activation-discovery");
    const source = kind === "character" ? { kind, card: character.id } : { kind, card: activation.id };
    give(state, "p2", "activation-discovery");
    give(state, "p2", "trade-treaty", "p1");
    state.players.p2.resources.gold = 2;
    const before = structuredClone({ p1: state.players.p1.resources, p2: state.players.p2.resources });
    assert.equal(dispatch(state, act("barter", "p1", { ...source, to: "p2", give: { resources: { gold: 3 } }, take: { resources: { gold: 1 } } })), null);
    assert.equal(dispatch(state, act("barterRespond", "p2", { accept: false })), null);
    assert.equal(state.play!.barter, null);
    assert.equal(state.play!.turn, "p2");
    assert.equal(state.play!.phase, "discovery");
    assert.deepEqual(state.players.p1.resources, before.p1);
    assert.deepEqual(state.players.p2.resources, before.p2);
    assert.equal(kind === "character" ? state.cards[source.card].tapped : activation.tapped, true);
  }
});

test("a Barter checks what each side really has", () => {
  const state = playing("hammers");
  const base = { ...tap(state), to: "p2" };
  assert.match(dispatch(state, act("barter", "p1", { ...base, give: { resources: { gold: 99 } } })) ?? "", /does not have/);
  assert.match(dispatch(state, act("barter", "p1", { ...base, take: { resources: { gold: 1 } } })) ?? "", /does not have/);
  assert.match(dispatch(state, act("barter", "p1", { ...base })) ?? "", /Offer something/);
  assert.match(dispatch(state, act("barter", "p1", { ...base, give: { characters: ["nobody"] } })) ?? "", /not in that court/);
});

test("only untapped relics can be bartered in either direction", () => {
  for (const side of ["give", "take"]) {
    const state = playing("hammers");
    const owner = side === "give" ? "p1" : "p2";
    const receiver = side === "give" ? "p2" : "p1";
    state.players[owner].resources.relic = 5;
    state.players[owner].relicsTapped = 3;
    const base = { ...tap(state), to: "p2" };
    assert.match(dispatch(state, act("barter", "p1", { ...base, [side]: { resources: { relic: 3 } } })) ?? "", /untapped relics/);
    assert.equal(dispatch(state, act("barter", "p1", { ...base, [side]: { resources: { relic: 2 } } })), null);
    assert.match(dispatch(state, act("tapRelics", "p1", { amount: 1, resource: "gold" })) ?? "", /current action/);
    assert.equal(dispatch(state, act("barterRespond", "p2", { accept: true })), null);
    assert.equal(state.players[owner].resources.relic, 3);
    assert.equal(state.players[owner].relicsTapped, 3);
    assert.equal(state.players[receiver].resources.relic, 2);
    assert.equal(state.players[receiver].relicsTapped ?? 0, 0);
  }
});

test("characters change courts in a Barter", () => {
  const state = playing("hammers");
  const source = sourcesFor(state, "p1", "discovery")[0];
  const other = Object.values(state.cards).find(card => card.owner === "p1" && card.id !== source.id)!;
  assert.equal(dispatch(state, act("barter", "p1", { kind: source.kind, card: source.id, to: "p2", give: { characters: [source.id] } })) ?? "", "The character that is tapped for the Barter cannot be offered.");
  assert.equal(dispatch(state, act("barter", "p1", { kind: source.kind, card: source.id, to: "p2", give: { characters: [other.id] } })), null);
  dispatch(state, act("barterRespond", "p2", { accept: true }));
  assert.equal(other.owner, "p2");
  assert.equal(other.zone, "court:p2");
});

test("Lumon and the Ethereal cannot be offered or requested in a Barter", () => {
  for (const id of ["lumon", "ethereal"]) {
    for (const owner of ["p1", "p2"]) {
      const state = playing("hammers");
      state.cards[id] = { ...Object.values(state.cards)[0], id, owner, zone: `court:${owner}` };
      const source = tap(state);
      if (source.card === id) {
        const other = sourcesFor(state, "p1", "discovery").find(entry => entry.id !== id)!;
        source.kind = other.kind;
        source.card = other.id;
      }
      const side = owner === "p1" ? "give" : "take";
      assert.match(dispatch(state, act("barter", "p1", { ...source, to: "p2", [side]: { characters: [id] } })) ?? "", /cannot be bartered away/);
      assert.equal(state.cards[id].owner, owner);
      assert.ok(!state.play!.barter);
    }
  }
});

test("held treaties cannot be offered or requested in a Barter", () => {
  const state = playing("hammers");
  for (const def of ["trade-treaty", "access-treaty", "peace-treaty", "promise-treaty", "vassal-treaty", "faction-treaty"]) {
    for (const owner of ["p1", "p2"]) {
      const item = give(state, owner, def, owner === "p1" ? "p2" : "p1");
      const side = owner === "p1" ? "give" : "take";
      assert.match(dispatch(state, act("barter", "p1", { ...tap(state), to: "p2", [side]: { treaties: [item.id] } })) ?? "", /Held treaties cannot be traded/);
      assert.equal(item.owner, owner);
      assert.ok(!state.play!.barter);
    }
  }
});

test("Tradegoods belong to the Syndicate and convert in either direction of a Barter", () => {
  for (const owner of ["p1", "p2"]) {
    const state = playing("hammers");
    state.players[owner].resources.tradegood = 3;
    const goods = { resources: { tradegood: 2 }, tradegoodAs: "food" };
    const offer = { to: "p2", ...(owner === "p1" ? { give: goods } : { take: goods }) };
    assert.match(dispatch(state, act("barter", "p1", { ...tap(state), ...offer })) ?? "", /Only the Seven Streams Syndicate/);
    give(state, owner, "tradegoods");
    assert.equal(dispatch(state, act("barter", "p1", { ...tap(state), ...offer })), null);
    const receiver = owner === "p1" ? "p2" : "p1";
    const food = state.players[receiver].resources.food ?? 0;
    assert.equal(dispatch(state, act("barterRespond", "p2", { accept: true })), null);
    assert.equal(state.players[owner].resources.tradegood, 1);
    assert.equal(state.players[receiver].resources.food, food + 2);
    assert.equal(state.players[receiver].resources.tradegood ?? 0, 0);
  }
});

test("Harbor Treaty connections follow the Harbor edge through a connected river", () => {
  const state = playing("hammers");
  const first = tileIndex(2, 2);
  const second = tileIndex(8, 10);
  for (const tile of state.tiles) tile.terrain = "plains";
  state.buildings = [
    { id: "v1", def: "village", owner: "p1", kind: "tile", tile: first },
    { id: "v2", def: "village", owner: "p2", kind: "tile", tile: second },
    { id: "h1", def: "harbor", owner: "p1", kind: "slice", tile: first, side: 0 },
    { id: "h2", def: "harbor", owner: "p2", kind: "slice", tile: second, side: 0 }
  ];
  const edgeA = sideEdge(first, 0);
  const edgeB = sideEdge(second, 0);
  const [a] = edgeA.split("|");
  const [b] = edgeB.split("|");
  const bridge = "harbor-river-bridge";
  const path = [edgeA, [a, bridge].sort().join("|"), [bridge, b].sort().join("|"), edgeB];
  state.world!.rivers = Object.fromEntries(path.map(edge => [edge, 1]));
  assert.equal(connected(state, "p1", "p2"), true);

  const wrongA = sideEdge(first, 3);
  const wrongB = sideEdge(second, 3);
  const [wrongStart] = wrongA.split("|");
  const [wrongEnd] = wrongB.split("|");
  state.world!.rivers = Object.fromEntries([wrongA, [wrongStart, bridge].sort().join("|"), [bridge, wrongEnd].sort().join("|"), wrongB].map(edge => [edge, 1]));
  assert.equal(connected(state, "p1", "p2"), false);
});

test("new treaties need their diplomacy technology and follow their own conditions", () => {
  const state = playing("hammers");
  const mint = (extra: Record<string, unknown>) => dispatch(state, act("barter", "p1", { ...tap(state), to: "p2", mint: [{ giver: "from", ...extra }] }));
  assert.match(mint({ def: "peace-treaty", duration: 3 }) ?? "", /lacks Peace Diplomacy/);
  give(state, "p1", "peace-diplomacy");
  assert.match(mint({ def: "peace-treaty", duration: 11 }) ?? "", /1 to 10/);
  give(state, "p1", "promise-diplomacy");
  assert.match(mint({ def: "promise-treaty", promise: "I will not attack." }) ?? "", /arbiter/);
  assert.match(mint({ def: "promise-treaty", promise: "I will not attack.", arbiter: "p1" }) ?? "", /arbiter/);
  give(state, "p1", "trade-diplomacy");
  assert.match(mint({ def: "trade-treaty" }) ?? "", /connected/);

  assert.equal(mint({ def: "peace-treaty", duration: 3 }), null);
  dispatch(state, act("barterRespond", "p2", { accept: true }));
  const [treaty] = courtOf(state, "p2", "peace-treaty");
  assert.equal(treaty.giver, "p1");
  assert.equal(treaty.duration, 3);

  state.play!.turn = "p1";
  assert.match(mint({ def: "peace-treaty", duration: 3 }) ?? "", /only hold one/);
  seasonsChangeTreaties(state);
  assert.equal(treaty.duration, 2);
  seasonsChangeTreaties(state);
  seasonsChangeTreaties(state);
  assert.equal(courtOf(state, "p2", "peace-treaty").length, 0);
});

test("a Trade Treaty needs a connection, untaps the card, and cannot be passed on", () => {
  const state = playing("hammers");
  give(state, "p1", "trade-diplomacy");
  const mine = state.buildings.find(building => building.owner === "p1" && building.tile >= 0)!;
  state.buildings.push({ id: "bx", def: "village", owner: "p2", kind: "tile", tile: neighbors(mine.tile)[0] });
  const source = tap(state);
  assert.equal(dispatch(state, act("barter", "p1", { ...source, to: "p2", mint: [{ def: "trade-treaty", giver: "from" }] })), null);
  dispatch(state, act("barterRespond", "p2", { accept: true }));
  const tapped = source.kind === "character" ? state.cards[source.card].tapped : state.items.find(item => item.id === source.card)!.tapped;
  assert.equal(tapped, false);

  state.play!.turn = "p2";
  const treaty = courtOf(state, "p2", "trade-treaty")[0];
  state.cards[Object.keys(state.cards).find(id => state.cards[id].owner === null)!].owner = "p2";
  const p2Source = Object.values(state.cards).find(card => card.owner === "p2")!;
  assert.match(dispatch(state, act("barter", "p2", { kind: "character", card: p2Source.id, to: "p1", give: { treaties: [treaty.id] } })) ?? "", /Discovery|untapped|Held treaties/);
});

test("Lapsed Treaties dissolves unconnected Trade Treaties and asks arbiters for a verdict", () => {
  const state = playing("hammers");
  if (state.cards["izz-ether"]) state.cards["izz-ether"].owner = undefined;
  state.items.push({ id: "ev", def: "lapsed-treaties", zone: "board:phase", owner: null, tapped: false });
  give(state, "p2", "trade-treaty", "p1");
  const promise = give(state, "p2", "promise-treaty", "p1");
  promise.promise = "Do not attack.";
  promise.arbiter = "p2";
  give(state, "p1", "promise-ban");
  lapsedTreaties(state);
  assert.equal(courtOf(state, "p2", "trade-treaty").length, 0);
  assert.equal(state.play!.verdicts.length, 1);
  assert.equal(state.items.find(item => item.id === "ev")!.tapped, true);

  assert.match(dispatch(state, act("verdict", "p1", { treaty: promise.id, broken: true })) ?? "", /not the arbiter/);
  assert.equal(dispatch(state, act("verdict", "p2", { treaty: promise.id, broken: true })), null);
  assert.equal(state.play!.verdicts.length, 0);
  assert.equal(courtOf(state, "p2", "promise-treaty").length, 0);
  assert.equal(courtOf(state, "p1", "promise-ban").length, 1);
});

test("a kept promise stays, and a Peace Treaty that is broken dissolves them all and gives a Peace Ban", () => {
  const state = playing("hammers");
  state.items.push({ id: "ev", def: "lapsed-treaties", zone: "board:phase", owner: null, tapped: false });
  const promise = give(state, "p2", "promise-treaty", "p1");
  promise.promise = "Be kind.";
  promise.arbiter = "p2";
  lapsedTreaties(state);
  dispatch(state, act("verdict", "p2", { treaty: promise.id, broken: false }));
  assert.equal(courtOf(state, "p2", "promise-treaty").length, 1);

  give(state, "p2", "peace-treaty", "p1");
  give(state, "p1", "peace-treaty", "p2");
  breakOnAttack(state, "p1", "p2");
  assert.equal(courtOf(state, "p1", "peace-treaty").length + courtOf(state, "p2", "peace-treaty").length, 0);
  assert.equal(courtOf(state, "p1", "peace-ban").length, 1);
  assert.match(dispatch(state, act("barter", "p1", { ...tap(state), to: "p2", mint: [{ def: "peace-treaty", giver: "from", duration: 2 }] })) ?? "", /lacks|Ban/);
});

test("breaking a Vassal Treaty costs the vassal a hostage and its gold", () => {
  const state = playing("hammers");
  give(state, "p2", "vassal-treaty", "p1");
  breakOnAttack(state, "p1", "p2");
  assert.equal(state.players.p1.resources.gold, 0);
  assert.equal(state.players.p2.resources.gold, 10);
  const hostage = Object.values(state.cards).find(card => card.hostageOf === "p1")!;
  assert.equal(hostage.owner, "p2");
  assert.equal(courtOf(state, "p1", "vassal-ban").length, 1);
  assert.equal(sourcesFor(state, "p2", "discovery").some(source => source.id === hostage.id), false);
});

test("Dissolve returns a treaty without breaking it", () => {
  const state = playing("hammers");
  state.play!.turn = "p1";
  const treaty = give(state, "p1", "access-treaty", "p2");
  assert.equal(dispatch(state, act("dissolve", "p1", { ...tap(state), treaty: treaty.id })), null);
  assert.equal(state.items.includes(treaty), false);
  assert.equal(courtOf(state, "p1", "access-ban").length, 0);
});

test("an Access Treaty is permission to leave a tile next to the giver's army, and the Faction Treaty gives a core effect", () => {
  const state = playing("hammers");
  const mine = state.armies.find(army => army.owner === "p1" && army.tile >= 0)!;
  const spot = neighbors(mine.tile).find(tile => state.tiles[tile].terrain !== "ocean" && !state.armies.some(army => army.tile === tile))!;
  state.armies.push({ id: "ax", owner: "p2", tile: spot, strength: 1 });
  assert.equal(legalSteps(state, mine, 6).length, 0);
  give(state, "p1", "access-treaty", "p2");
  assert.ok(legalSteps(state, mine, 6).length > 0);

  state.world!.kinPicks.p2 = "hanshu";
  assert.equal(hasCard(state, "p1", "imperial-roads"), false);
  give(state, "p1", "faction-treaty", "p2");
  assert.equal(hasCard(state, "p1", "imperial-roads"), true);
});
