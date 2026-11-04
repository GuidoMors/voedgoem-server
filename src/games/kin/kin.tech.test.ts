import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { maxArmyStrength } from "./cards";
import { sourcesFor } from "./play";
import { createRng, nextInt } from "./rng";
import { setupChoices } from "./setup";
import type { Action, KinState } from "./types";

const act = (type: string, id: string, extra: Record<string, unknown> = {}): Action => ({ type, actor: { id, username: id, isHost: id === "p1" }, ...extra });

// A solo testing game played through the whole setup, ending at the first Discovery phase.
function playing(kinId: string): KinState {
  const state = createState(1);
  dispatch(state, act("join", "p1"));
  dispatch(state, act("setOptions", "p1", { testing: true }));
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
  if (state.play!.phase === "event") assert.equal(dispatch(state, act("pass", "p1")), null);
  return state;
}

const give =  (state: KinState, gears: number) => { state.players.p1.resources.gear = gears; };
const zoneOf = (state: KinState, def: string) => state.items.find(item => item.def === def)?.zone;
const tap = (state: KinState) => { const source = sourcesFor(state, "p1", "discovery")[0]; return { kind: source.kind, card: source.id }; };
const itemOf = (state: KinState, def: string) => state.items.find(item => item.def === def)!;

test("Research needs the gears, taps the card and claims the technology with its cards", () => {
  const state = playing("hammers");
  const tech = itemOf(state, "market-construction");
  assert.match(dispatch(state, act("research", "p1", { ...tap(state), tech: tech.id })) ?? "", /gears/);
  give(state, 5);
  const source = tap(state);
  assert.equal(dispatch(state, act("research", "p1", { ...source, tech: tech.id })), null);
  assert.equal(state.players.p1.resources.gear, 3);
  assert.equal(tech.zone, "court:p1");
  assert.equal(zoneOf(state, "market"), "court:p1");
  assert.equal(state.cards[source.card]?.tapped ?? state.items.find(item => item.id === source.card)!.tapped, true);
  assert.match(dispatch(state, act("research", "p1", { ...source, tech: tech.id })) ?? "", /research track|Discovery|untapped/);
});

test("researching an event technology puts its event card on the phase board", () => {
  const state = playing("hammers");
  give(state, 10);
  dispatch(state, act("research", "p1", { ...tap(state), tech: itemOf(state, "council-science").id }));
  assert.equal(zoneOf(state, "council"), "board:phase");
  assert.equal(zoneOf(state, "revoke"), "court:p1");
});

test("Steampower can only be researched after every other technology", () => {
  const state = playing("hammers");
  give(state, 50);
  assert.match(dispatch(state, act("research", "p1", { ...tap(state), tech: itemOf(state, "steampower").id })) ?? "", /Steampower/);
  for (const item of state.items) if (item.zone === "board:research" && item.def !== "steampower") { item.zone = "court:p1"; item.owner = "p1"; }
  assert.equal(dispatch(state, act("research", "p1", { ...tap(state), tech: itemOf(state, "steampower").id })), null);
  assert.equal(zoneOf(state, "activation-universal"), "court:p1");
});

test("Publicize moves your own technology to the public track for free, with its blueprint and actions", () => {
  const state = playing("hammers");
  give(state, 10);
  const tech = itemOf(state, "archeology-science");
  dispatch(state, act("research", "p1", { ...tap(state), tech: tech.id }));
  state.items.forEach(item => { item.tapped = false; });
  Object.values(state.cards).forEach(card => { card.tapped = false; });
  state.play!.turn = "p1";
  const gears = state.players.p1.resources.gear;
  assert.equal(dispatch(state, act("publicize", "p1", { ...tap(state), tech: tech.id })), null);
  assert.equal(state.players.p1.resources.gear, gears);
  assert.equal(tech.zone, "board:public");
  assert.equal(zoneOf(state, "explore"), "board:phase");
  assert.equal(zoneOf(state, "reclaim"), "board:phase");
});

test("publicizing an Active technology gives everyone else an activation card", () => {
  const state = playing("hammers");
  state.order.push("p2");
  state.players.p2 = { id: "p2", username: "p2", connected: true, resources: {} };
  const active = itemOf(state, "active-discovery");
  active.zone = "court:p1";
  active.owner = "p1";
  assert.equal(dispatch(state, act("publicize", "p1", { ...tap(state), tech: active.id })), null);
  assert.equal(active.zone, "board:public");
  assert.equal(state.items.filter(item => item.def === "activation-discovery" && item.zone === "court:p2").length, 1);
  assert.equal(state.items.filter(item => item.def === "activation-discovery" && item.zone === "court:p1").length, 0);
});

test("a public technology works for everyone, and Greater Army Strength raises the maximum", () => {
  const state = playing("hammers");
  assert.equal(maxArmyStrength(state, "p1"), 3);
  const tech = itemOf(state, "greater-army-strength");
  tech.zone = "board:public";
  assert.equal(maxArmyStrength(state, "p1"), 8);
  assert.equal(maxArmyStrength(state, "anyone"), 8);
});

test("another player's technology costs its gears to publicize", () => {
  const state = playing("hammers");
  state.order.push("p2");
  state.players.p2 = { id: "p2", username: "p2", connected: true, resources: {} };
  const tech = itemOf(state, "wall-construction");
  tech.zone = "court:p2";
  tech.owner = "p2";
  assert.match(dispatch(state, act("publicize", "p1", { ...tap(state), tech: tech.id })) ?? "", /gears/);
  give(state, 4);
  assert.equal(dispatch(state, act("publicize", "p1", { ...tap(state), tech: tech.id })), null);
  assert.equal(state.players.p1.resources.gear, 3);
  assert.equal(tech.zone, "board:public");
});
