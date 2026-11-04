import { claimStartingCards } from "./cards";
import { START_SETUPS, type StartingBuilding } from "./cards.data";
import { buildingById } from "./buildings.data";
import { harborWaterAccess } from "./buildings";
import { DEDICATIONS } from "./deepones";
import { dealCharacters, draftOrder, settleCharacters } from "./draft";
import type { Army, Building, KinState } from "./types";
import { climateOfRow, neighbors, sideEdge, sideNeighbor, tileDistance, tileRow, TILE_COUNT, type Terrain } from "./world";

const tasksOf = (kin: string) => {
  const setup = START_SETUPS[kin];
  if (!setup) throw new Error(`Missing starting setup for Kin ${kin}. Regenerate the rulebook data.`);
  return setup.buildings;
};
const CLIMATE: readonly Terrain[] = ["snow", "desert", "plains"];

const buildingId = (state: KinState) => `b${Math.max(0, ...state.buildings.map(building => Number(building.id.slice(1)) || 0)) + 1}`;

export function addBuilding(state: KinState, building: Omit<Building, "id">): Building {
  const placed = { id: buildingId(state), ...building };
  state.buildings.push(placed);
  return placed;
}

export function addArmy(state: KinState, owner: string, tile: number, strength = 1): Army {
  const next = Math.max(0, ...state.armies.map(existing => Number(existing.id.slice(1)) || 0)) + 1;
  const army = { id: `a${next}`, owner, tile, strength };
  state.armies.push(army);
  return army;
}

const occupies = (building: Building, tile: number) => building.tile === tile || building.to === tile;
export const isUnbuilt = (state: KinState, tile: number) => !state.buildings.some(building => occupies(building, tile));
const tileBuildings = (state: KinState) => state.buildings.filter(building => building.kind === "tile");

function setupSides(state: KinState, tile: number, rule: StartingBuilding): number[] {
  return Array.from({ length: tile === -1 ? 12 : 6 }, (_, side) => side).filter(side => {
    if (tile >= 0 && rule.building === "harbor" && (!harborWaterAccess(state, tile, side) || state.buildings.some(building => building.tile === tile && building.def === "harbor"))) return false;
    if (tile >= 0 && (rule.building === "worksite" || rule.adjacentTerrain.length > 0)) {
      const next = sideNeighbor(tile, side);
      if (next === null || (rule.adjacentTerrain.length > 0 && !rule.adjacentTerrain.includes(state.tiles[next].terrain))) return false;
      if (state.buildings.some(b => b.kind === "tile" && b.tile === next)) return false;
    }
    return !state.buildings.some(b => b.kind === "slice" && b.tile === tile && b.side === side);
  });
}

function buildingForStep(state: KinState, player: string, step: string): Building | undefined {
  const placed = state.world!.setupBuildings?.[player];
  if (placed) return state.buildings.find(building => building.id === placed[step]);
  // Older saves identify setup buildings only by their order within each blueprint.
  const tasks = tasksOf(state.world!.kinPicks[player]);
  const index = tasks.findIndex(task => task.step === step);
  if (index < 0) throw new Error(`Unknown starting setup step ${step}.`);
  const building = tasks[index].building;
  const occurrence = tasks.slice(0, index).filter(task => task.building === building).length;
  return state.buildings.filter(entry => entry.owner === player && entry.def === building)[occurrence];
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

function spotFor(state: KinState, player: string, rule: StartingBuilding): Spot | null {
  if (rule.location !== "world") return null;
  const kin = state.world!.kinPicks[player];
  const roadTarget = rule.roadTo ? buildingForStep(state, player, rule.roadTo) : undefined;
  const slice = tasksOf(kin).find(task => task.location === rule.step && task.adjacentTerrain.length > 0);
  return {
    allowed: rule.terrain,
    fits: tile => {
      if (tileBuildings(state).some(b => tileDistance(b.tile, tile) < rule.minDistance)) return false;
      if (rule.river && !touchesRiver(state, tile)) return false;
      if (rule.roadTo) return !!roadTarget && tileDistance(roadTarget.tile, tile) === rule.roadLength && roadPath(state, roadTarget.tile, tile, rule.roadLength) !== null;
      return true;
    },
    preferred: slice ? tile => [0, 1, 2, 3, 4, 5].some(side => {
      const next = sideNeighbor(tile, side);
      return next !== null && slice.adjacentTerrain.includes(state.tiles[next].terrain);
    }) : undefined
  };
}

export interface SetupChoices {
  player: string;
  task: string;
  building: string;
  prompt: string;
  tiles: number[];
  // Slice placements: the host tile (-1 for the Ark board) and its available sides.
  tile: number | null;
  sides: number[];
  dedicate?: boolean;
}

export function setupTurn(state: KinState): { player: string; task: string } | null {
  const world = state.world;
  if (!world || world.step !== "setup") return null;
  for (const player of draftOrder(state)) {
    const tasks = tasksOf(world.kinPicks[player]);
    let done = world.setup[player] ?? 0;
    while (done < tasks.length && buildingForStep(state, player, tasks[done].step)) done++;
    if (done < tasks.length) return { player, task: tasks[done].step };
  }
  return null;
}

const ruleFor = (state: KinState, player: string, task: string) => {
  const rule = tasksOf(state.world!.kinPicks[player]).find(rule => rule.step === task);
  if (!rule) throw new Error(`Missing starting setup rule ${task}.`);
  return rule;
};

function setupPrompt(rule: StartingBuilding): string {
  const name = buildingById(rule.building)!.name;
  if (rule.location !== "world") return `Your turn: click a highlighted slice ${rule.location === "ark-board" ? "on the Ark board " : ""}to place your ${name}.${rule.adjacentTerrain.length ? ` It must face ${rule.adjacentTerrain.join(", ")}.` : ""}${rule.building === "harbor" && rule.location !== "ark-board" ? " It must be adjacent to a river or ocean." : ""}`;
  const constraints = [
    `on ${rule.terrain.join(", ")}`,
    ...(rule.river ? ["next to a river"] : []),
    ...(rule.minDistance ? [`at least ${rule.minDistance} tiles from other tile buildings`] : []),
    ...(rule.roadTo ? [`exactly ${rule.roadLength} tiles from ${rule.roadTo}, connected by roads`] : [])
  ];
  return `Your turn: click a highlighted tile to place your ${name} ${constraints.join("; ")}.`;
}

export function setupChoices(state: KinState): SetupChoices | null {
  const turn = setupTurn(state);
  if (!turn) return null;
  const rule = ruleFor(state, turn.player, turn.task);
  const info = { ...turn, building: rule.building, prompt: setupPrompt(rule) };
  const spot = spotFor(state, turn.player, rule);
  if (spot) return { ...info, tiles: spotTiles(state, spot), tile: null, sides: [], ...(rule.dedication ? { dedicate: true } : {}) };
  const host = rule.location === "ark-board"
    ? state.buildings.find(building => building.owner === turn.player && building.def === "the-ark")
    : buildingForStep(state, turn.player, rule.location);
  const tile = host ? (rule.location === "ark-board" ? -1 : host.tile) : null;
  return { ...info, tiles: [], tile, sides: tile === null ? [] : setupSides(state, tile, rule) };
}

export function validateSetup(state: KinState, actor: string, action: Record<string, unknown>): string | null {
  const choices = setupChoices(state);
  if (!choices) return "The starting setup is complete.";
  if (choices.player !== actor) return "It is not your turn.";
  if (choices.tile !== null) return Number.isInteger(action.side) && choices.sides.includes(action.side as number) ? null : `Choose a highlighted free slice for your ${buildingById(choices.building)!.name}.`;
  if (choices.dedicate && !DEDICATIONS.includes(String(action.dedication))) return "Dedicate the village to gold, lumber, stone or food.";
  return Number.isInteger(action.tile) && choices.tiles.includes(action.tile as number) ? null : "You cannot place that building there.";
}

export function applySetup(state: KinState, actor: string, action: Record<string, unknown>) {
  const choices = setupChoices(state)!;
  placeSetup(state, actor, choices, action);
  settleSetup(state);
}

function placeSetup(state: KinState, actor: string, choices: SetupChoices, action: Record<string, unknown>) {
  const world = state.world!;
  const rule = ruleFor(state, actor, choices.task);
  let placed: Building;
  if (choices.tile !== null) {
    placed = addBuilding(state, { def: rule.building, owner: actor, kind: "slice", tile: choices.tile, side: action.side as number });
  } else {
    const tile = action.tile as number;
    const spot = spotFor(state, actor, rule)!;
    state.tiles[tile].terrain = convertedTerrain(state, spot, tile);
    const kind = buildingById(rule.building)!.kind;
    placed = addBuilding(state, { def: rule.building, owner: actor, kind, tile, ...(choices.dedicate ? { dedication: String(action.dedication) } : {}) });
    if (rule.roadTo) {
      const target = buildingForStep(state, actor, rule.roadTo)!;
      const path = roadPath(state, target.tile, tile, rule.roadLength)!;
      for (let step = 0; step < path.length - 1; step++) addBuilding(state, { def: "road", owner: null, kind: "cross", tile: path[step], to: path[step + 1] });
    }
    for (const army of START_SETUPS[world.kinPicks[actor]].armies.filter(army => army.location === rule.step))
      for (let count = 0; count < army.count; count++) addArmy(state, actor, tile, army.strength);
  }
  const placements = world.setupBuildings ??= {};
  (placements[actor] ??= {})[rule.step] = placed.id;
  world.setup[actor] = tasksOf(world.kinPicks[actor]).findIndex(task => task.step === choices.task) + 1;
}

// A step nobody can do is skipped; when every player is done the character draft begins.
export function settleSetup(state: KinState) {
  const world = state.world!;
  for (const player of draftOrder(state)) {
    if (!world.setupBuildings?.[player]) {
      const placements: Record<string, string> = {};
      for (const task of tasksOf(world.kinPicks[player])) {
        const building = buildingForStep(state, player, task.step);
        if (building) placements[task.step] = building.id;
      }
      (world.setupBuildings ??= {})[player] = placements;
    }
    if (world.claimed.includes(player)) continue;
    world.claimed.push(player);
    claimStartingCards(state, player);
  }
  for (;;) {
    const choices = setupChoices(state);
    if (!choices) break;
    if (choices.tiles.length > 0 || choices.sides.length > 0) {
      if (ruleFor(state, choices.player, choices.task).placement === "choose") return;
      placeSetup(state, choices.player, choices, choices.tile === null ? { tile: choices.tiles[0] } : { side: choices.sides[0] });
      continue;
    }
    world.setup[choices.player] = tasksOf(world.kinPicks[choices.player]).findIndex(task => task.step === choices.task) + 1;
  }
  world.step = "characters";
  dealCharacters(state);
  settleCharacters(state);
}
