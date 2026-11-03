import { buildingById } from "./buildings.data";
import { addBuilding } from "./setup";
import { cardById } from "./cards.data";
import { hasCard } from "./cards";
import { hasChar } from "./neutrals";
import { riverRoamTiles, tradegoodsProduction } from "./streams";
import { GREAT_TREE, seedlingFree } from "./tree";
import type { Building, KinState } from "./types";
import { TILE_COUNT, edgeId, neighbors, sideEdge, sideNeighbor, tileDistance, vertexNeighbors, sideCorners, type Terrain } from "./world";

// Where a building goes. Tile and center buildings: `tile`. Slice and edge buildings: `tile` and `side`. Cross buildings: `tile` and `to`.
export interface Placement {
  tile: number;
  side?: number;
  to?: number;
}

// "2 lumber, 1 stone" is { lumber: 2, stone: 1 }; "2 basic resources" can be any mix of gold, lumber, stone and food.
export interface Cost {
  resources: Record<string, number>;
  basic: number;
}

export const BASIC_RESOURCES = ["gold", "lumber", "stone", "food"];
const SIDES = [0, 1, 2, 3, 4, 5];

function parseCost(text: string): Cost {
  const cost: Cost = { resources: {}, basic: 0 };
  for (const [, amount, what] of text.matchAll(/(\d+) (basic resources|\w+)/g)) {
    if (what === "basic resources") cost.basic += Number(amount);
    else cost.resources[what === "relics" ? "relic" : what] = (cost.resources[what === "relics" ? "relic" : what] ?? 0) + Number(amount);
  }
  return cost;
}

export interface BlueprintInfo {
  def: string;
  name: string;
  kind: Building["kind"];
  cost: Cost;
  power: number;
  garrison: number;
  // Faction buildings whose placement rules are not implemented yet: they cannot be built.
  faction: boolean;
}

// Faction buildings that follow the rules in their own blueprint, so they can be built.
export const IMPLEMENTED_FACTION_BUILDINGS = ["grand-observatory", "daimyo-castle", "vault", "divine-sanctum", "warband-camp", "brewery", "guild-hall", "sleeping-city"];

export function blueprintInfo(def: string): BlueprintInfo | null {
  const card = cardById(def);
  const data = buildingById(def);
  if (card?.kind !== "blueprint" || !card.stats || !data) return null;
  return { def, name: card.name, kind: data.kind, cost: parseCost(card.stats.cost), power: card.stats.buildPower ?? 0, garrison: data.garrison, faction: data.kin !== null && !IMPLEMENTED_FACTION_BUILDINGS.includes(def) };
}

// A blueprint can be built from your court or from the building board.
export const hasBlueprint = (state: KinState, player: string, def: string) =>
  state.items.some(item => item.def === def && (item.zone === `court:${player}` || item.zone === "board:building"));

const tileBuildingAt = (state: KinState, tile: number) => state.buildings.find(building => building.kind === "tile" && building.tile === tile);
const centerBuildingAt = (state: KinState, tile: number) => state.buildings.find(building => building.kind === "center" && building.tile === tile);
const slicesAt = (state: KinState, tile: number) => state.buildings.filter(building => building.kind === "slice" && building.tile === tile);

// The terrain a tile counts as. A tile building covers the tile, so it no longer counts as its tile type.
const terrainOf = (state: KinState, tile: number): Terrain | null => tileBuildingAt(state, tile) ? null : state.tiles[tile].terrain;
const isOcean = (state: KinState, tile: number) => terrainOf(state, tile) === "ocean";
const validTile = (tile: unknown): tile is number => Number.isInteger(tile) && (tile as number) >= 0 && (tile as number) < TILE_COUNT;

// Jahatri, Depthdelver: a Sleeping City costs 1 less gold. The cost of a blueprint for this player.
export function costOf(state: KinState, player: string, def: string): Cost | null {
  const cost = blueprintInfo(def)?.cost;
  if (!cost) return null;
  if (def !== "sleeping-city" || !hasChar(state, player, "jahatri")) return cost;
  return { ...cost, resources: { ...cost.resources, gold: Math.max(0, (cost.resources.gold ?? 0) - 1) } };
}

// Desert Dwellers and Mountain Folk treat their terrain as plains for building conditions. Woodkin only adds forest for villages.
const buildTerrain = (state: KinState, player: string, tile: number): Terrain => {
  const terrain = state.tiles[tile].terrain;
  return (terrain === "desert" && hasCard(state, player, "desert-dwellers")) || (terrain === "mountain" && hasCard(state, player, "mountain-folk")) ? "plains" : terrain;
};

// The Great Tree and Seedling Villages (Children of the Great Tree): a village on a forest connected to your Great Tree is free.
export const freeBuild = (state: KinState, player: string, def: string, place?: Placement): boolean =>
  def === "village" && !!place && hasCard(state, player, "seedling-villages") && seedlingFree(state, player, place.tile);

// Breweries (Hammers) a player has on the world board.
export const breweries = (state: KinState, player: string) =>
  state.buildings.filter(building => building.def === "brewery" && building.owner === player && building.tile >= 0).length;

// Every tile a building touches. Slice and edge buildings also touch the tile on the other side of their edge, cross buildings both tiles.
export function footprint(building: Building): number[] {
  if (building.tile < 0) return [];
  if (building.to !== undefined) return [building.tile, building.to];
  if (building.side !== undefined && (building.kind === "slice" || building.kind === "edge")) {
    const other = sideNeighbor(building.tile, building.side);
    return other === null ? [building.tile] : [building.tile, other];
  }
  return [building.tile];
}

// A tile building and a center building each take the whole tile, and cannot be built on ruins.
export const slotFree = (state: KinState, tile: number) =>
  !tileBuildingAt(state, tile) && !centerBuildingAt(state, tile) && !(state.blocks ?? []).some(block => block.tile === tile && block.kind === "ruins");

export const sideBetween = (from: number, to: number): number | null => SIDES.find(side => sideNeighbor(from, side) === to) ?? null;

export const roadBetween = (state: KinState, a: number, b: number) =>
  state.buildings.some(building => building.def === "road" && building.kind === "cross" && ((building.tile === a && building.to === b) || (building.tile === b && building.to === a)));

// The Wall on the edge between two adjacent tiles.
export function wallAcross(state: KinState, from: number, to: number): Building | null {
  const side = sideBetween(from, to);
  if (side === null) return null;
  const edge = sideEdge(from, side);
  return state.buildings.find(building => building.kind === "edge" && building.def === "wall" && building.side !== undefined && sideEdge(building.tile, building.side) === edge) ?? null;
}

// A Wall stops Moving and Battling across it, unless you own it and a road crosses it too.
export function wallBlocks(state: KinState, player: string, from: number, to: number): boolean {
  const wall = wallAcross(state, from, to);
  return !!wall && !(wall.owner === player && roadBetween(state, from, to));
}

// Edges next to the edge a slice building is attached to, and that edge itself.
function riverNear(state: KinState, tile: number, side: number): boolean {
  const rivers = state.world?.rivers ?? {};
  return sideCorners(tile, side).some(vertex => vertexNeighbors(vertex).some(other => edgeId(vertex, other) in rivers));
}

// Build: "on a tile with an army, or on a tile adjacent to another building". Roads belong to nobody but connect to your buildings.
function reachTiles(state: KinState, player: string): Set<number> {
  const linked = new Set(state.buildings.filter(building => building.owner === player).flatMap(footprint));
  const roads = state.buildings.filter(building => building.def === "road");
  const used = new Set<string>();
  for (let changed = true; changed;) {
    changed = false;
    for (const road of roads) {
      const tiles = footprint(road);
      if (used.has(road.id) || !tiles.some(tile => linked.has(tile) || neighbors(tile).some(next => linked.has(next)))) continue;
      used.add(road.id);
      for (const tile of tiles) linked.add(tile);
      changed = true;
    }
  }
  const reach = new Set(linked);
  for (const tile of linked) for (const next of neighbors(tile)) reach.add(next);
  for (const army of state.armies) if (army.owner === player && army.tile >= 0) reach.add(army.tile);
  return reach;
}

const REACH_ERROR = "You can only build on a tile with one of your armies, or next to one of your buildings.";

// The Eternal Ark (Archive Ark): the ark board is "tile" -1 and has 2 tiles (sides 0 and 1) where any slice building can be built,
// whatever its Building Conditions say. It exists as long as the Ark stands.
export const ARK_BOARD = -1;
export const ARK_BOARD_TILES = [0, 1];
export const arkOf = (state: KinState, player: string) => state.buildings.find(building => building.def === "the-ark" && building.owner === player && building.tile >= 0);
export const arkBoardOf = (state: KinState, ark: Building) => state.buildings.filter(building => building.tile === ARK_BOARD && building.owner === ark.owner);

function arkBoardError(state: KinState, player: string, info: BlueprintInfo, place: Placement): string | null {
  if (!arkOf(state, player) || !hasCard(state, player, "the-eternal-ark")) return "You have no ark board.";
  if (info.kind !== "slice") return "Only slice buildings can be built on the ark board.";
  if (!ARK_BOARD_TILES.includes(place.side as number)) return "Choose one of the 2 tiles of the ark board.";
  return arkBoardOf(state, arkOf(state, player)!).some(building => building.side === place.side) ? "That tile of the ark board is already built." : null;
}

// Why the building cannot be placed there, or null. Every building condition of 06-buildings.md is checked here.
export function placementError(state: KinState, player: string, def: string, place: Placement, known?: Set<number>): string | null {
  const info = blueprintInfo(def);
  if (!info) return "That is not a building.";
  if (!hasBlueprint(state, player, def)) return `You do not have the ${info.name} blueprint.`;
  if (info.faction) return `The ${info.name} is placed by the rules of its Kin.`;
  if (place.tile === ARK_BOARD) return arkBoardError(state, player, info, place);
  if (!validTile(place.tile)) return "Choose a tile.";
  const tile = place.tile;
  const own = (building: Building | undefined) => !!building && building.owner === player;
  const reachable = known ?? reachTiles(state, player);
  const reach = () => reachable.has(tile) ? null : REACH_ERROR;

  if (info.kind === "tile" || info.kind === "center") {
    if (def === "city") return own(tileBuildingAt(state, tile)) && tileBuildingAt(state, tile)!.def === "village" ? null : "A City is built on top of one of your villages.";
    if (!slotFree(state, tile)) return "That tile is already built.";
    const terrain = buildTerrain(state, player, tile);
    if (def === "village") {
      // Underwater Cult (Deep Ones): villages only on ocean.
      if (hasCard(state, player, "underwater-cult")) {
        if (terrain !== "ocean") return "With the Underwater Cult a Village can only be built on ocean.";
      } else {
      // Expansionists (Hanshu): a village may also be built on farmland.
      const farmland = terrain === "farmland" && hasCard(state, player, "expansionists");
      // Woodkin (Great Tree): a village may also be built on forest.
      const woodkin = terrain === "forest" && hasCard(state, player, "woodkin");
      if (terrain !== "plains" && terrain !== "snow" && !farmland && !woodkin) return "A Village is built on plains or snow.";
      }
      if (state.buildings.some(building => building.kind === "tile" && building.tile >= 0 && tileDistance(building.tile, tile) < 3)) return "A Village needs a distance of at least 3 tiles from any other tile building.";
    } else if (def === "sleeping-city") {
      if (terrain !== "ocean") return "A Sleeping City must be built on an ocean tile.";
    } else if (terrain === "ocean") return `A ${info.name} must not be built on ocean.`;
    else if (def === "vault") {
      if (terrain !== "snow") return "A Vault must be built on snow.";
      // A Vault costs 1 army limit: there must be room for it.
      if (state.armies.filter(army => army.owner === player).length >= armyLimit(state, player)) return "A Vault costs 1 army limit: you have no army limit to spare.";
    }
    else if (def === "warband-camp" && state.tiles[tile].terrain !== "desert") return "A Warband Camp must be built on a desert.";
    else if (def === "daimyo-castle" && state.buildings.some(building => building.def === def && building.tile >= 0 && tileDistance(building.tile, tile) <= 3)) return "A Daimyo Castle cannot be built within 3 tiles of another Daimyo Castle.";
    // River Roamers (Syndicate): a village may be built along a river that one of your villages is on, without army or building next to it.
    if (def === "village" && riverRoamTiles(state, player).has(tile)) return null;
    return reach();
  }

  if (info.kind === "slice") {
    const host = tileBuildingAt(state, tile);
    if (!own(host)) return `A ${info.name} is built inside one of your tile buildings.`;
    const side = place.side;
    if (!Number.isInteger(side) || side! < 0 || side! > 5) return "Choose a side of the tile building.";
    const adjacent = sideNeighbor(tile, side!);
    if (adjacent === null) return "That side lies on the border of the world.";
    if (slicesAt(state, tile).some(slice => slice.side === side)) return "That side of the tile building is already built.";
    const here = slicesAt(state, tile);
    // The Great Tree: Mage Colleges only, any number of them.
    if (host!.def === GREAT_TREE) return def === "mage-college" ? null : `Only Mage Colleges can be built inside the ${buildingById(GREAT_TREE)!.name}.`;
    switch (def) {
      case "worksite": {
        // Underwater Cult (Deep Ones): in a village or city on ocean the adjacent tile does not matter.
        if (state.tiles[tile].terrain === "ocean" && hasCard(state, player, "underwater-cult")) return null;
        const terrain = terrainOf(state, adjacent);
        // Rice Fields (Hanshu): a worksite may also be built next to plains.
        if (terrain === "plains" && hasCard(state, player, "rice-fields")) return null;
        return terrain === "farmland" || terrain === "forest" || terrain === "mountain" ? null : "The adjacent tile of a Worksite must be farmland, forest or a mountain.";
      }
      case "barracks": {
        const terrain = buildTerrain(state, player, tile);
        return terrain === "plains" || terrain === "snow" ? null : "A Barracks is built on plains or snow.";
      }
      case "market":
        // Open Markets (Lumon): no river is needed.
        if (!riverNear(state, tile, side!) && !hasCard(state, player, "open-markets")) return "An adjacent edge of a Market must be a river.";
        return here.some(slice => slice.def === "market") ? "There is only one Market per tile building." : null;
      case "brewery":
        if (!riverNear(state, tile, side!)) return "An adjacent edge of a Brewery must be a river.";
        return here.some(slice => slice.def === "brewery") ? "There is only one Brewery per tile building." : null;
      case "divine-sanctum":
        return state.buildings.some(building => building.def === def) ? `There is only one ${info.name} per game.` : null;
      case "harbor":
        if (!isOcean(state, adjacent) && !riverNear(state, tile, side!)) return "A Harbor needs an adjacent ocean tile or an adjacent river.";
        return here.some(slice => slice.def === "harbor") ? "There is only one Harbor per tile building." : null;
      case "grand-observatory":
        return state.buildings.some(building => building.def === def) ? `There is only one ${info.name} per game.` : host!.def === "city" ? null : `A ${info.name} must be built in a city.`;
      case "university":
      case "mage-college":
      case "guild-hall":
        if (host!.def !== "city") return `A ${info.name} must be built in a city.`;
        return here.some(slice => slice.def === def) ? `There is only one ${info.name} per city.` : null;
      default:
        return null;
    }
  }

  if (info.kind === "cross") {
    const to = place.to;
    if (!validTile(to) || !neighbors(tile).includes(to)) return "A road connects two adjacent tiles.";
    if (isOcean(state, tile) || isOcean(state, to)) return "A Road must not touch the ocean.";
    if (roadBetween(state, tile, to)) return "There is already a road there.";
    return reachable.has(tile) || reachable.has(to) ? null : REACH_ERROR;
  }

  // Edge building: a Wall.
  const side = place.side;
  if (!Number.isInteger(side) || side! < 0 || side! > 5) return "Choose an edge of the tile.";
  const other = sideNeighbor(tile, side!);
  if (other === null) return "That edge lies on the border of the world.";
  if (isOcean(state, tile) || isOcean(state, other)) return `A ${info.name} must not be on ocean.`;
  if (wallAcross(state, tile, other)) return "There is already a wall on that edge.";
  return reachable.has(tile) || reachable.has(other) ? null : REACH_ERROR;
}

// Every place where the building could be built now.
export function placements(state: KinState, player: string, def: string): Placement[] {
  const info = blueprintInfo(def);
  if (!info || info.faction || !hasBlueprint(state, player, def)) return [];
  const result: Placement[] = [];
  const reach = reachTiles(state, player);
  for (let tile = 0; tile < TILE_COUNT; tile++) {
    const candidates: Placement[] = info.kind === "slice" || info.kind === "edge" ? SIDES.map(side => ({ tile, side }))
      : info.kind === "cross" ? neighbors(tile).filter(to => to > tile).map(to => ({ tile, to }))
      : [{ tile }];
    for (const place of candidates) if (placementError(state, player, def, place, reach) === null) result.push(place);
  }
  if (info.kind === "slice") for (const side of ARK_BOARD_TILES) if (placementError(state, player, def, { tile: ARK_BOARD, side }, reach) === null) result.push({ tile: ARK_BOARD, side });
  return result;
}

// Smith: build power needed to Build or Demolish on a tile is lowered by 1 per Smith on it, to a minimum of 0.
// Master Smiths (Hammers): each Smith of its owner lowers it by 2.
export function smithDiscount(state: KinState, tiles: number[]): number {
  const power = (slice: Building) => slice.owner && hasCard(state, slice.owner, "master-smiths") ? 2 : 1;
  return Math.max(0, ...tiles.map(tile => slicesAt(state, tile).filter(slice => slice.def === "smith").reduce((sum, slice) => sum + power(slice), 0)));
}

export function buildPower(state: KinState, def: string, place: Placement): number {
  const info = blueprintInfo(def);
  if (!info) return 0;
  const tiles = place.to !== undefined ? [place.tile, place.to] : info.kind === "edge" && place.side !== undefined ? [place.tile, sideNeighbor(place.tile, place.side) ?? place.tile] : [place.tile];
  return Math.max(0, info.power - smithDiscount(state, tiles));
}

const stock = (state: KinState, player: string, resource: string) => state.players[player].resources[resource] ?? 0;

export function costError(state: KinState, player: string, def: string, basic: Record<string, number> = {}, place?: Placement): string | null {
  const cost = costOf(state, player, def);
  if (!cost) return "That is not a building.";
  if (freeBuild(state, player, def, place)) return null;
  for (const [resource, amount] of Object.entries(cost.resources)) if (stock(state, player, resource) < amount) return `You need ${amount} ${resource}.`;
  const chosen = Object.entries(basic);
  if (chosen.some(([resource, amount]) => !BASIC_RESOURCES.includes(resource) || !Number.isInteger(amount) || amount < 0)) return "Pay with gold, lumber, stone and food.";
  if (chosen.reduce((sum, [, amount]) => sum + amount, 0) !== cost.basic) return `Pay exactly ${cost.basic} basic resources.`;
  for (const [resource, amount] of chosen) if (stock(state, player, resource) - (cost.resources[resource] ?? 0) < amount) return `You do not have ${amount} ${resource} to spare.`;
  return null;
}

// Can the player pay for the blueprint at all, with any mix of basic resources?
export function canAfford(state: KinState, player: string, def: string, place?: Placement): boolean {
  const cost = costOf(state, player, def);
  if (!cost) return false;
  if (freeBuild(state, player, def, place)) return true;
  if (Object.entries(cost.resources).some(([resource, amount]) => stock(state, player, resource) < amount)) return false;
  const spare = BASIC_RESOURCES.reduce((sum, resource) => sum + stock(state, player, resource) - (cost.resources[resource] ?? 0), 0);
  return spare >= cost.basic;
}

export function payCost(state: KinState, player: string, def: string, basic: Record<string, number> = {}, place?: Placement) {
  if (freeBuild(state, player, def, place)) return;
  const cost = costOf(state, player, def)!;
  const resources = state.players[player].resources;
  for (const [resource, amount] of Object.entries(cost.resources)) resources[resource] = stock(state, player, resource) - amount;
  for (const [resource, amount] of Object.entries(basic)) resources[resource] = stock(state, player, resource) - amount;
}

// Puts the building on the world board. A City replaces the village it is built on and keeps the slice buildings in it.
export function placeBuilding(state: KinState, player: string, def: string, place: Placement, dedication?: string): Building {
  if (def === "city") {
    const village = tileBuildingAt(state, place.tile)!;
    village.def = "city";
    return village;
  }
  const info = blueprintInfo(def)!;
  return addBuilding(state, {
    def,
    owner: info.kind === "cross" ? null : player,
    kind: info.kind,
    tile: place.tile,
    ...(place.side !== undefined ? { side: place.side } : {}),
    ...(place.to !== undefined ? { to: place.to } : {}),
    ...(dedication && def === "village" ? { dedication } : {})
  });
}

const POPULATION: Record<string, number> = { village: 1, city: 2, "daimyo-castle": 1, "sleeping-city": 4 };

// Villages and cities add population, and so does a Daimyo Castle.
export const population = (state: KinState, player: string) =>
  state.buildings.filter(building => building.owner === player).reduce((sum, building) => sum + (POPULATION[building.def] ?? 0), 0);

// The number of armies you may own: 1, and 1 more per Barracks or Daimyo Castle.
export const armyLimit = (state: KinState, player: string) =>
  1 + state.buildings.filter(building => building.owner === player && (building.def === "barracks" || building.def === "daimyo-castle" || building.def === "sleeping-city")).length
    - state.buildings.filter(building => building.owner === player && building.def === "vault").length;

// Garrison of a building. A Barracks adds 2 garrison to its tile building.
export function garrison(state: KinState, building: Building): number {
  const base = buildingById(building.def)?.garrison ?? 0;
  // Xcav-2M, Geofusion: the Ark has a garrison of 10 on a mountain.
  if (building.def === "the-ark") {
    return building.owner !== null && hasChar(state, building.owner, "xcav-2m") && state.tiles[building.tile]?.terrain === "mountain" ? 10 : base;
  }
  if (building.kind !== "tile") return base;
  return base + 2 * slicesAt(state, building.tile).filter(slice => slice.def === "barracks").length;
}

// What each building produces at Seasons Change. A Worksite depends on the tile next to it.
const PRODUCT: Record<string, string> = { market: "gold", university: "gear", "mage-college": "mana", "divine-sanctum": "mana", "the-great-tree": "mana", "sleeping-city": "gold" };
const WORKSITE: Partial<Record<Terrain, string>> = { farmland: "food", mountain: "stone", forest: "lumber" };

export function production(state: KinState, player: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const building of state.buildings) {
    if (building.owner !== player) continue;
    let resource = PRODUCT[building.def];
    // Expansionists: a village or city on farmland produces 1 food. Terrain under a tile building is the tile's own.
    if ((building.def === "village" || building.def === "city") && state.tiles[building.tile]?.terrain === "farmland" && hasCard(state, player, "expansionists")) resource = "food";
    if (building.def === "worksite" && building.side !== undefined && building.tile >= 0) {
      const next = sideNeighbor(building.tile, building.side);
      const terrain = next === null ? undefined : terrainOf(state, next);
      // Rice Fields: a worksite next to plains produces 1 food.
      resource = (terrain === "plains" && hasCard(state, player, "rice-fields") ? "food" : terrain ? WORKSITE[terrain] : undefined) as string;
      // Underwater Cult: a worksite in a village or city on ocean produces the dedicated resource of that building.
      const host = state.buildings.find(other => other.kind === "tile" && other.tile === building.tile);
      if (host?.dedication && state.tiles[building.tile].terrain === "ocean" && hasCard(state, player, "underwater-cult")) resource = host.dedication;
    }
    if (resource) result[resource] = (result[resource] ?? 0) + (building.def === "divine-sanctum" || building.def === "sleeping-city" ? 4 : 1);
  }
  const tradegood = tradegoodsProduction(state, player);
  if (tradegood > 0) result.tradegood = tradegood;
  return result;
}

// Seasons Change: every building produces its resource.
export function produce(state: KinState) {
  for (const player of state.order) {
    const resources = state.players[player].resources;
    for (const [resource, amount] of Object.entries(production(state, player))) resources[resource] = (resources[resource] ?? 0) + amount;
  }
}
