import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, kinPicker, serialize, deserialize } from "./engine";
import { kin } from "./index";
import { KINS } from "./kins";
import type { Action, KinState } from "./types";

const act = (type: string, id: string, extra: Record<string, unknown> = {}): Action => ({ type, actor: { id, username: id, isHost: id === "p1" }, ...extra });

// Skips world setup: the Kin draft only depends on the step.
function atKinStep(players: number): KinState {
  const state = createState(3);
  for (let index = 1; index <= players; index++) dispatch(state, act("join", `p${index}`));
  assert.equal(dispatch(state, act("start", "p1")), null);
  state.world!.step = "kin";
  return state;
}

test("there are ten distinct Kin", () => {
  assert.equal(KINS.length, 10);
  assert.equal(new Set(KINS.map(k => k.id)).size, 10);
});

test("Kin are drafted in turn order, host first, and each Kin only once", () => {
  const state = atKinStep(3);
  const world = state.world!;
  assert.equal(kinPicker(state, world), "p1");
  assert.match(dispatch(state, act("pickKin", "p2", { kin: "hanshu" })) ?? "", /not your turn/);
  assert.match(dispatch(state, act("pickKin", "p1", { kin: "nope" })) ?? "", /ten Kin/);
  assert.equal(dispatch(state, act("pickKin", "p1", { kin: "hanshu" })), null);
  assert.match(dispatch(state, act("pickKin", "p2", { kin: "hanshu" })) ?? "", /already picked/);
  assert.equal(dispatch(state, act("pickKin", "p2", { kin: "ethereal" })), null);
  assert.equal(world.step, "kin");
  assert.equal(dispatch(state, act("pickKin", "p3", { kin: "deepones" })), null);
  assert.equal(world.step, "setup");
  assert.deepEqual(world.kinPicks, { p1: "hanshu", p2: "ethereal", p3: "deepones" });
  assert.match(dispatch(state, act("pickKin", "p1", { kin: "tree" })) ?? "", /current setup step/);
});

test("a solo player picks one Kin and the step ends", () => {
  const state = atKinStep(1);
  assert.equal(dispatch(state, act("pickKin", "p1", { kin: "lumon" })), null);
  assert.notEqual(state.world!.step, "kin");
});

test("Kin picks are in the snapshot and survive a save", () => {
  const state = atKinStep(2);
  dispatch(state, act("pickKin", "p1", { kin: "wanderers" }));
  const snap = kin.snapshot(deserialize(serialize(state)), "p2", new Set(["p1", "p2"])) as { world: { turn: string; kinPicks: Record<string, string>; kins: unknown[] } };
  assert.equal(snap.world.turn, "p2");
  assert.deepEqual(snap.world.kinPicks, { p1: "wanderers" });
  assert.equal(snap.world.kins.length, 10);
});

import { CHARACTERS } from "./characters.data";
import { setupChoices } from "./setup";
import { characterPicker, characterRound, eligibleCharacters, naturalOrder } from "./draft";

function atCharacters(picks: Record<string, string>): KinState {
  const ids = Object.keys(picks);
  const state = atKinStep(ids.length);
  ids.forEach((id, index) => { assert.equal(dispatch(state, act("pickKin", kinPicker(state, state.world!)!, { kin: picks[ids[index]] })), null); });
  // The empty test board has no valid village spots to speak of, so run the starting setup with whatever it offers.
  for (let guard = 0; state.world!.step === "setup" && guard < 50; guard++) {
    const choices = setupChoices(state)!;
    assert.equal(dispatch(state, act("setupPlace", choices.player, choices.task === "worksite" ? { side: choices.sides[0] } : { tile: choices.tiles[0] })), null);
  }
  return state;
}

test("the character list is complete", () => {
  assert.equal(CHARACTERS.length, 73);
  assert.equal(new Set(CHARACTERS.map(c => c.id)).size, 73);
  assert.equal(CHARACTERS.filter(c => c.kin === null).length, 17);
  assert.deepEqual(CHARACTERS.find(c => c.id === "liangzhuge")!.archetypes, ["discovery", "control"]);
  assert.equal(CHARACTERS.filter(c => c.abilities.length === 0).length, 4);
});

test("only neutral characters and characters of picked Kin are dealt", () => {
  const state = atCharacters({ p1: "hanshu", p2: "wanderers" });
  const ids = Object.keys(state.cards);
  assert.equal(ids.length, 17 + 6 + 6);
  assert.ok(!ids.includes("lumon"));
});

test("the character draft runs in natural Kin order through four rounds", () => {
  // p1 picked the later Kin but the Ethereal (p2) goes first in natural order.
  const state = atCharacters({ p1: "hanshu", p2: "ethereal" });
  const world = state.world!;
  assert.equal(world.step, "characters");
  assert.deepEqual(naturalOrder(state), ["p2", "p1"]);
  assert.equal(characterPicker(state), "p2");
  // The Ethereal must pick the Ethereal.
  assert.deepEqual(eligibleCharacters(state, "p2", 0).map(c => c.id), ["ethereal"]);
  assert.match(dispatch(state, act("pickCharacter", "p2", { character: "izz-ether" })) ?? "", /cannot claim/);
  assert.match(dispatch(state, act("pickCharacter", "p1", { character: "yamanano" })) ?? "", /not your turn/);
  assert.equal(dispatch(state, act("pickCharacter", "p2", { character: "ethereal" })), null);
  // A Kin character must belong to your own Kin.
  assert.match(dispatch(state, act("pickCharacter", "p1", { character: "hans" })) ?? "", /cannot claim/);
  assert.equal(dispatch(state, act("pickCharacter", "p1", { character: "bulu" })), null);
  assert.equal(characterRound(state), 1);
  // Round 2: Discovery. Universal counts, a neutral Expansion character does not, and claimed characters are gone.
  assert.match(dispatch(state, act("pickCharacter", "p2", { character: "hans" })) ?? "", /cannot claim/);
  assert.match(dispatch(state, act("pickCharacter", "p2", { character: "ethereal" })) ?? "", /cannot claim/);
  assert.equal(dispatch(state, act("pickCharacter", "p2", { character: "torke" })), null);
  assert.equal(dispatch(state, act("pickCharacter", "p1", { character: "liangzhuge" })), null);
  assert.equal(dispatch(state, act("pickCharacter", "p2", { character: "hans" })), null);
  assert.equal(dispatch(state, act("pickCharacter", "p1", { character: "yamanano" })), null);
  assert.equal(dispatch(state, act("pickCharacter", "p2", { character: "hazir" })), null);
  assert.equal(world.step, "characters");
  assert.equal(dispatch(state, act("pickCharacter", "p1", { character: "yuguan" })), null);
  assert.equal(world.step, "done");
  assert.equal(state.cards.torke.zone, "court:p2");
  assert.equal(state.cards.torke.owner, "p2");
  // Leftovers form the character deck.
  const left = Object.values(state.cards).filter(c => c.zone === "deck:character").length;
  assert.equal(left, 17 + 6 + 1 - 8);
  assert.equal(Object.values(state.cards).filter(c => c.owner).length, 8);
});

test("a solo Pride of Lumon player must take Lumon and then drafts three more", () => {
  const state = atCharacters({ p1: "lumon" });
  assert.match(dispatch(state, act("pickCharacter", "p1", { character: "wololay" })) ?? "", /cannot claim/);
  assert.equal(dispatch(state, act("pickCharacter", "p1", { character: "lumon" })), null);
  // Lumon is Universal but already claimed, so Wololay is the Discovery pick here.
  for (const character of ["wololay", "prishna", "anant"]) assert.equal(dispatch(state, act("pickCharacter", "p1", { character })), null);
  assert.equal(state.world!.step, "done");
});

test("character picks are public in the snapshot", () => {
  const state = atCharacters({ p1: "hanshu", p2: "ethereal" });
  dispatch(state, act("pickCharacter", "p2", { character: "ethereal" }));
  const snap = kin.snapshot(deserialize(serialize(state)), "p1", new Set(["p1", "p2"])) as { world: { turn: string; charClaims: Record<string, string>; charEligible: string[]; charRound: number } };
  assert.equal(snap.world.turn, "p1");
  assert.deepEqual(snap.world.charClaims, { ethereal: "p2" });
  assert.equal(snap.world.charRound, 0);
  assert.ok(snap.world.charEligible.includes("bulu") && !snap.world.charEligible.includes("hans"));
});
