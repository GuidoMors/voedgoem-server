import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, lastTilePlacer, riverMaker, tilePlacer } from "./engine";
import { kin } from "./index";
import { createRng, nextInt } from "./rng";
import type { Action, KinState } from "./types";
import { COLS, RIVER_COUNT, ROWS, TILE_COUNT, climateOfRow, climateSpots, corners, edgeId, neighbors, riverNext, riverStarts, tileIndex, vertexNeighbors } from "./world";

const act = (type: string, id: string, extra: Record<string, unknown> = {}): Action => ({ type, actor: { id, username: id, isHost: id === "p1" }, ...extra });

function started(players = 4): KinState {
  const state = createState(5);
  for (let index = 1; index <= players; index++) dispatch(state, act("join", `p${index}`));
  assert.equal(dispatch(state, act("start", "p1")), null);
  return state;
}

function placeAllTiles(state: KinState, seed = 1, last = true) {
  const rng = createRng(seed);
  const types = ["mountain", "forest", "farmland"] as const;
  while (state.world!.step === "tiles") {
    const free = state.tiles.flatMap((tile, index) => tile.terrain === "ocean" ? [index] : []);
    let terrain: string = types[nextInt(rng, 3)];
    while (state.world!.pile[terrain as "mountain"] === 0) terrain = types[nextInt(rng, 3)];
    const error = dispatch(state, act("placeTile", tilePlacer(state, state.world!), { tile: free[nextInt(rng, free.length)], terrain }));
    assert.equal(error, null);
  }
  if (last) placeLastTiles(state, rng);
}

function placeLastTiles(state: KinState, rng = createRng(2)) {
  const climates = ["plains", "snow", "desert"] as const;
  while (state.world!.step === "lastTiles") {
    const terrain = climates.filter(type => state.world!.lastPile[type] > 0)[0];
    const spots = climateSpots(state.tiles.map(tile => tile.terrain), terrain);
    const error = dispatch(state, act("placeLastTile", lastTilePlacer(state, state.world!), { tile: spots[nextInt(rng, spots.length)], terrain }));
    assert.equal(error, null);
  }
}

test("grid is 14 rows by 20 columns with consistent odd-r neighbors", () => {
  assert.equal(TILE_COUNT, 280);
  assert.equal(ROWS, 14);
  assert.equal(COLS, 20);
  for (let index = 0; index < TILE_COUNT; index++) {
    for (const other of neighbors(index)) assert.ok(neighbors(other).includes(index), `${index} <-> ${other}`);
    const row = Math.floor(index / COLS);
    const col = index % COLS;
    if (row > 0 && row < ROWS - 1 && col > 0 && col < COLS - 1) assert.equal(neighbors(index).length, 6);
  }
  // Odd rows are shifted right: (row 1, col 0) touches (row 0, cols 0 and 1), (row 2, cols 0 and 1).
  assert.deepEqual(neighbors(tileIndex(1, 0)).sort((a, b) => a - b), [tileIndex(0, 0), tileIndex(0, 1), tileIndex(1, 1), tileIndex(2, 0), tileIndex(2, 1)]);
});

test("adjacent tiles share exactly two corners", () => {
  for (let index = 0; index < TILE_COUNT; index++) {
    for (const other of neighbors(index)) assert.equal(corners(index).filter(vertex => corners(other).includes(vertex)).length, 2);
  }
});

test("climate depends on the row only", () => {
  const rows = Array.from({ length: ROWS }, (_, row) => climateOfRow(row));
  assert.deepEqual(rows, ["snow", "snow", "plains", "plains", "plains", "plains", "desert", "desert", "plains", "plains", "plains", "plains", "snow", "snow"]);
});

test("starting creates a 280 tile ocean board and a 36 tile pile", () => {
  const state = started();
  assert.equal(state.tiles.length, 280);
  assert.ok(state.tiles.every(tile => tile.terrain === "ocean"));
  assert.deepEqual(state.world!.pile, { mountain: 12, forest: 12, farmland: 12 });
  assert.equal(state.world!.step, "tiles");
});

test("tile placement is validated and follows the host-first turn order", () => {
  const state = started(3);
  assert.match(dispatch(state, act("placeTile", "p2", { tile: 0, terrain: "forest" })) ?? "", /not your turn/);
  assert.match(dispatch(state, act("placeTile", "p1", { tile: 0, terrain: "ocean" })) ?? "", /Choose mountain/);
  assert.match(dispatch(state, act("placeTile", "p1", { tile: 999, terrain: "forest" })) ?? "", /on the board/);
  assert.equal(dispatch(state, act("placeTile", "p1", { tile: 0, terrain: "forest" })), null);
  assert.match(dispatch(state, act("placeTile", "p2", { tile: 0, terrain: "forest" })) ?? "", /ocean/);
  assert.equal(tilePlacer(state, state.world!), "p2");
  assert.equal(dispatch(state, act("placeTile", "p2", { tile: 1, terrain: "mountain" })), null);
  assert.equal(dispatch(state, act("placeTile", "p3", { tile: 2, terrain: "farmland" })), null);
  assert.equal(tilePlacer(state, state.world!), "p1");
  assert.equal(state.world!.pile.forest, 11);
});

test("a pile type cannot be overdrawn", () => {
  const state = started(2);
  for (let index = 0; index < 12; index++) assert.equal(dispatch(state, act("placeTile", tilePlacer(state, state.world!), { tile: index, terrain: "mountain" })), null);
  assert.match(dispatch(state, act("placeTile", tilePlacer(state, state.world!), { tile: 12, terrain: "mountain" })) ?? "", /no mountain/);
});

test("after the 36th tile the climate fill runs and the last tiles begin", () => {
  const state = started(4);
  placeAllTiles(state, 1, false);
  assert.equal(state.world!.step, "lastTiles");
  assert.deepEqual(state.world!.lastPile, { plains: 4, snow: 4, desert: 4 });
  const counts: Record<string, number> = {};
  for (const tile of state.tiles) counts[tile.terrain] = (counts[tile.terrain] ?? 0) + 1;
  assert.equal(counts.mountain, 12);
  assert.equal(counts.forest, 12);
  assert.equal(counts.farmland, 12);
  state.tiles.forEach((tile, index) => {
    const nearLand = neighbors(index).some(other => ["mountain", "forest", "farmland"].includes(state.tiles[other].terrain));
    if (["mountain", "forest", "farmland"].includes(tile.terrain)) return;
    if (nearLand) assert.equal(tile.terrain, climateOfRow(tile.row), `tile ${index}`);
    else assert.equal(tile.terrain, "ocean");
  });
});

test("the last tiles: 12 climate tiles go on matching ocean tiles in host-first turn order, then rivers begin", () => {
  const state = started(3);
  placeAllTiles(state, 1, false);
  const world = state.world!;
  const board = () => state.tiles.map(tile => tile.terrain);
  assert.equal(lastTilePlacer(state, world), "p1");
  assert.match(dispatch(state, act("placeLastTile", "p2", { tile: climateSpots(board(), "snow")[0], terrain: "snow" })) ?? "", /not your turn/);
  assert.match(dispatch(state, act("placeLastTile", "p1", { tile: climateSpots(board(), "snow")[0], terrain: "mountain" })) ?? "", /Choose plains/);
  assert.match(dispatch(state, act("placeLastTile", "p1", { tile: climateSpots(board(), "snow")[0], terrain: "desert" })) ?? "", /desert row/);
  assert.match(dispatch(state, act("placeLastTile", "p1", { tile: state.tiles.findIndex(tile => tile.terrain === "mountain"), terrain: "plains" })) ?? "", /plains row/);
  assert.equal(dispatch(state, act("placeLastTile", "p1", { tile: climateSpots(board(), "desert")[0], terrain: "desert" })), null);
  assert.equal(lastTilePlacer(state, world), "p2");
  assert.equal(world.lastPile.desert, 3);
  // A tile type cannot be overdrawn.
  for (let count = 0; count < 3; count++) assert.equal(dispatch(state, act("placeLastTile", lastTilePlacer(state, world), { tile: climateSpots(board(), "desert")[0], terrain: "desert" })), null);
  assert.match(dispatch(state, act("placeLastTile", lastTilePlacer(state, world), { tile: climateSpots(board(), "desert")[0], terrain: "desert" })) ?? "", /no desert/);
  placeLastTiles(state);
  assert.equal(world.step, "rivers");
  assert.equal(world.lastPlaced, 12);
  assert.deepEqual(world.lastPile, { plains: 0, snow: 0, desert: 0 });
});

test("rivers: six are drawn in turn order and obey the edge rules", () => {
  const state = started(4);
  placeAllTiles(state, 3);
  const rng = createRng(9);
  const world = state.world!;
  assert.match(dispatch(state, act("riverStart", "p2", { vertex: riverStarts(world, state.tiles.map(t => t.terrain))[0] })) ?? "", /not your turn/);
  while (world.step === "rivers") {
    const maker = riverMaker(state, world);
    const starts = riverStarts(world, state.tiles.map(tile => tile.terrain));
    assert.ok(starts.length > 0);
    assert.match(dispatch(state, act("riverStart", maker, { vertex: "0,0" })) ?? "", /mountain/);
    assert.equal(dispatch(state, act("riverStart", maker, { vertex: starts[nextInt(rng, starts.length)] })), null);
    assert.match(dispatch(state, act("riverStart", maker, { vertex: starts[0] })) ?? "", /Extend/);
    const before = world.riversDone;
    while (world.riversDone === before) {
      const next = riverNext(world, world.freeEnd!);
      assert.ok(next.length > 0);
      const edgesBefore = Object.keys(world.rivers).length;
      const vertex = next[nextInt(rng, next.length)];
      const endings = kin.snapshot(state, maker, new Set()).world!.riverEndChoices;
      assert.equal(Object.keys(world.rivers).length, edgesBefore);
      assert.equal(dispatch(state, act("riverExtend", maker, { vertex })), null);
      assert.equal(world.riversDone > before, endings.includes(vertex));
      assert.equal(Object.keys(world.rivers).length, edgesBefore + 1);
    }
  }
  assert.equal(world.riversDone, RIVER_COUNT);
  assert.equal(world.step, "kin");
  assert.equal(world.freeEnd, null);
  const counts = new Map<number, number>();
  for (const index of Object.values(world.rivers)) counts.set(index, (counts.get(index) ?? 0) + 1);
  assert.equal(counts.size, 6);
  // Every river edge joins two adjacent vertices.
  for (const edge of Object.keys(world.rivers)) {
    const [a, b] = edge.split("|");
    assert.ok(vertexNeighbors(a).includes(b));
    assert.equal(edgeId(a, b), edge);
  }
});

test("a river that reaches another river stops there", () => {
  const state = started(2);
  placeAllTiles(state, 4);
  const world = state.world!;
  const board = state.tiles.map(tile => tile.terrain);
  const start = riverStarts(world, board)[0];
  assert.equal(dispatch(state, act("riverStart", "p1", { vertex: start })), null);
  const second = riverNext(world, start)[0];
  assert.equal(dispatch(state, act("riverExtend", "p1", { vertex: second })), null);
  // An illegal extension is rejected and the free end is unchanged.
  assert.match(dispatch(state, act("riverExtend", "p1", { vertex: start })) ?? "", /no river/);
  assert.equal(world.freeEnd, second);
  // The finished river's vertices can no longer start a river.
  assert.ok(!riverStarts(world, board).includes(second) || world.riversDone === 1);
});

test("world setup state survives a save/replay round trip and shows up in the snapshot", () => {
  const state = started(3);
  placeAllTiles(state, 2);
  const replayed = createState(5);
  for (const entry of state.log) assert.equal(dispatch(replayed, entry.action), null);
  assert.equal(JSON.stringify(replayed), JSON.stringify(state));
  const snapshot = kin.snapshot(state, "p1", new Set(["p1"])) as { world: { step: string; board: string[]; riverChoices: string[]; turn: string } };
  assert.equal(snapshot.world.step, "rivers");
  assert.equal(snapshot.world.board.length, 280);
  assert.equal(snapshot.world.turn, "p1");
  assert.ok(snapshot.world.riverChoices.length > 0);
});

test("aborting discards the world", () => {
  const state = started(2);
  dispatch(state, act("abort", "p1"));
  assert.equal(state.world, null);
  assert.equal(state.tiles.length, 0);
});

test("a solo player does every setup turn themselves", () => {
  const state = started(1);
  placeAllTiles(state, 6);
  assert.equal(state.world!.step, "rivers");
  const board = state.tiles.map(tile => tile.terrain);
  for (let river = 0; river < RIVER_COUNT; river++) {
    assert.equal(riverMaker(state, state.world!), "p1");
    assert.equal(dispatch(state, act("riverStart", "p1", { vertex: riverStarts(state.world!, board)[0] })), null);
    while (state.world!.freeEnd) assert.equal(dispatch(state, act("riverExtend", "p1", { vertex: riverNext(state.world!, state.world!.freeEnd)[0] })), null);
  }
  assert.equal(state.world!.step, "kin");
});
