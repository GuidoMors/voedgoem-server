import { addItem, hasCard } from "./cards";
import { isUnbuiltTile } from "./archeology";
import { adjacent, stepCost } from "./play";
import { hasChar, onTradeGiven } from "./neutrals";
import { hasTech, treatyAllowed, treatyDef, diplomacyDef, treatyType, TREATY_TYPES, type TreatyType } from "./treaties";
import type { Army, KinState } from "./types";

// Pride of Lumon: Virtue, Diplomats, and the character abilities that use virtue as a requirement.

const BASIC = ["gold", "lumber", "stone", "food"];

// Virtue equals the number of your treaties that other players hold. It is never spent or bartered.
export const virtue = (state: KinState, player: string): number =>
  hasCard(state, player, "virtue") ? state.items.filter(item => treatyType(item.def) && item.giver === player && item.owner && item.owner !== player).length : 0;

// The resources shown to everybody: virtue is derived, so it is added here.
export const shownResources = (state: KinState, player: string): Record<string, number> => {
  const resources = state.players[player].resources;
  return hasCard(state, player, "virtue") ? { ...resources, virtue: virtue(state, player) } : resources;
};

// Diplomats: the player who receives a treaty from you gets a gift.
const GIFTS: Partial<Record<TreatyType, string>> = { peace: "gear", access: "mana", trade: "gold" };
export function diplomatGift(state: KinState, type: TreatyType, giver: string, receiver: string) {
  const gift = GIFTS[type];
  if (!gift || giver === receiver || !hasCard(state, giver, "diplomats")) return;
  state.players[receiver].resources[gift] = (state.players[receiver].resources[gift] ?? 0) + 1;
}

// Lumon, The White Wave: the players you could force a treaty on, and which treaty types.
export function lumonOptions(state: KinState, player: string): { player: string; types: TreatyType[] }[] {
  return state.order.filter(other => other !== player).map(other => ({
    player: other,
    types: TREATY_TYPES.filter(type => type !== "promise" && hasTech(state, player, diplomacyDef(type)) && treatyAllowed(state, type, player, other, []) === null)
  })).filter(option => option.types.length > 0);
}

export function forceTreaty(state: KinState, player: string, action: Record<string, unknown>) {
  const type = String(action.treaty) as TreatyType;
  const target = String(action.player);
  const item = addItem(state, treatyDef(type), `court:${target}`, target, player);
  if (type === "peace") item.duration = Number(action.duration);
  if (type === "trade") onTradeGiven(state, player, target);
  diplomatGift(state, type, player, target);
}

export const lumonError = (state: KinState, player: string, action: Record<string, unknown>): string | null => {
  const option = lumonOptions(state, player).find(candidate => candidate.player === action.player);
  if (!option) return "Choose another player.";
  if (!option.types.includes(action.treaty as TreatyType)) return "Choose a treaty you can barter to that player.";
  if (action.treaty === "peace" && !(Number.isInteger(action.duration) && (action.duration as number) >= 1 && (action.duration as number) <= 10)) return "A Peace Treaty lasts 1 to 10 rounds.";
  return null;
};

// Wololay, Turning of Hearts: armies of other players on an unbuilt tile that is next to a stronger army of yours,
// whose owner holds at least 3 of your treaties.
export function convertTargets(state: KinState, player: string): string[] {
  return state.armies.filter((army: Army) => {
    if (army.owner === player || army.tile < 0 || !isUnbuiltTile(state, army.tile)) return false;
    const held = state.items.filter(item => treatyType(item.def) && item.giver === player && item.owner === army.owner).length;
    if (held < 3) return false;
    return state.armies.some(own => own.owner === player && own.tile >= 0 && own.strength > army.strength && adjacent(state, player, own.tile).includes(army.tile));
  }).map(army => army.id);
}

export const prishnaCanPay = (state: KinState, player: string) => BASIC.every(resource => (state.players[player].resources[resource] ?? 0) >= 1);

// Anant, Redemption: with 7 virtue none of your characters can be taken hostage.
export const redeemed = (state: KinState, player: string) => hasChar(state, player, "anant") && virtue(state, player) >= 7;

// Goldenmane, Intimidating Presence: with 5 virtue, armies with less than 3 strength cannot battle you.
export const intimidates = (state: KinState, player: string, strength: number) => strength < 3 && hasChar(state, player, "goldenmane") && virtue(state, player) >= 5;

// Taahira, The Great Hunt: the non-ocean tiles the army could move to after the battle.
export const huntTiles = (state: KinState, player: string, army: Army): number[] =>
  adjacent(state, player, army.tile).filter(tile => state.tiles[tile].terrain !== "ocean" && !state.armies.some(other => other.tile === tile) && stepCost(state, player, army.tile, tile) !== null);

export const canHunt = (state: KinState, player: string, general: string | null | undefined) =>
  general === "taahira" && hasChar(state, player, "taahira") && virtue(state, player) >= 2;

// The White Prophet: other players cannot use Lumon as their general.
export const lumonBarred = (state: KinState, player: string, id: string) => id === "lumon" && !hasCard(state, player, "the-white-prophet");
