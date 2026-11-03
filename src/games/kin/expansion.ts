import { addArmy } from "./setup";
import { addItem, factionKinOf, hasCard } from "./cards";
import { gainInfluence, influence, spendInfluence } from "./hanshu";
import { KINS } from "./kins";
import { canReclaim } from "./archeology";
import { ARK_BOARD, armyLimit, arkBoardOf, blueprintInfo, buildPower, canAfford, costError, costOf, footprint, freeBuild, payCost, placeBuilding, placementError, placements, smithDiscount, type Cost, type Placement } from "./buildings";
import { activationError, endTurn, hasActionCard, setTapped, sourcesFor, type Source } from "./play";
import { discardEnacted, forbiddenBy } from "./laws";
import { breakOnAttack } from "./treaties";
import { canCraft, craft, craftError } from "./hammers";
import { claimTactic } from "./tactics";
import { DEDICATIONS } from "./deepones";
import { guildHallConvert, guildHallError } from "./streams";
import { GREAT_TREE } from "./tree";
import type { Building, KinState, SourceKind } from "./types";

// Expansion actions: Build, Deploy and Demolish. Each taps an Expansion character or activation card; Build and Demolish
// may need more of them to reach the build power.

export const DEMOLISH_POWER = 3;
export const WALL_DEMOLISH_POWER = 4;

// Buildings an army can be deployed on. Faction buildings that work like a Barracks join this with their Kin.
export const DEPLOY_ON = ["barracks", "daimyo-castle", "vault", "the-ark"];

type CardRef = { kind: SourceKind; id: string };

export interface BuildOption {
  item: string;
  def: string;
  name: string;
  cost: Cost;
  // Every legal place with the build power needed there.
  places: (Placement & { power: number; free?: boolean })[];
}

export interface DemolishOption {
  building: string;
  power: number;
}

// The blueprints the player could build, from their court or the building board.
export function buildOptions(state: KinState, player: string): BuildOption[] {
  const seen = new Set<string>();
  const result: BuildOption[] = [];
  for (const item of state.items) {
    if (seen.has(item.def) || (item.zone !== `court:${player}` && item.zone !== "board:building")) continue;
    const info = blueprintInfo(item.def);
    if (!info || info.faction) continue;
    const affordable = canAfford(state, player, item.def);
    // Seedling Villages: some places are free.
    if (!affordable && !(item.def === "village" && hasCard(state, player, "seedling-villages"))) continue;
    seen.add(item.def);
    const places = placements(state, player, item.def)
      .filter(place => affordable || freeBuild(state, player, item.def, place))
      .map(place => ({ ...place, power: buildPower(state, item.def, place), ...(freeBuild(state, player, item.def, place) ? { free: true } : {}) }));
    if (places.length) result.push({ item: item.id, def: item.def, name: info.name, cost: costOf(state, player, item.def)!, places });
  }
  return result;
}

const armyOnTile = (state: KinState, player: string, tile: number) => state.armies.some(army => army.owner === player && army.tile === tile);

export function demolishPower(state: KinState, building: Building): number {
  const base = building.kind === "edge" ? WALL_DEMOLISH_POWER : DEMOLISH_POWER;
  const tiles = building.tile === ARK_BOARD ? [ARK_BOARD] : footprint(building);
  return Math.max(0, base - smithDiscount(state, tiles));
}

// Your own buildings with an army of yours on their tile, and any wall next to an army of yours.
export function demolishOptions(state: KinState, player: string): DemolishOption[] {
  return state.buildings
    .filter(building => building.def !== "guild-hall" && building.def !== GREAT_TREE && (building.tile >= 0
      ? building.kind === "edge"
        ? footprint(building).some(tile => armyOnTile(state, player, tile))
        : building.owner === player && armyOnTile(state, player, building.tile)
      : building.tile === ARK_BOARD && building.kind === "slice" && building.owner === player && state.buildings.some(ark => ark.def === "the-ark" && ark.owner === player && ark.tile >= 0 && armyOnTile(state, player, ark.tile))))
    .map(building => ({ building: building.id, power: demolishPower(state, building) }));
}

export const deployOptions = (state: KinState, player: string): string[] =>
  state.armies.filter(army => army.owner === player).length >= armyLimit(state, player)
    ? []
    : state.buildings.filter(building => building.owner === player && building.tile >= 0 && DEPLOY_ON.includes(building.def)).map(building => building.id);

// Can any Expansion action be done with the cards the player has untapped? The phase ends for players who cannot.
export function canExpand(state: KinState, player: string): boolean {
  const sources = sourcesFor(state, player, "expansion");
  if (!sources.length) return false;
  const total = sources.reduce((sum, source) => sum + source.power, 0);
  const allowed = (def: string) => !forbiddenBy(state, def);
  if ((allowed("deploy") && deployOptions(state, player).length) || canReclaim(state, player) || canRevoke(state, player, total) || (allowed("craftdwarves") && canCraft(state, player))) return true;
  return (allowed("demolish") && demolishOptions(state, player).some(option => option.power <= total)) || (allowed("build") && buildOptions(state, player).some(option => option.places.some(place => place.power <= total)));
}

// --- Revoke ---

export const REVOKE_POWER = 5;

export const canRevoke = (state: KinState, player: string, total: number) =>
  !!state.laws?.enacted && (total >= REVOKE_POWER || (hasCard(state, player, "influential") && influence(state, player) >= 1)) && hasActionCard(state, player, "revoke");

// Influential: pay 1 influence instead of tapping extra sources for build power.
const withInfluence = (state: KinState, player: string, action: Record<string, unknown>) => action.influence === true && hasCard(state, player, "influential") && influence(state, player) >= 1;

export function validateRevoke(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "revoke", "expansion");
  if (typeof source === "string") return source;
  if (!state.laws?.enacted) return "There is no enacted law.";
  if (action.law !== undefined && action.law !== state.laws.enacted) return "That law is not enacted.";
  if (action.influence === true) return withInfluence(state, player, action) ? null : "Influential and 1 influence are needed to revoke with influence.";
  const paid = payment(state, player, source, action, REVOKE_POWER);
  return typeof paid === "string" ? paid : null;
}

export function revoke(state: KinState, player: string, action: Record<string, unknown>) {
  const source = activationError(state, player, action, "revoke", "expansion") as Source;
  let cards: CardRef[];
  if (withInfluence(state, player, action)) {
    spendInfluence(state, player, 1);
    cards = [{ kind: source.kind, id: source.id }];
  } else cards = payment(state, player, source, action, REVOKE_POWER) as CardRef[];
  discardEnacted(state);
  // Influential: another player revoking a law gives influence.
  for (const other of state.order) if (other !== player && hasCard(state, other, "influential")) gainInfluence(state, other);
  tap(state, cards);
}

// The activating card plus the extra cards must reach the power, without any card being left over that was not needed.
function payment(state: KinState, player: string, source: Source, action: Record<string, unknown>, power: number): CardRef[] | string {
  const extra = action.extra ?? [];
  if (!Array.isArray(extra)) return "Choose the cards to tap.";
  const available = sourcesFor(state, player, "expansion");
  const cards: Source[] = [source];
  for (const ref of extra as CardRef[]) {
    const found = available.find(candidate => candidate.kind === ref?.kind && candidate.id === ref?.id);
    if (!found || cards.some(card => card.kind === found.kind && card.id === found.id)) return "Choose each of your untapped Expansion characters or activation cards only once.";
    cards.push(found);
  }
  const total = cards.reduce((sum, card) => sum + card.power, 0);
  if (total < power) return `You need ${power} build power; the cards you chose have ${total}.`;
  if (cards.length > 1 && total - Math.min(...cards.map(card => card.power)) >= power) return "You chose more cards than needed.";
  return cards.map(card => ({ kind: card.kind, id: card.id }));
}

function tap(state: KinState, cards: CardRef[], untap?: CardRef) {
  for (const card of cards) setTapped(state, card, true);
  if (untap) setTapped(state, untap, false);
  state.play!.passes = 0;
  endTurn(state);
}

const placeOf = (value: unknown): Placement => {
  const raw = (value ?? {}) as Partial<Placement>;
  return { tile: raw.tile as number, ...(raw.side !== undefined ? { side: raw.side } : {}), ...(raw.to !== undefined ? { to: raw.to } : {}) };
};

// --- Craftdwarves (Hammers) ---

export function validateCraft(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "craftdwarves", "expansion");
  return typeof source === "string" ? source : craftError(state, player);
}

export function craftdwarves(state: KinState, player: string, action: Record<string, unknown>) {
  const source = activationError(state, player, action, "craftdwarves", "expansion") as Source;
  craft(state, player);
  tap(state, [{ kind: source.kind, id: source.id }]);
}

// --- Build ---

export function validateBuild(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "build", "expansion");
  if (typeof source === "string") return source;
  const def = String(action.def);
  const place = placeOf(action.place);
  const error = placementError(state, player, def, place) ?? costError(state, player, def, (action.basic ?? {}) as Record<string, number>, place) ?? (def === "guild-hall" ? guildHallError(state, player, action.resource) : null);
  if (error) return error;
  if (def === "grand-observatory") {
    const kinsError = observatoryError(state, player, action.kins);
    if (kinsError) return kinsError;
  }
  if (def === "village" && hasCard(state, player, "underwater-cult") && !DEDICATIONS.includes(String(action.dedication))) return "Dedicate the village to gold, lumber, stone or food.";
  const paid = payment(state, player, source, action, buildPower(state, def, place));
  return typeof paid === "string" ? paid : null;
}

export function build(state: KinState, player: string, action: Record<string, unknown>) {
  const source = activationError(state, player, action, "build", "expansion") as Source;
  const def = String(action.def);
  const place = placeOf(action.place);
  const cards = payment(state, player, source, action, buildPower(state, def, place)) as CardRef[];
  payCost(state, player, def, (action.basic ?? {}) as Record<string, number>, place);
  placeBuilding(state, player, def, place, hasCard(state, player, "underwater-cult") ? String(action.dedication) : undefined);
  if (def === "grand-observatory") grantObservatoryTreaties(state, player, action.kins);
  if (def === "brewery") claimTactic(state, player);
  if (def === "guild-hall") guildHallConvert(state, player, action.resource);
  // Imperial Roads: building a Road untaps the character that was used to build it.
  tap(state, cards, def === "road" && source.kind === "character" && hasCard(state, player, "imperial-roads") ? { kind: source.kind, id: source.id } : undefined);
}

// Grand Observatory: gain up to 3 Faction Treaties of Kin that are not in the game and that you do not already hold.
export function observatoryKins(state: KinState, player: string): string[] {
  const inGame = new Set(Object.values(state.world?.kinPicks ?? {}));
  const held = new Set(state.items.filter(item => item.def === "faction-treaty" && item.zone === `court:${player}` && item.giver).map(item => factionKinOf(state, item.giver!)));
  return KINS.map(kin => kin.id).filter(id => !inGame.has(id) && !held.has(id));
}

export const observatoryChoices = (state: KinState, player: string) => observatoryKins(state, player).map(id => ({ id, name: KINS.find(kin => kin.id === id)!.name }));

export function observatoryError(state: KinState, player: string, chosen: unknown): string | null {
  if (chosen === undefined) return null;
  if (!Array.isArray(chosen)) return "Choose the Kin as a list.";
  if (chosen.length > 3) return "Choose at most 3 Kin.";
  if (new Set(chosen).size !== chosen.length) return "Choose each Kin only once.";
  const available = observatoryKins(state, player);
  return chosen.every(id => available.includes(id)) ? null : "Choose only Kin that are not in the game and whose Faction Treaty you do not hold.";
}

// Without a choice the first 3 available Kin are taken; a choice gives exactly the chosen Kin ("up to 3").
export function grantObservatoryTreaties(state: KinState, player: string, chosen?: unknown) {
  const available = observatoryKins(state, player);
  const picks = Array.isArray(chosen) ? (chosen as string[]).filter((id, index, all) => available.includes(id) && all.indexOf(id) === index) : available;
  for (const id of picks.slice(0, 3)) addItem(state, "faction-treaty", `court:${player}`, player, `kin:${id}`);
}

// --- Deploy ---

export function validateDeploy(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "deploy", "expansion");
  if (typeof source === "string") return source;
  if (state.armies.filter(army => army.owner === player).length >= armyLimit(state, player)) return "You already have as many armies as your army limit.";
  return deployOptions(state, player).includes(String(action.building)) ? null : "Choose one of your buildings that armies can be deployed on.";
}

export function deploy(state: KinState, player: string, action: Record<string, unknown>) {
  const source = activationError(state, player, action, "deploy", "expansion") as Source;
  const building = state.buildings.find(candidate => candidate.id === action.building)!;
  addArmy(state, player, building.tile);
  tap(state, [source]);
}

// --- Demolish ---

export function validateDemolish(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "demolish", "expansion");
  if (typeof source === "string") return source;
  const option = demolishOptions(state, player).find(candidate => candidate.building === action.building);
  if (!option) return "Choose one of your buildings with an army of yours on it, or a wall next to one of your armies.";
  const paid = payment(state, player, source, action, option.power);
  return typeof paid === "string" ? paid : null;
}

// Removes the building. Demolishing a tile building also removes the slice buildings inside it.
export function demolish(state: KinState, player: string, action: Record<string, unknown>) {
  const source = activationError(state, player, action, "demolish", "expansion") as Source;
  const building = state.buildings.find(candidate => candidate.id === action.building)!;
  const cards = payment(state, player, source, action, demolishPower(state, building)) as CardRef[];
  const gone = new Set([building.id]);
  if (building.kind === "tile") for (const slice of state.buildings) if (slice.kind === "slice" && slice.tile === building.tile) gone.add(slice.id);
  // The Eternal Ark: when the Ark is gone, so are the buildings on the ark board.
  if (building.def === "the-ark") for (const inside of arkBoardOf(state, building)) gone.add(inside.id);
  state.buildings = state.buildings.filter(candidate => !gone.has(candidate.id));
  // Taking down another player's wall counts as an attack on them.
  if (building.kind === "edge" && building.owner && building.owner !== player) breakOnAttack(state, player, building.owner);
  // Salvage (Beastmen): you gain back the resource cost of the demolished building.
  if (hasCard(state, player, "salvage")) {
    const spent = blueprintInfo(building.def)?.cost.resources ?? {};
    for (const [resource, count] of Object.entries(spent)) state.players[player].resources[resource] = (state.players[player].resources[resource] ?? 0) + count;
  }
  tap(state, cards);
}
