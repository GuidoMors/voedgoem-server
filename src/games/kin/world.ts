// World board geometry and setup rules (rulebook 02-setup.md).
//
// Convention: 14 rows x 20 columns of pointy-top hexes, row 0 at the top, odd rows shifted half a hex to the right ("odd-r").
// Tiles are identified by their index row * COLS + col.
// Vertices are identified by integer coordinates "X,Y": a tile's center is X = 2*col + (row & 1), Y = 3*row, and its six corners are
// (X, Y-2), (X+1, Y-1), (X+1, Y+1), (X, Y+2), (X-1, Y+1), (X-1, Y-1). The same coordinates are used by the client to draw the board.
// Edges are identified by their two vertex ids joined with "|", the lexicographically smaller first.

export const ROWS = 14;
export const COLS = 20;
export const TILE_COUNT = ROWS * COLS;
export const RIVER_COUNT = 6;

export type Terrain = "ocean" | "mountain" | "forest" | "farmland" | "snow" | "desert" | "plains";
export type LandTerrain = "mountain" | "forest" | "farmland";
export const LAND: readonly LandTerrain[] = ["mountain", "forest", "farmland"];
export const PILE_SIZE = 12;
export type ClimateTerrain = "plains" | "snow" | "desert";
export const CLIMATES: readonly ClimateTerrain[] = ["plains", "snow", "desert"];
export const LAST_PILE_SIZE = 4;

export type WorldStep = "tiles" | "lastTiles" | "rivers" | "kin" | "setup" | "characters" | "done";

export interface WorldState {
  step: WorldStep;
  pile: Record<LandTerrain, number>;
  // Step 3 (the last tiles): the climate tiles left in the pile, and how many have been placed so far.
  lastPile: Record<ClimateTerrain, number>;
  lastPlaced: number;
  // Edge id -> index of the river it belongs to.
  rivers: Record<string, number>;
  // Number of finished rivers.
  riversDone: number;
  // The river being drawn right now, identified by its free end vertex.
  freeEnd: string | null;
  // Player id -> id of the Kin they drafted (see kins.ts).
  kinPicks: Record<string, string>;
  // Character ids in the order they were claimed during the draft; "" marks a turn that was skipped.
  charPicks: string[];
  // Player id -> number of starting setup steps completed (see setup.ts).
  setup: Record<string, number>;
  // Players whose Kin cards (technologies, faction effects, ...) have been claimed in the starting setup.
  claimed: string[];
}

export function createWorld(): WorldState {
  return { step: "tiles", pile: { mountain: PILE_SIZE, forest: PILE_SIZE, farmland: PILE_SIZE }, lastPile: { plains: LAST_PILE_SIZE, snow: LAST_PILE_SIZE, desert: LAST_PILE_SIZE }, lastPlaced: 0, rivers: {}, riversDone: 0, freeEnd: null, kinPicks: {}, charPicks: [], setup: {}, claimed: [] };
}

export const tileIndex = (row: number, col: number) => row * COLS + col;
export const tileRow = (index: number) => Math.floor(index / COLS);
export const tileCol = (index: number) => index % COLS;

export function pileTotal(world: WorldState): number {
  return LAND.reduce((sum, type) => sum + world.pile[type], 0);
}

export const lastPileTotal = (world: WorldState): number => CLIMATES.reduce((sum, type) => sum + world.lastPile[type], 0);

// Ocean tiles where a tile of this climate may go: the ocean tile's own row decides its climate.
export const climateSpots = (board: Terrain[], climate: ClimateTerrain): number[] =>
  board.flatMap((terrain, index) => terrain === "ocean" && climateOfRow(tileRow(index)) === climate ? [index] : []);

const EVEN_ROW_NEIGHBORS: [number, number][] = [[-1, -1], [0, -1], [-1, 0], [1, 0], [-1, 1], [0, 1]];
const ODD_ROW_NEIGHBORS: [number, number][] = [[0, -1], [1, -1], [-1, 0], [1, 0], [0, 1], [1, 1]];

export function neighbors(index: number): number[] {
  const row = tileRow(index);
  const col = tileCol(index);
  const result: number[] = [];
  for (const [dc, dr] of row % 2 === 0 ? EVEN_ROW_NEIGHBORS : ODD_ROW_NEIGHBORS) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) result.push(tileIndex(r, c));
  }
  return result;
}

const vertexId = (x: number, y: number) => `${x},${y}`;
export const edgeId = (a: string, b: string) => a < b ? `${a}|${b}` : `${b}|${a}`;

export function corners(index: number): string[] {
  const x = 2 * tileCol(index) + (tileRow(index) & 1);
  const y = 3 * tileRow(index);
  return [vertexId(x, y - 2), vertexId(x + 1, y - 1), vertexId(x + 1, y + 1), vertexId(x, y + 2), vertexId(x - 1, y + 1), vertexId(x - 1, y - 1)];
}

interface Graph {
  // Vertex -> tiles it is a corner of.
  vertexTiles: Map<string, number[]>;
  // Vertex -> vertices one edge away.
  vertexLinks: Map<string, string[]>;
}

let graph: Graph | null = null;

function getGraph(): Graph {
  if (graph) return graph;
  const vertexTiles = new Map<string, number[]>();
  const links = new Map<string, Set<string>>();
  for (let index = 0; index < TILE_COUNT; index++) {
    const ring = corners(index);
    ring.forEach((vertex, position) => {
      if (!vertexTiles.has(vertex)) vertexTiles.set(vertex, []);
      vertexTiles.get(vertex)!.push(index);
      if (!links.has(vertex)) links.set(vertex, new Set());
      links.get(vertex)!.add(ring[(position + 1) % 6]);
      links.get(vertex)!.add(ring[(position + 5) % 6]);
    });
  }
  graph = { vertexTiles, vertexLinks: new Map([...links].map(([vertex, set]) => [vertex, [...set].sort()])) };
  return graph;
}

export const isVertex = (vertex: string) => getGraph().vertexTiles.has(vertex);
export const vertexNeighbors = (vertex: string) => getGraph().vertexLinks.get(vertex) ?? [];
export const vertexTiles = (vertex: string) => getGraph().vertexTiles.get(vertex) ?? [];

// Climate of a filled ocean tile depends only on its row: snow in the top 2 and bottom 2 rows, desert in the middle 2, plains elsewhere.
export function climateOfRow(row: number): Terrain {
  if (row < 2 || row >= ROWS - 2) return "snow";
  if (row === ROWS / 2 - 1 || row === ROWS / 2) return "desert";
  return "plains";
}

const isLand = (terrain: Terrain) => terrain === "mountain" || terrain === "forest" || terrain === "farmland";

// Step 2: every ocean tile next to a land tile becomes a climate tile.
export function fillClimate(board: Terrain[]) {
  const changed: number[] = [];
  for (let index = 0; index < TILE_COUNT; index++) {
    if (board[index] === "ocean" && neighbors(index).some(other => isLand(board[other]))) changed.push(index);
  }
  for (const index of changed) board[index] = climateOfRow(tileRow(index));
}

export const vertexHasRiver = (world: WorldState, vertex: string) => vertexNeighbors(vertex).some(other => edgeId(vertex, other) in world.rivers);

// Vertices where a new river may start: a corner of a mountain, not already on a river.
export function riverStarts(world: WorldState, board: Terrain[]): string[] {
  const result: string[] = [];
  for (const vertex of getGraph().vertexTiles.keys()) {
    if (vertexTiles(vertex).some(tile => board[tile] === "mountain") && !vertexHasRiver(world, vertex) && riverNext(world, vertex).length > 0) result.push(vertex);
  }
  return result.sort();
}

// Vertices the river can be extended to from its free end: any adjacent vertex over an edge without a river.
export function riverNext(world: WorldState, freeEnd: string): string[] {
  return vertexNeighbors(freeEnd).filter(other => !(edgeId(freeEnd, other) in world.rivers));
}

// A river stops when its free end touches a river or an ocean tile, or when it cannot continue.
export function riverShouldStop(world: WorldState, board: Terrain[], freeEnd: string): boolean {
  return vertexHasRiverBesides(world, freeEnd) || vertexTiles(freeEnd).some(tile => board[tile] === "ocean") || riverNext(world, freeEnd).length === 0;
}

// The free end always touches the edge just drawn; it only counts as touching a river when it has another river edge.
function vertexHasRiverBesides(world: WorldState, vertex: string): boolean {
  return vertexNeighbors(vertex).filter(other => edgeId(vertex, other) in world.rivers).length > 1;
}

// Side s of a tile is the edge from corner s to corner s + 1: 0 north-east, 1 east, 2 south-east, 3 south-west, 4 west, 5 north-west.
export const sideCorners = (tile: number, side: number): [string, string] => {
  const all = corners(tile);
  return [all[side], all[(side + 1) % 6]];
};

export const sideEdge = (tile: number, side: number) => edgeId(...sideCorners(tile, side));

// The tile on the other side of the given side, or null at the border of the board.
export function sideNeighbor(tile: number, side: number): number | null {
  const [a, b] = sideCorners(tile, side);
  const other = new Set(vertexTiles(b));
  return vertexTiles(a).find(candidate => candidate !== tile && other.has(candidate)) ?? null;
}

// Number of steps between two tiles.
export function tileDistance(a: number, b: number): number {
  const cube = (tile: number) => {
    const row = tileRow(tile);
    const x = tileCol(tile) - (row - (row & 1)) / 2;
    return [x, -x - row, row];
  };
  const [ax, ay, az] = cube(a);
  const [bx, by, bz] = cube(b);
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}
