import { maxArmyStrength, hasCard } from "./cards";
import { influence, spendInfluence } from "./hanshu";
import { canBattle } from "./battle";
import { exploreOptions } from "./archeology";
import { characterAbilitySource, hasChar, inReinforceReach } from "./neutrals";
import { DEPLOY_ON } from "./expansion";
import { activationError, embarkTiles, endTurn, hasActionCard, setTapped, sourcesFor, type Source } from "./play";
import type { Army, KinState } from "./types";
import { neighbors } from "./world";

// Control actions: Recruit, Reinforce, Harvest and Embark. Each taps one Control character or activation card.

export const RECRUIT_FOOD = 2;
// Honorless (Beastmen): recruiting costs 1 food instead of 2.
export const recruitCost = (state: KinState, player: string) => hasCard(state, player, "honorless") ? 1 : RECRUIT_FOOD;
const HARVEST: Record<string, string> = { farmland: "food", mountain: "stone", forest: "lumber" };

const mine = (state: KinState, player: string) => state.armies.filter(army => army.owner === player && army.tile >= 0);
const army = (state: KinState, id: unknown) => state.armies.find(candidate => candidate.id === id);

// Forrow lets you Harvest plains for food.
const harvestResource = (state: KinState, player: string, terrain: string): string | undefined =>
  HARVEST[terrain] ?? (terrain === "plains" && hasChar(state, player, "forrow") ? "food" : undefined);

// Goros lets you pay the Recruit with gold instead of food, Daegobark with mana. Returns what is paid with, or null when none is affordable.
export function recruitPayment(state: KinState, player: string, chosen: boolean | "gold" | "mana" = false): "food" | "gold" | "mana" | null {
  const resources = state.players[player].resources;
  const cost = recruitCost(state, player);
  const canGold = hasChar(state, player, "goros") && (resources.gold ?? 0) >= cost;
  const canMana = hasChar(state, player, "daegobark") && (resources.mana ?? 0) >= cost;
  const canFood = (resources.food ?? 0) >= cost;
  if (chosen === "mana") return canMana ? "mana" : null;
  if (chosen === true || chosen === "gold") return canGold ? "gold" : null;
  return canFood ? "food" : canGold ? "gold" : canMana ? "mana" : null;
}

// Which payment the action asks for: gold (Goros), mana (Daegobark) or the default.
const chosenPayment = (action: Record<string, unknown>): "gold" | "mana" | false => action.mana === true ? "mana" : action.gold === true ? "gold" : false;

export const canRecruitOn = (state: KinState, a: Army) =>
  state.buildings.some(building => building.owner === a.owner && building.tile === a.tile && (DEPLOY_ON.includes(building.def) || building.def === "warband-camp"));

export const recruitOptions = (state: KinState, player: string, free = false): string[] =>
  !free && recruitPayment(state, player) === null ? []
    : mine(state, player).filter(a => a.strength < maxArmyStrength(state, player) && canRecruitOn(state, a)).map(a => a.id);

// Yuguan: recruit for 1 influence, without tapping the activation source.
export const canYuguan = (state: KinState, player: string) => hasChar(state, player, "yuguan") && influence(state, player) >= 1;

// For each army that could Reinforce, the armies of the same player it could exchange strength with: adjacent ones, or two tiles
// away with Bucephalus.
export function reinforceOptions(state: KinState, player: string): { army: string; partners: string[] }[] {
  const max = maxArmyStrength(state, player);
  const ready = mine(state, player).filter(a => !a.status && a.strength < max);
  return ready
    .map(a => ({ army: a.id, partners: ready.filter(b => b.id !== a.id && inReinforceReach(state, player, a.tile, b.tile, neighbors)).map(b => b.id) }))
    .filter(option => option.partners.length > 0);
}

export const harvestOptions = (state: KinState, player: string): string[] =>
  mine(state, player).filter(a => !a.status && harvestResource(state, player, state.tiles[a.tile].terrain)).map(a => a.id);

export const embarkOptions = (state: KinState, player: string): { army: string; tiles: number[] }[] =>
  mine(state, player).map(a => ({ army: a.id, tiles: embarkTiles(state, a) })).filter(option => option.tiles.length > 0);

// Can the player do any Control action now? A Control phase ends for players who cannot.
export function canControl(state: KinState, player: string): boolean {
  if (!sourcesFor(state, player, "control").length) return false;
  const has = (def: string) => hasActionCard(state, player, def);
  return (has("recruit") && (recruitOptions(state, player).length > 0 || (canYuguan(state, player) && recruitOptions(state, player, true).length > 0)))
    || (has("reinforce") && reinforceOptions(state, player).length > 0)
    || (has("harvest") && harvestOptions(state, player).length > 0)
    || (has("embark") && embarkOptions(state, player).length > 0)
    || (has("explore") && exploreOptions(state, player).length > 0)
    || (has("battle") && canBattle(state, player));
}

function finish(state: KinState, source: Source) {
  setTapped(state, source, true);
  state.play!.passes = 0;
  endTurn(state);
}

const start = (state: KinState, player: string, action: Record<string, unknown>, def: string) => activationError(state, player, action, def, "control");

// --- Recruit ---

export function validateRecruit(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = start(state, player, action, "recruit");
  if (typeof source === "string") return source;
  if (action.yuguan === true) {
    if (!canYuguan(state, player)) return "Yuguan needs Yuguan in your court and 1 influence.";
    return recruitOptions(state, player, true).includes(String(action.army)) ? null : "Choose one of your armies below maximum strength on a Barracks or other building you can Recruit on.";
  }
  if (recruitPayment(state, player, chosenPayment(action)) === null) return action.mana === true ? `Recruiting with mana needs Daegobark and ${recruitCost(state, player)} mana.` : action.gold === true ? `Recruiting with gold needs Goros and ${recruitCost(state, player)} gold.` : `Recruiting costs ${recruitCost(state, player)} food.`;
  return recruitOptions(state, player).includes(String(action.army)) ? null : "Choose one of your armies below maximum strength on a Barracks or other building you can Recruit on.";
}

export function recruit(state: KinState, player: string, action: Record<string, unknown>) {
  const source = start(state, player, action, "recruit") as Source;
  if (action.yuguan === true) {
    spendInfluence(state, player, 1);
    army(state, action.army)!.strength += 1;
    state.play!.passes = 0;
    return endTurn(state);
  }
  state.players[player].resources[recruitPayment(state, player, chosenPayment(action))!] -= recruitCost(state, player);
  army(state, action.army)!.strength += 1;
  finish(state, source);
}

// --- Reinforce ---

// `strength` is the strength the first army ends with; the second army gets the rest.
export function validateReinforce(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = start(state, player, action, "reinforce");
  if (typeof source === "string") return source;
  const option = reinforceOptions(state, player).find(candidate => candidate.army === action.first);
  if (!option || !option.partners.includes(String(action.second))) return "Choose two adjacent armies of yours that are not exhausted and not at maximum strength.";
  const first = army(state, action.first)!;
  const second = army(state, action.second)!;
  const total = first.strength + second.strength;
  const max = maxArmyStrength(state, player);
  const result = action.strength;
  if (!Number.isInteger(result)) return "Choose the new strength of the first army.";
  if ((result as number) < 1 || total - (result as number) < 1) return "Every army keeps at least 1 strength.";
  if ((result as number) > max || total - (result as number) > max) return `Neither army may go above the maximum strength of ${max}.`;
  return result === first.strength ? "Nothing would change." : null;
}

export function reinforce(state: KinState, player: string, action: Record<string, unknown>) {
  const source = start(state, player, action, "reinforce") as Source;
  const first = army(state, action.first)!;
  const second = army(state, action.second)!;
  const total = first.strength + second.strength;
  first.strength = action.strength as number;
  second.strength = total - first.strength;
  finish(state, source);
}

// --- Harvest ---

export function validateHarvest(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = start(state, player, action, "harvest");
  if (typeof source === "string") return source;
  return harvestOptions(state, player).includes(String(action.army)) ? null : "Choose one of your armies on farmland, forest or a mountain that is not exhausted.";
}

export function harvest(state: KinState, player: string, action: Record<string, unknown>) {
  const source = start(state, player, action, "harvest") as Source;
  const a = army(state, action.army)!;
  const terrain = state.tiles[a.tile].terrain;
  let resource = harvestResource(state, player, terrain)!;
  let count = 1;
  if (characterAbilitySource(state, player, source, "herne") && terrain === "forest" && (state.players[player].resources.relic ?? 0) >= 3) { resource = "food"; count = 2; }
  const resources = state.players[player].resources;
  resources[resource] = (resources[resource] ?? 0) + count;
  a.status = "overexhausted";
  finish(state, source);
}

// --- Embark ---

export function validateEmbark(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = start(state, player, action, "embark");
  if (typeof source === "string") return source;
  const option = embarkOptions(state, player).find(candidate => candidate.army === action.army);
  if (!option) return "Choose one of your armies on a Harbor with an adjacent ocean tile.";
  return option.tiles.includes(action.tile as number) ? null : "Choose an adjacent ocean tile.";
}

export function embark(state: KinState, player: string, action: Record<string, unknown>) {
  const source = start(state, player, action, "embark") as Source;
  const a = army(state, action.army)!;
  a.tile = action.tile as number;
  a.embarked = true;
  finish(state, source);
}
