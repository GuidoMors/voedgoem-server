import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { kin } from "./index";
import { createRng, nextInt } from "./rng";
import { setupChoices } from "./setup";
import type { Action, KinState } from "./types";
import { sideEdge, sideNeighbor, tileDistance } from "./world";

const act = (type: string, id: string, extra: Record<string, unknown> = {}): Action => ({ type, actor: { id, username: id, isHost: id === "p1" }, ...extra });

// A real board with every tile placed; the rivers are skipped by jumping to the Kin pick.
function atKin(picks: string[], seed = 1): KinState {
  const state = createState(seed);
  picks.forEach((_, index) => dispatch(state, act("join", `p${index + 1}`)));
  assert.equal(dispatch(state, act("start", "p1")), null);
  const rng = createRng(seed);
  const types = ["mountain", "forest", "farmland"] as const;
  while (state.world!.step === "tiles") {
    const free = state.tiles.flatMap((tile, index) => tile.terrain === "ocean" ? [index] : []);
    let terrain: string = types[nextInt(rng, 3)];
    while (state.world!.pile[terrain as "mountain"] === 0) terrain = types[nextInt(rng, 3)];
    assert.equal(dispatch(state, act("placeTile", tilePlacer(state, state.world!), { tile: free[nextInt(rng, free.length)], terrain })), null);
  }
  state.world!.step = "kin";
  return state;
}

function pickAll(state: KinState, picks: string[]) {
  picks.forEach((pick, index) => assert.equal(dispatch(state, act("pickKin", `p${index + 1}`, { kin: pick })), null));
}

function runSetup(state: KinState) {
  for (let guard = 0; state.world!.step === "setup" && guard < 50; guard++) {
    const choices = setupChoices(state)!;
    const error = dispatch(state, act("setupPlace", choices.player, choices.task === "worksite" ? { side: choices.sides[0] } : { tile: choices.tiles[choices.tiles.length - 1] }));
    assert.equal(error, null);
  }
}

test("a village and a worksite are placed, with an army on the village", () => {
  const picks = ["lumon", "wanderers"];
  const state = atKin(picks);
  pickAll(state, picks);
  assert.equal(state.world!.step, "setup");
  // Natural Kin order: Wanderers come before Lumon.
  assert.equal(setupChoices(state)!.player, "p2");
  assert.match(dispatch(state, act("setupPlace", "p1", { tile: 0 })) ?? "", /not your turn/);
  assert.match(dispatch(state, act("setupPlace", "p2", { tile: -5 })) ?? "", /cannot place/);
  runSetup(state);
  assert.equal(state.world!.step, "characters");
  const villages = state.buildings.filter(b => b.def === "village");
  assert.equal(villages.length, 2);
  assert.ok(tileDistance(villages[0].tile, villages[1].tile) >= 3);
  assert.equal(state.tiles[villages[1].tile].terrain, "snow");
  assert.equal(state.armies.length, 2);
  for (const worksite of state.buildings.filter(b => b.def === "worksite")) {
    const next = sideNeighbor(worksite.tile, worksite.side!)!;
    assert.ok(["farmland", "forest", "mountain"].includes(state.tiles[next].terrain));
  }
});

test("Hanshu get a second village at distance 3 joined by roads", () => {
  const state = atKin(["hanshu"], 4);
  pickAll(state, ["hanshu"]);
  runSetup(state);
  const villages = state.buildings.filter(b => b.def === "village");
  assert.equal(villages.length, 2);
  assert.equal(tileDistance(villages[0].tile, villages[1].tile), 3);
  const roads = state.buildings.filter(b => b.def === "road");
  assert.equal(roads.length, 3);
  assert.ok(roads.every(road => road.kind === "cross" && road.owner === null));
  assert.equal(state.armies.length, 1);
});

test("the Ark and the Great Tree set up their special buildings", () => {
  const picks = ["ark", "tree"];
  const state = atKin(picks, 2);
  pickAll(state, picks);
  runSetup(state);
  assert.ok(state.buildings.some(b => b.def === "the-ark" && b.kind === "center"));
  assert.ok(state.buildings.some(b => b.def === "worksite" && b.tile === -1));
  const tree = state.buildings.find(b => b.def === "the-great-tree")!;
  assert.equal(state.tiles[tree.tile].terrain, "forest");
  assert.equal(state.armies.length, 2);
});

test("a Syndicate village needs a river and a stuck step is skipped", () => {
  const state = atKin(["syndicate"], 3);
  pickAll(state, ["syndicate"]);
  // No rivers on this board, so the village cannot be placed and the step moves on.
  assert.equal(state.world!.step, "characters");
  assert.equal(state.buildings.length, 0);
});

test("buildings are in the snapshot", () => {
  const state = atKin(["lumon"], 5);
  pickAll(state, ["lumon"]);
  const first = setupChoices(state)!;
  assert.equal(first.tiles.length > 0, true);
  const snap = kin.snapshot(state, "p1", new Set(["p1"])) as { world: { buildings: unknown[]; armies: unknown[]; setup: unknown } };
  assert.ok(Array.isArray(snap.world.buildings));
  assert.ok(snap.world.setup);
  void sideEdge;
});

test("the testing cheat gives the host 100 of a resource", () => {
  const state = atKin(["lumon"], 6);
  assert.match(dispatch(state, act("giveResource", "p1", { resource: "gold" })) ?? "", /Testing mode is off/);
  state.options.testing = true;
  assert.match(dispatch(state, act("giveResource", "p1", { resource: "nope" })) ?? "", /Unknown resource/);
  assert.equal(dispatch(state, act("giveResource", "p1", { resource: "gear" })), null);
  assert.equal(dispatch(state, act("giveResource", "p1", { resource: "gear" })), null);
  assert.equal(state.players.p1.resources.gear, 200);
});
