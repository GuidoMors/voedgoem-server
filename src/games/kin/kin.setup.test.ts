import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { kin } from "./index";
import { createRng, nextInt } from "./rng";
import { setupChoices } from "./setup";
import { START_SETUPS, cardById, type StartingSetup } from "./cards.data";
import { production } from "./buildings";
import type { Action, KinState } from "./types";
import { sideEdge, sideNeighbor, tileDistance } from "./world";

const act = (type: string, id: string, extra: Record<string, unknown> = {}): Action => ({ type, actor: { id, username: id, isHost: id === "p1" }, ...extra });

function withSetup(kin: string, edit: (setup: StartingSetup) => void, check: () => void) {
  const original = START_SETUPS[kin];
  START_SETUPS[kin] = structuredClone(original);
  try {
    edit(START_SETUPS[kin]);
    check();
  } finally {
    START_SETUPS[kin] = original;
  }
}

test("generated setup rules control terrain, river requirements and minimum separation", () => {
  withSetup("lumon", setup => {
    Object.assign(setup.buildings[0], { terrain: ["desert"], river: true, minDistance: 4 });
  }, () => {
    const state = atKin(["lumon"]);
    for (const tile of state.tiles) tile.terrain = "desert";
    state.buildings.push({ id: "b1", def: "village", owner: "other", kind: "tile", tile: 0 });
    state.world!.rivers = { [sideEdge(0, 0)]: true, [sideEdge(150, 0)]: true };
    pickAll(state, ["lumon"]);
    const choices = setupChoices(state)!;
    assert.ok(choices.tiles.length > 0);
    assert.ok(choices.tiles.every(tile => state.tiles[tile].terrain === "desert" && tileDistance(0, tile) >= 4));
    assert.ok(choices.tiles.every(tile => [0, 1, 2, 3, 4, 5].some(side => sideEdge(tile, side) in state.world!.rivers)));
    assert.match(choices.prompt, /desert/);
    assert.match(choices.prompt, /next to a river/);
    assert.match(choices.prompt, /at least 4/);
  });
});

test("generated setup rules control road length and starting army count, strength and location", () => {
  withSetup("hanshu", setup => {
    Object.assign(setup.buildings[1], { roadLength: 2, minDistance: 2 });
    setup.armies = [{ count: 2, strength: 4, location: "village2" }];
  }, () => {
    const state = atKin(["hanshu"], 4);
    pickAll(state, ["hanshu"]);
    runSetup(state);
    const villages = state.buildings.filter(building => building.def === "village");
    assert.equal(tileDistance(villages[0].tile, villages[1].tile), 2);
    assert.equal(state.buildings.filter(building => building.def === "road").length, 2);
    assert.equal(state.armies.length, 2);
    assert.ok(state.armies.every(army => army.tile === villages[1].tile && army.strength === 4));
  });
});

test("the Ark Worksite's location and automatic placement come from the generated setup", () => {
  withSetup("ark", setup => {
    setup.buildings[1].placement = "choose";
  }, () => {
    const state = atKin(["ark"]);
    pickAll(state, ["ark"]);
    const ark = setupChoices(state)!;
    assert.equal(dispatch(state, act("setupPlace", "p1", { tile: ark.tiles[0] })), null);
    const worksite = setupChoices(state)!;
    assert.equal(worksite.task, "worksite");
    assert.equal(worksite.tile, -1);
    assert.equal(worksite.sides.length, 12);
    assert.ok(!state.buildings.some(building => building.def === "worksite"));
    assert.equal(dispatch(state, act("setupPlace", "p1", { side: 11 })), null);
    assert.equal(state.buildings.find(building => building.def === "worksite")!.side, 11);
    assert.ok(!setupChoices(state)!.sides.includes(11));
  });
  withSetup("ark", setup => {
    setup.buildings[1].location = "ark";
  }, () => {
    const state = atKin(["ark"]);
    pickAll(state, ["ark"]);
    runSetup(state);
    assert.equal(state.buildings.find(building => building.def === "worksite")!.tile, state.buildings.find(building => building.def === "the-ark")!.tile);
    assert.equal(state.buildings.find(building => building.def === "university")!.tile, -1);
  });
});

test("extra treaty claims are configured rather than tied to the Ethereal", () => {
  withSetup("lumon", setup => { setup.otherFactionTreaties = true; }, () => {
    const state = atKin(["lumon", "tree"]);
    pickAll(state, ["lumon", "tree"]);
    assert.ok(state.items.some(item => item.def === "faction-treaty" && item.owner === "p1" && item.giver === "p2"));
  });
});

test("the Syndicate's starting Harbor only offers free slices adjacent to a river or ocean", () => {
  const state = atKin(["syndicate"]);
  for (const tile of state.tiles) tile.terrain = "plains";
  const home = 150;
  for (let side = 0; side < 6; side++) state.tiles[sideNeighbor(home, side)!].terrain = "forest";
  state.world!.rivers = { [sideEdge(home, 0)]: true };
  pickAll(state, ["syndicate"]);
  assert.equal(dispatch(state, act("setupPlace", "p1", { tile: home })), null);
  assert.equal(dispatch(state, act("setupPlace", "p1", { side: 5 })), null);
  const harbor = setupChoices(state)!;
  assert.equal(harbor.building, "harbor");
  assert.deepEqual(harbor.sides, [0, 1]);
  assert.match(harbor.prompt, /adjacent to a river or ocean/);
  assert.match(dispatch(state, act("setupPlace", "p1", { side: 3 })) ?? "", /free slice/);
  state.tiles[sideNeighbor(home, 3)!].terrain = "ocean";
  assert.deepEqual(setupChoices(state)!.sides, [0, 1, 3]);
  state.world!.rivers = {};
  assert.deepEqual(setupChoices(state)!.sides, [3]);
  assert.equal(dispatch(state, act("setupPlace", "p1", { side: 3 })), null);
  assert.equal(state.buildings.find(building => building.def === "harbor")!.side, 3);
  assert.equal(setupChoices(state)!.building, "university");
});

test("custom steps keep their own building references when an earlier placement is skipped", () => {
  withSetup("lumon", setup => {
    const village = setup.buildings[0];
    village.river = true;
    setup.buildings.splice(1, 0, { ...structuredClone(village), step: "outpost", river: false });
    setup.buildings.push({ ...structuredClone(setup.buildings[3]), step: "outpost-university", location: "outpost" });
    setup.armies = [{ count: 1, strength: 2, location: "outpost" }];
  }, () => {
    const state = atKin(["lumon"]);
    pickAll(state, ["lumon"]);
    assert.equal(setupChoices(state)!.task, "outpost");
    runSetup(state);
    assert.equal(state.buildings.filter(building => building.def === "village").length, 1);
    assert.equal(state.buildings.filter(building => building.def === "worksite").length, 0);
    assert.equal(state.buildings.filter(building => building.def === "university").length, 1);
    assert.equal(state.armies[0].strength, 2);
    assert.equal(state.world!.step, "characters");
  });
});

test("editing the Worksite's adjacent terrain changes its highlighted slices", () => {
  withSetup("lumon", setup => {
    setup.buildings[1].adjacentTerrain = ["snow"];
  }, () => {
    const state = atKin(["lumon"]);
    for (const tile of state.tiles) tile.terrain = "snow";
    pickAll(state, ["lumon"]);
    const village = setupChoices(state)!;
    assert.equal(dispatch(state, act("setupPlace", "p1", { tile: village.tiles[0] })), null);
    const worksite = setupChoices(state)!;
    assert.equal(worksite.building, "worksite");
    assert.ok(worksite.sides.length > 0);
    assert.ok(worksite.sides.every(side => state.tiles[sideNeighbor(worksite.tile!, side)!].terrain === "snow"));
    assert.match(worksite.prompt, /snow/);
    assert.equal(dispatch(state, act("setupPlace", "p1", { side: worksite.sides[0] })), null);
  });
});

test("older Ark setups reuse their already placed Worksite without adding a duplicate", () => {
  const state = atKin(["ark"]);
  pickAll(state, ["ark"]);
  const choices = setupChoices(state)!;
  assert.equal(dispatch(state, act("setupPlace", "p1", { tile: choices.tiles[0] })), null);
  delete state.world!.setupBuildings;
  state.world!.setup.p1 = 1;
  const university = setupChoices(state)!;
  assert.equal(university.task, "university");
  assert.equal(dispatch(state, act("setupPlace", "p1", { side: university.sides[0] })), null);
  assert.equal(state.buildings.filter(building => building.def === "worksite").length, 1);
  assert.equal(state.buildings.filter(building => building.def === "university").length, 1);
  assert.equal(state.world!.step, "characters");
});

test("every faction starts with one University and its blueprint is public without technology", () => {
  for (const faction of ["ethereal", "hanshu", "wanderers", "lumon", "beastmen", "ark", "hammers", "syndicate", "tree", "deepones"]) {
    const state = atKin([faction]);
    if (faction === "syndicate") for (let tile = 0; tile < state.tiles.length; tile++) state.world!.rivers[sideEdge(tile, 0)] = true;
    pickAll(state, [faction]);
    runSetup(state);
    const universities = state.buildings.filter(building => building.def === "university");
    assert.equal(universities.length, 1, faction);
    const university = universities[0];
    assert.ok(!state.buildings.some(building => building.id !== university.id && building.kind === "slice" && building.tile === university.tile && building.side === university.side), faction);
    assert.equal(production(state, "p1").gear, 1, faction);
    assert.ok(state.items.some(item => item.def === "university" && item.zone === "board:building"));
    assert.equal(cardById("university-construction"), undefined);
  }
});

test("starting Universities require choosing an unoccupied slice, including the Ark and Great Tree", () => {
  for (const faction of ["lumon", "ark", "tree"]) {
    const state = atKin([faction]);
    pickAll(state, [faction]);
    while (setupChoices(state)!.task !== "university") {
      const choices = setupChoices(state)!;
      assert.equal(dispatch(state, act("setupPlace", "p1", choices.task === "worksite" ? { side: choices.sides[0] } : { tile: choices.tiles[0] })), null);
    }
    const choices = setupChoices(state)!;
    assert.equal(state.buildings.filter(building => building.def === "university").length, 0);
    assert.equal(state.world!.step, "setup");
    assert.equal(choices.sides.length, faction === "ark" ? 11 : faction === "tree" ? 6 : 5);
    assert.match(dispatch(state, act("setupPlace", "p1", { tile: choices.tile })) ?? "", /free slice/);
    assert.match(dispatch(state, act("setupPlace", "p1", { side: 99 })) ?? "", /free slice/);
    if (faction !== "tree") {
      const worksite = state.buildings.find(building => building.def === "worksite")!;
      assert.ok(!choices.sides.includes(worksite.side!));
      assert.match(dispatch(state, act("setupPlace", "p1", { side: worksite.side })) ?? "", /free slice/);
    }
    const side = choices.sides[choices.sides.length - 1];
    assert.equal(dispatch(state, act("setupPlace", "p1", { side })), null);
    const university = state.buildings.find(building => building.def === "university")!;
    assert.equal(university.tile, choices.tile);
    assert.equal(university.side, side);
    assert.equal(state.world!.step, "characters");
  }
});

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
    const error = dispatch(state, act("setupPlace", choices.player, choices.tile !== null ? { side: choices.sides[0] } : { tile: choices.tiles[choices.tiles.length - 1], ...(choices.dedicate ? { dedication: "gold" } : {}) }));
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
  assert.equal(state.buildings.filter(building => building.def === "university").length, 2);
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

test("Hanshu can place both starting villages on farmland", () => {
  const state = atKin(["hanshu"], 4);
  for (const tile of state.tiles) tile.terrain = "farmland";
  pickAll(state, ["hanshu"]);
  const first = setupChoices(state)!;
  assert.equal(first.task, "village");
  assert.ok(first.tiles.length > 0);
  const firstTile = first.tiles[0];
  assert.equal(dispatch(state, act("setupPlace", "p1", { tile: firstTile })), null);
  const second = setupChoices(state)!;
  assert.equal(second.task, "village2");
  assert.ok(second.tiles.length > 0);
  assert.ok(second.tiles.every(tile => tileDistance(firstTile, tile) === 3));
  assert.equal(dispatch(state, act("setupPlace", "p1", { tile: second.tiles[0] })), null);
  const villages = state.buildings.filter(building => building.def === "village");
  assert.equal(villages.length, 2);
  assert.ok(villages.every(building => state.tiles[building.tile].terrain === "farmland"));
  assert.equal(state.buildings.filter(building => building.def === "road").length, 3);
  assert.equal(state.armies.length, 1);
  assert.equal(setupChoices(state)!.task, "university");
  runSetup(state);
  assert.equal(state.world!.step, "characters");
});

test("other Kin do not gain Hanshu's farmland starting placement", () => {
  const state = atKin(["lumon"], 4);
  for (const tile of state.tiles) tile.terrain = "plains";
  state.tiles[0].terrain = "farmland";
  pickAll(state, ["lumon"]);
  assert.ok(!setupChoices(state)!.tiles.includes(0));
  assert.match(dispatch(state, act("setupPlace", "p1", { tile: 0 })) ?? "", /cannot place/);
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
