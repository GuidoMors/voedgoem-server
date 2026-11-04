import { claimStartingCards } from "./cards";
import { DEDICATIONS } from "./deepones";
import { dealCharacters, naturalOrder, settleCharacters } from "./draft";
import type { Army, Building, KinState } from "./types";
import { climateOfRow, neighbors, sideEdge, sideNeighbor, tileDistance, tileRow, TILE_COUNT, type Terrain } from "./world";

// Setup step 4.2: in natural order each player completes the starting setup of their Kin. Only the placing of buildings and armies is
// done here; the technologies and cards of a starting setup follow in later milestones.
export type SetupTask = "village" | "village2" | "worksite" | "ark" | "tree";

const TASKS: Record<string, SetupTask[]> = { hanshu: ["village", "village2"], ark: ["ark"], tree: ["tree"] };
const tasksOf = (kin: string): SetupTask[] => TASKS[kin] ?? ["village", "worksite"];

// Where a village may stand: the default is plains or snow, some Kin differ.
const VILLAGE_TERRAIN: Record<string, Terrain[]> = { hanshu: ["plains", "snow", "farmland"], wanderers: ["snow"], beastmen: ["desert"], hammers: ["mountain"], deepones: ["ocean"] };
const VILLAGE_DISTANCE = 3;
const WORKSITE_TERRAIN: readonly Terrain[] = ["farmland", "forest", "mountain"];
const CLIMATE: readonly Terrain[] = ["snow", "desert", "plains"];

const buildingId = (state: KinState) => `b${state.buildings.length + 1}`;

export function addBuilding(state: KinState, building: Omit<Building, "id">): Building {
  const placed = { id: buildingId(state), ...building };
  state.buildings.push(placed);
  return placed;
}

export function addArmy(state: KinState, owner: string, tile: number): Army {
  const next = Math.max(0, ...state.armies.map(existing => Number(existing.id.slice(1)) || 0)) + 1;
  const army = { id: `a${next}`, owner, tile, strength: 1 };
  state.armies.push(army);
  return army;
}

const occupies = (building: Building, tile: number) => building.tile === tile || building.to === tile;
export const isUnbuilt = (state: KinState, tile: number) => !state.buildings.some(building => occupies(building, tile));
const tileBuildings = (state: KinState) => state.buildings.filter(building => building.kind === "tile");

// Sides of a tile building where a worksite can go: the adjacent tile must be farmland, forest or mountain, and the side must be free.
// Deep Ones (Underwater Cult): a village on the ocean takes a worksite on any side.
export function worksiteSides(state: KinState, tile: number): number[] {
  const ocean = state.tiles[tile].terrain === "ocean" && state.buildings.some(b => b.def === "village" && b.tile === tile && b.owner && state.world?.kinPicks[b.owner] === "deepones");
  return [0, 1, 2, 3, 4, 5].filter(side => {
    const next = sideNeighbor(tile, side);
    if (next === null || (!ocean && !WORKSITE_TERRAIN.includes(state.tiles[next].terrain))) return false;
    if (state.buildings.some(b => b.kind === "tile" && b.tile === next)) return false;
    return !state.buildings.some(b => b.kind === "slice" && b.tile === tile && b.side === side);
  });
}

const touchesRiver = (state: KinState, tile: number) => [0, 1, 2, 3, 4, 5].some(side => sideEdge(tile, side) in state.world!.rivers);

// A shortest chain of land tiles from a to b, or null. Roads may not touch the ocean.
function roadPath(state: KinState, from: number, to: number, steps: number): number[] | null {
  const search = (path: number[]): number[] | null => {
    const last = path[path.length - 1];
    if (path.length === steps + 1) return last === to ? path : null;
    for (const next of neighbors(last)) {
      if (tileDistance(next, to) !== steps - path.length) continue;
      if (state.tiles[next].terrain === "ocean" && next !== to) continue;
      const found = search([...path, next]);
      if (found) return found;
    }
    return null;
  };
  return search([from]);
}

const isClimate = (terrain: Terrain) => CLIMATE.includes(terrain);

interface Spot {
  allowed: Terrain[];
  fits: (tile: number) => boolean;
  // Tried first; dropped if nothing fits.
  preferred?: (tile: number) => boolean;
}

// Tiles that can be picked: unbuilt tiles of an allowed type. When there are none an ocean tile in the right climate zone can be turned
// into the required type (02-setup.md).
function spotTiles(state: KinState, spot: Spot): number[] {
  const all = Array.from({ length: TILE_COUNT }, (_, index) => index).filter(tile => isUnbuilt(state, tile));
  for (const extra of spot.preferred ? [spot.preferred, () => true] : [() => true]) {
    const fitting = all.filter(tile => spot.fits(tile) && extra(tile));
    const direct = fitting.filter(tile => spot.allowed.includes(state.tiles[tile].terrain));
    if (direct.length > 0) return direct;
    const converted = fitting.filter(tile => state.tiles[tile].terrain === "ocean" && spot.allowed.every(terrain => !isClimate(terrain) || climateOfRow(tileRow(tile)) === terrain));
    if (converted.length > 0) return converted;
  }
  return [];
}

function convertedTerrain(state: KinState, spot: Spot, tile: number): Terrain {
  if (spot.allowed.includes(state.tiles[tile].terrain)) return state.tiles[tile].terrain;
  return isClimate(spot.allowed[0]) ? climateOfRow(tileRow(tile)) : spot.allowed[0];
}

function villageSpot(state: KinState, player: string, second: boolean): Spot {
  const kin = state.world!.kinPicks[player];
  const first = state.buildings.find(b => b.owner === player && b.def === "village");
  return {
    allowed: VILLAGE_TERRAIN[kin] ?? ["plains", "snow"],
    fits: tile => {
      if (tileBuildings(state).some(b => tileDistance(b.tile, tile) < VILLAGE_DISTANCE)) return false;
      if (kin === "syndicate" && !touchesRiver(state, tile)) return false;
      // The second Hanshu village is three tiles from the first and linked to it by roads over land.
      if (second && first) return tileDistance(first.tile, tile) === VILLAGE_DISTANCE && roadPath(state, first.tile, tile, VILLAGE_DISTANCE) !== null;
      return true;
    },
    // A village next to land can hold the worksite that follows.
    preferred: tasksOf(kin).includes("worksite") && kin !== "deepones" ? tile => [0, 1, 2, 3, 4, 5].some(side => {
      const next = sideNeighbor(tile, side);
      return next !== null && WORKSITE_TERRAIN.includes(state.tiles[next].terrain);
    }) : undefined
  };
}

const arkSpot = (state: KinState): Spot => ({ allowed: ["mountain", "forest", "farmland", "plains", "snow", "desert"], fits: tile => isUnbuilt(state, tile) });
const treeSpot = (state: KinState): Spot => ({ allowed: ["forest"], fits: tile => isUnbuilt(state, tile) });

export interface SetupChoices {
  player: string;
  task: SetupTask;
  tiles: number[];
  // Worksite: the village the worksite goes in and the sides it may take.
  tile: number | null;
  sides: number[];
  // Deep Ones: the village is dedicated to a resource.
  dedicate?: boolean;
}

export function setupTurn(state: KinState): { player: string; task: SetupTask } | null {
  const world = state.world;
  if (!world || world.step !== "setup") return null;
  for (const player of naturalOrder(state)) {
    const tasks = tasksOf(world.kinPicks[player]);
    const done = world.setup[player] ?? 0;
    if (done < tasks.length) return { player, task: tasks[done] };
  }
  return null;
}

const spotFor = (state: KinState, player: string, task: SetupTask): Spot | null =>
  task === "village" || task === "village2" ? villageSpot(state, player, task === "village2") : task === "ark" ? arkSpot(state) : task === "tree" ? treeSpot(state) : null;

export function setupChoices(state: KinState): SetupChoices | null {
  const turn = setupTurn(state);
  if (!turn) return null;
  const spot = spotFor(state, turn.player, turn.task);
  if (spot) return { ...turn, tiles: spotTiles(state, spot), tile: null, sides: [], ...(turn.task === "village" && state.world!.kinPicks[turn.player] === "deepones" ? { dedicate: true } : {}) };
  const village = state.buildings.find(b => b.owner === turn.player && b.def === "village");
  return { ...turn, tiles: [], tile: village?.tile ?? null, sides: village ? worksiteSides(state, village.tile) : [] };
}

export function validateSetup(state: KinState, actor: string, action: Record<string, unknown>): string | null {
  const choices = setupChoices(state);
  if (!choices) return "The starting setup is complete.";
  if (choices.player !== actor) return "It is not your turn.";
  if (choices.task === "worksite") return Number.isInteger(action.side) && choices.sides.includes(action.side as number) ? null : "Choose a free side of your village next to farmland, forest or a mountain.";
  if (choices.dedicate && !DEDICATIONS.includes(String(action.dedication))) return "Dedicate the village to gold, lumber, stone or food.";
  return Number.isInteger(action.tile) && choices.tiles.includes(action.tile as number) ? null : "You cannot place that building there.";
}

export function applySetup(state: KinState, actor: string, action: Record<string, unknown>) {
  const choices = setupChoices(state)!;
  const world = state.world!;
  if (choices.task === "worksite") {
    addBuilding(state, { def: "worksite", owner: actor, kind: "slice", tile: choices.tile!, side: action.side as number });
  } else {
    const tile = action.tile as number;
    const spot = spotFor(state, actor, choices.task)!;
    state.tiles[tile].terrain = convertedTerrain(state, spot, tile);
    if (choices.task === "ark") {
      addBuilding(state, { def: "the-ark", owner: actor, kind: "center", tile });
      // The worksite of the Ark goes on the ark board.
      addBuilding(state, { def: "worksite", owner: actor, kind: "slice", tile: -1, side: 0 });
      addArmy(state, actor, tile);
    } else if (choices.task === "tree") {
      addBuilding(state, { def: "the-great-tree", owner: actor, kind: "tile", tile });
      addArmy(state, actor, tile);
    } else {
      const first = state.buildings.find(b => b.owner === actor && b.def === "village");
      addBuilding(state, { def: "village", owner: actor, kind: "tile", tile, ...(choices.dedicate ? { dedication: String(action.dedication) } : {}) });
      if (!first) addArmy(state, actor, tile);
      else {
        const path = roadPath(state, first.tile, tile, VILLAGE_DISTANCE)!;
        for (let step = 0; step < path.length - 1; step++) addBuilding(state, { def: "road", owner: null, kind: "cross", tile: path[step], to: path[step + 1] });
      }
    }
  }
  world.setup[actor] = (world.setup[actor] ?? 0) + 1;
  settleSetup(state);
}

// A step nobody can do is skipped; when every player is done the character draft begins.
export function settleSetup(state: KinState) {
  const world = state.world!;
  for (const player of state.order) {
    if (world.claimed.includes(player)) continue;
    world.claimed.push(player);
    claimStartingCards(state, player);
  }
  for (;;) {
    const choices = setupChoices(state);
    if (!choices) break;
    if (choices.tiles.length > 0 || choices.sides.length > 0) return;
    world.setup[choices.player] = (world.setup[choices.player] ?? 0) + 1;
  }
  world.step = "characters";
  dealCharacters(state);
  settleCharacters(state);
}
