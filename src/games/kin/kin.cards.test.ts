import assert from "node:assert/strict";
import { test } from "node:test";
import { CARDS } from "./cards.data";
import { createState, dispatch, tilePlacer } from "./engine";
import { createRng, nextInt } from "./rng";
import type { Action, KinState } from "./types";

const act = (type: string, id: string, extra: Record<string, unknown> = {}): Action => ({ type, actor: { id, username: id, isHost: id === "p1" }, ...extra });

function started(picks: string[]): KinState {
  const state = createState(1);
  picks.forEach((_, index) => dispatch(state, act("join", `p${index + 1}`)));
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
  picks.forEach((pick, index) => assert.equal(dispatch(state, act("pickKin", `p${index + 1}`, { kin: pick })), null));
  return state;
}

const court = (state: KinState, player: string) => state.items.filter(item => item.zone === `court:${player}`).map(item => item.def);

test("every card def is generated", () => {
  const kinds = new Set(CARDS.map(card => card.kind));
  for (const kind of ["event", "action", "blueprint", "faction", "technology", "activation", "treaty", "ban"]) assert.ok(kinds.has(kind as "ban"), kind);
});

test("public cards are dealt to the boards", () => {
  const state = started(["hammers"]);
  const zone = (z: string) => state.items.filter(item => item.zone === z).map(item => item.def);
  assert.ok(zone("board:building").includes("village"));
  assert.ok(zone("board:phase").includes("move"));
  assert.ok(zone("board:phase").includes("seasons-change"));
  assert.ok(zone("board:research").includes("steampower"));
  assert.ok(!zone("board:research").includes("tactician-science"));
});

test("starting technologies and the cards they grant are claimed into the court", () => {
  const state = started(["hammers"]);
  const mine = court(state, "p1");
  for (const def of ["tactician-science", "mountain-movement", "smith-construction", "smith"]) assert.ok(mine.includes(def), def);
  assert.equal(state.items.filter(item => item.def === "tactician" && item.zone === "board:phase").length, 1);
  assert.equal(new Set(state.items.map(item => item.id)).size, state.items.length);
});

test("the Ethereal hold a Faction Treaty from every other player", () => {
  const state = started(["ethereal", "hammers"]);
  const treaties = state.items.filter(item => item.def === "faction-treaty" && item.owner === "p1");
  assert.equal(treaties.length, 1);
  assert.equal(treaties[0].giver, "p2");
});
