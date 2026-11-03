import { cardById } from "./cards.data";
import { breweries, wallBlocks } from "./buildings";
import { isUnbuiltTile } from "./archeology";
import { adjacent, endTurn } from "./play";
import { announce } from "./tactics";
import { influence, spendInfluence } from "./hanshu";
import { convertTargets, forceTreaty, lumonError, lumonOptions, prishnaCanPay, virtue } from "./lumon";
import { applyAttrition, attritionTargets } from "./events";
import { breakOnAttack, holdsTreaty } from "./treaties";
import { rollDie } from "./rng";
import { DINKER_TRADES, dinkerOptions, grogOptions, trampleTargets, type GrogOptions } from "./beastmen";
import { barrageTargets, researchTargets, sabotageTargets } from "./ark";
import { characterById } from "./draft";
import { LEAVAVEL_CONVERT, movingForest, rejuvenationTargets, swapTiles } from "./tree";
import { DEDICATIONS, dedicatedBuildings, isDeepOnes, shadowOptions } from "./deepones";
import { refineMax, transferOptions } from "./hammers";
import { TRADEGOOD, TSUNAMI_COST, tradeTreaties, tradegoods, tsunamiTargets, tsunami } from "./streams";
import type { Army, KinState, PlayPhase } from "./types";

// The abilities of the neutral characters. Passive abilities are checked where they apply (see the calls to hasChar); the tap
// abilities are activated with the `ability` action, and Znort's Cowardly with `flee`. A hostage cannot use its ability.

export const hasChar = (state: KinState, player: string, id: string): boolean => {
  const birchawe = state.cards.birchawe;
  if (id === "birchawe" && state.borrowed?.birchawe) return false;
  if (state.borrowed?.birchawe === id) return !!birchawe && birchawe.owner === player && !birchawe.hostageOf;
  const card = state.cards[id];
  return !!card && card.owner === player && !card.hostageOf;
};

export const characterAbilitySource = (state: KinState, player: string, source: { kind: string; id: string }, id: string): boolean =>
  source.kind === "character" && hasChar(state, player, id) && (source.id === id || state.borrowed?.[source.id] === id);

export const characterAbilityHolder = (state: KinState, player: string, id: string): string | null => {
  if (state.borrowed?.birchawe === id && state.cards.birchawe?.owner === player && !state.cards.birchawe.hostageOf) return "birchawe";
  if (id === "birchawe" && state.borrowed?.birchawe) return null;
  return state.cards[id]?.owner === player && !state.cards[id]?.hostageOf ? id : null;
};

// The ability a character card has now: its own, or the borrowed one.
const abilityOf = (state: KinState, cardId: string): string => state.borrowed?.[cardId] ?? cardId;

// Birchawe: characters with an ability in the court of another player (not hostages).
export function borrowTargets(state: KinState, player: string): string[] {
  return Object.values(state.cards)
    .filter(card => card.owner && card.owner !== player && !card.hostageOf && card.id !== "birchawe" && (characterById(card.def)?.abilities.length ?? 0) > 0)
    .map(card => card.id);
}

const BASIC = ["gold", "lumber", "stone", "food"];
const name = (state: KinState, player: string) => state.players[player].username;
const amount = (state: KinState, player: string, resource: string) => state.players[player].resources[resource] ?? 0;
const gain = (state: KinState, player: string, resource: string, count = 1) => {
  state.players[player].resources[resource] = amount(state, player, resource) + count;
};

// Ostraria: power of the Access Treaties in your court (max 5). Horus: your gold (max 5), only as an attacking general.
export function characterPower(state: KinState, player: string, id: string, base: number): number {
  const ability = abilityOf(state, id);
  if (id !== "birchawe" && state.borrowed?.birchawe === id) return base;
  if (ability === "ostraria") return state.charPower?.[ability] ?? base;
  if (ability === "horus") return Math.min(5, amount(state, player, "gold"));
  // Trotskyr, The Great Fortifier: the number of Forts you own, to a maximum of 5.
  if (ability === "trotskyr") return state.charPower?.[ability] ?? base;
  // Khaz and Gottrek: set at Seasons Change (see hammersSeasons).
  if ((ability === "khaz" || ability === "gottrek" || ability === "goahl-fiesj") && state.charPower?.[ability] !== undefined) return state.charPower[ability];
  return base;
}

// --- Passives ---

// Doropolopolos: the first Trade Treaty a player receives from you gives you 1 gear.
export function onTradeGiven(state: KinState, giver: string, receiver: string) {
  const key = `${giver}>${receiver}`;
  const given = (state.tradeGiven ??= []);
  if (given.includes(key)) return;
  given.push(key);
  if (hasChar(state, giver, "doropolopolos")) gain(state, giver, "gear");
}

// Bucephalus: Reinforce from two tiles away.
export function inReinforceReach(state: KinState, player: string, from: number, to: number, neighborsOf: (tile: number) => number[]): boolean {
  if (neighborsOf(from).includes(to)) return true;
  return hasChar(state, player, "bucephalus") && neighborsOf(from).some(next => neighborsOf(next).includes(to));
}

// --- Tap abilities ---

const PHASE: Record<string, PlayPhase | "any"> = { "horned-hoof": "discovery", dinker: "discovery", "grog-og-n-zog": "expansion", lumon: "any", torke: "discovery", wololay: "discovery", prishna: "expansion", wimblewhisker: "discovery", ethereal: "discovery", arachonos: "expansion", steen: "expansion", beiliu: "expansion", eyir: "expansion", sneachy: "control", coppygen: "discovery", nitrosium: "discovery", aurosphoros: "control", daxgrim: "control", uhzrun: "expansion", jaggengrog: "control", anvatsio: "discovery", koroko: "discovery", carvano: "expansion", sunumo: "discovery", leavavel: "expansion", maprassil: "discovery", birchawe: "expansion", yewanna: "discovery", "sha-shi-oq": "expansion", ogilgalog: "discovery" };
export const TAP_ABILITIES = Object.keys(PHASE);

// Beiliu: converting a hostage costs 4 influence.
export const CONVERT_COST = 4;
export const hostagesIn = (state: KinState, player: string) => Object.values(state.cards).filter(card => card.owner === player && card.hostageOf).map(card => card.id);

const technologies = (state: KinState, player: string) => state.items.filter(item => item.zone === `court:${player}` && cardById(item.def)?.kind === "technology").length;
const placed = (state: KinState, player: string) => state.armies.filter(army => army.owner === player && army.tile >= 0);
const combatBuilding = (state: KinState, tile: number) => state.buildings.find(building => building.tile === tile && (building.kind === "tile" || building.kind === "center") && building.owner !== null);

// Arachonos: armies of other players next to one of your armies.
export function webTargets(state: KinState, player: string): string[] {
  const near = new Set(placed(state, player).flatMap(army => adjacent(state, player, army.tile)));
  return state.armies.filter(army => army.owner !== player && army.tile >= 0 && !army.status && near.has(army.tile)).map(army => army.id);
}

// Sneachy: an army next to a building of another player may leap over it onto an empty tile next to that building.
export function leapOptions(state: KinState, player: string): { army: string; over: number; tiles: number[] }[] {
  const result: { army: string; over: number; tiles: number[] }[] = [];
  for (const army of placed(state, player)) {
    if (army.status) continue;
    for (const over of adjacent(state, player, army.tile)) {
      const building = combatBuilding(state, over);
      if (!building || building.owner === player || wallBlocks(state, player, army.tile, over)) continue;
      const tiles = adjacent(state, player, over).filter(tile => state.tiles[tile].terrain !== "ocean" && isUnbuiltTile(state, tile) && !state.armies.some(other => other.tile === tile) && !wallBlocks(state, player, over, tile));
      if (tiles.length > 0) result.push({ army: army.id, over, tiles });
    }
  }
  return result;
}

// Why the ability cannot be used now, or null. `play` conditions (turn, nothing in progress) are checked by the caller.
function abilityReason(state: KinState, player: string, cardId: string): string | null {
  const id = abilityOf(state, cardId);
  const card = state.cards[cardId];
  if (!card || card.owner !== player) return "That character is not in your court.";
  if (card.hostageOf) return "A hostage cannot use its ability.";
  if (card.tapped) return "This character is tapped.";
  if (!PHASE[id]) return "That ability cannot be used as an action.";
  const phase = state.play!.phase;
  if (PHASE[id] === "any" ? phase === "event" : phase !== PHASE[id]) return PHASE[id] === "any" ? "Not in the Event phase." : `Only in the ${PHASE[id][0].toUpperCase()}${PHASE[id].slice(1)} phase.`;
  if (id === "leavavel") {
    if (amount(state, player, "mana") < 2) return "Needs 2 mana.";
    if (amount(state, player, "lumber") < 1) return "Needs at least 1 lumber.";
  }
  if (id === "maprassil") {
    if (amount(state, player, "mana") < 2) return "Needs 2 mana.";
    if (rejuvenationTargets(state).length === 0) return "No army standing on a forest has room for more strength.";
  }
  if (id === "birchawe") {
    if (amount(state, player, "mana") < 2) return "Needs 2 mana.";
    if (borrowTargets(state, player).length === 0) return "No other player has a character with an ability in their court.";
  }
  if (id === "yewanna") {
    if (amount(state, player, "mana") < 2) return "Needs 2 mana.";
    if (movingForest(state, player).length === 0) return "No unbuilt armiless forest has an unbuilt armiless tile next to it to swap with.";
  }
  if (id === "horned-hoof") {
    if (amount(state, player, "mana") < 1) return "Needs 1 mana.";
    if (trampleTargets(state, player).length === 0) return "No army of strength 1 stands next to one of your armies.";
  }
  if (id === "dinker" && dinkerOptions(state, player).length === 0) return "Needs 1 food, 1 stone or 1 gold.";
  if (id === "sha-shi-oq") {
    if (!isDeepOnes(state, player)) return "Only the Deep Ones can use this.";
    if (amount(state, player, "mana") < 1) return "Needs 1 mana.";
    if (dedicatedBuildings(state, player).length === 0) return "You have no village or city with a dedication.";
  }
  if (id === "ogilgalog" && shadowOptions(state, player).length === 0) return "No army stands on a village, city or Sleeping City of yours with another one of yours free of armies.";
  if (id === "coppygen" && researchTargets(state, player).length === 0) return "The Ark is not next to a village or city of another player.";
  if (id === "nitrosium") {
    if (amount(state, player, "mana") < 1) return "Needs 1 mana.";
    if (sabotageTargets(state, player).length === 0) return "No building of another player stands next to one of your armies.";
  }
  if (id === "aurosphoros") {
    if (amount(state, player, "mana") < 2) return "Needs 2 mana.";
    if (barrageTargets(state, player).length === 0) return "No army of another player stands next to the Ark.";
  }
  if (id === "lumon") {
    if (virtue(state, player) < 4) return "Needs 4 virtue.";
    if (amount(state, player, "mana") < 4) return "Needs 4 mana.";
    if (lumonOptions(state, player).length === 0) return "You cannot barter a treaty to anybody.";
  }
  if (id === "wololay") {
    if (virtue(state, player) < 6) return "Needs 6 virtue.";
    if (amount(state, player, "mana") < 2) return "Needs 2 mana.";
    if (convertTargets(state, player).length === 0) return "No lesser army of a player holding 3 of your treaties stands next to your stronger army on an unbuilt tile.";
  }
  if (id === "prishna") {
    if (virtue(state, player) < 3) return "Needs 3 virtue.";
    if (!prishnaCanPay(state, player)) return "Needs 1 lumber, 1 gold, 1 stone and 1 food.";
  }
  if (id === "torke" && technologies(state, player) < 4) return "Needs at least 4 technologies in your court.";
  if (id === "wimblewhisker" && amount(state, player, "mana") < 1) return "Needs 1 mana.";
  if (id === "arachonos") {
    if (amount(state, player, "mana") < 3) return "Needs 3 mana.";
    if (webTargets(state, player).length === 0) return "None of your armies is next to an army of another player.";
  }
  if (id === "sneachy" && leapOptions(state, player).length === 0) return "No army of yours is next to a building it could leap over.";
  if (id === "eyir") {
    if (amount(state, player, "mana") < 4) return "Needs 4 mana.";
    if (attritionTargets(state).length === 0) return "No army stands on unbuilt snow.";
  }
  if (id === "beiliu") {
    if (influence(state, player) < CONVERT_COST) return `Needs ${CONVERT_COST} influence.`;
    if (hostagesIn(state, player).length === 0) return "You hold no hostage.";
  }
  if (id === "ethereal") {
    const { take, give } = foresightOptions(state, player);
    if (take.length === 0) return "The character deck is empty.";
    if (give.length === 0) return "You have no other character to put back.";
  }
  if (id === "daxgrim") {
    if (amount(state, player, "gold") < 2) return "Needs 2 gold.";
    if (breweries(state, player) < 2) return "Needs 2 breweries.";
    if (transferOptions(state, player).length === 0) return "No army of another player stands next to one of your armies that has room for more strength.";
  }
  if (id === "uhzrun") {
    if (breweries(state, player) < 1) return "Needs at least 1 brewery.";
    if (amount(state, player, "stone") < 1) return "Needs at least 1 stone.";
  }
  if (id === "jaggengrog" && breweries(state, player) < 1) return "Needs at least 1 brewery.";
  if (id === "anvatsio" && trickleTargets(state, player).length === 0) return "No other player holds a Trade Treaty of yours.";
  if (id === "koroko" && tradegoods(state, player) < 1) return "Needs 1 tradegood.";
  if (id === "carvano") {
    if (state.chapterUsed?.carvano === chaptersDone(state)) return "Already used this chapter.";
    if (tradeTreaties(state, player).length === 0) return "You hold no Trade Treaties.";
    if (!state.order.every(other => other === player || holdsTreaty(state, other, player, "trade"))) return "Every other player must hold a Trade Treaty of yours.";
  }
  if (id === "sunumo") {
    if (amount(state, player, "mana") < TSUNAMI_COST) return `Needs ${TSUNAMI_COST} mana.`;
    if (tsunamiTargets(state, player).length === 0) return "No building of another player next to an ocean stands within 3 tiles of one of your armies.";
  }
  return null;
}

const chaptersDone = (state: KinState) => state.chapter?.history.length ?? 0;
// Anvatsio: other players who hold a Trade Treaty of yours.
const trickleTargets = (state: KinState, player: string) => state.order.filter(other => other !== player && holdsTreaty(state, other, player, "trade"));

export interface AbilityOption {
  character: string;
  reason: string | null;
  targets?: string[];
  leaps?: { army: string; over: number; tiles: number[] }[];
  take?: string[];
  give?: string[];
  hostages?: string[];
  players?: { player: string; types: string[] }[];
  converts?: string[];
  trample?: string[];
  trades?: string[];
  grog?: GrogOptions;
  transfers?: { from: string; to: string[] }[];
  refine?: number;
  // The ability the character has now when it is not its own (Birchawe).
  ability?: string;
  borrow?: string[];
  rejuvenate?: string[];
  forests?: { forest: number; tiles: number[] }[];
  lumber?: number;
  dedicate?: { building: string; current: string }[];
  shadow?: { army: string; tiles: number[] }[];
}

// Foresight: characters in the deck to take, and characters in your court to give (not the Ethereal, not hostages).
export function foresightOptions(state: KinState, player: string): { take: string[]; give: string[] } {
  const cards = Object.values(state.cards);
  return {
    take: cards.filter(card => card.zone === "deck:character" && !card.owner).map(card => card.id),
    give: cards.filter(card => card.owner === player && card.id !== "ethereal" && !card.hostageOf).map(card => card.id)
  };
}

export function abilityOptions(state: KinState, player: string): AbilityOption[] {
  return TAP_ABILITIES.filter(cardId => state.cards[cardId]?.owner === player).map(cardId => {
    const id = abilityOf(state, cardId);
    const reason = abilityReason(state, player, cardId);
    return {
      character: cardId,
      reason,
      ...(id !== cardId ? { ability: id } : {}),
      ...(id === "birchawe" && !reason ? { borrow: borrowTargets(state, player) } : {}),
      ...(id === "maprassil" && !reason ? { rejuvenate: rejuvenationTargets(state) } : {}),
      ...(id === "yewanna" && !reason ? { forests: movingForest(state, player) } : {}),
      ...(id === "leavavel" && !reason ? { lumber: amount(state, player, "lumber") } : {}),
      ...(id === "arachonos" && !reason ? { targets: webTargets(state, player) } : {}),
      ...(id === "coppygen" && !reason ? { targets: researchTargets(state, player) } : {}),
      ...(id === "nitrosium" && !reason ? { targets: sabotageTargets(state, player) } : {}),
      ...(id === "aurosphoros" && !reason ? { targets: barrageTargets(state, player) } : {}),
      ...(id === "sneachy" && !reason ? { leaps: leapOptions(state, player) } : {}),
      ...(id === "beiliu" && !reason ? { hostages: hostagesIn(state, player) } : {}),
      ...(id === "lumon" && !reason ? { players: lumonOptions(state, player) } : {}),
      ...(id === "wololay" && !reason ? { converts: convertTargets(state, player) } : {}),
      ...(id === "horned-hoof" && !reason ? { trample: trampleTargets(state, player) } : {}),
      ...(id === "dinker" && !reason ? { trades: dinkerOptions(state, player) } : {}),
      ...(id === "sha-shi-oq" && !reason ? { dedicate: dedicatedBuildings(state, player).map(building => ({ building: building.id, current: building.dedication! })) } : {}),
      ...(id === "ogilgalog" && !reason ? { shadow: shadowOptions(state, player) } : {}),
      ...(id === "grog-og-n-zog" && !reason ? { grog: grogOptions(state, player) } : {}),
      ...(id === "daxgrim" && !reason ? { transfers: transferOptions(state, player) } : {}),
      ...(id === "uhzrun" && !reason ? { refine: refineMax(state, player) } : {}),
      ...(id === "anvatsio" && !reason ? { targets: trickleTargets(state, player) } : {}),
      ...(id === "sunumo" && !reason ? { targets: tsunamiTargets(state, player) } : {}),
      ...(id === "ethereal" && !reason ? foresightOptions(state, player) : {})
    };
  });
}

// Can the player use a tap ability in this phase? Keeps the Expansion phase from ending while they still can.
export const hasAbilityFor = (state: KinState, player: string, phase: PlayPhase) =>
  TAP_ABILITIES.some(cardId => {
    const own = PHASE[abilityOf(state, cardId)];
    return (own === phase || own === "any") && state.cards[cardId]?.owner === player && abilityReason(state, player, cardId) === null;
  });

export function validateAbility(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const play = state.play;
  const cardId = String(action.character);
  if (!play) return "The game is not being played yet.";
  if (play.turn !== player) return "It is not your turn.";
  if (play.move || play.barter || play.battle || play.council || play.auction || play.quantum || play.consent) return "Finish what is in progress first.";
  if (!TAP_ABILITIES.includes(cardId)) return "That character has no ability to activate.";
  const reason = abilityReason(state, player, cardId);
  if (reason) return reason;
  const id = abilityOf(state, cardId);
  if (id === "leavavel") {
    if (!LEAVAVEL_CONVERT.includes(String(action.to))) return "Choose gold, stone or food.";
    if (!(Number.isInteger(action.amount) && (action.amount as number) >= 1 && (action.amount as number) <= amount(state, player, "lumber"))) return `Choose 1 to ${amount(state, player, "lumber")} lumber to convert.`;
  }
  if (id === "maprassil" && !rejuvenationTargets(state).includes(String(action.army))) return "Choose an army standing on a forest that has room for more strength.";
  if (id === "birchawe" && !borrowTargets(state, player).includes(String(action.target))) return "Choose a character with an ability in the court of another player.";
  if (id === "yewanna" && !movingForest(state, player).some(option => option.forest === action.forest && option.tiles.includes(action.tile as number))) return "Choose an unbuilt armiless forest and an unbuilt armiless tile next to it that is not forest or ocean.";
  if (id === "wimblewhisker" && !BASIC.includes(String(action.resource))) return "Choose gold, lumber, stone or food.";
  if (id === "arachonos" && !webTargets(state, player).includes(String(action.army))) return "Choose an army of another player next to one of your armies.";
  if (id === "sneachy") {
    const leap = leapOptions(state, player).find(option => option.army === action.army && option.over === action.over);
    if (!leap || !leap.tiles.includes(action.tile as number)) return "Choose an army, a building of another player next to it, and an empty tile next to that building.";
  }
  if (id === "beiliu" && !hostagesIn(state, player).includes(String(action.hostage))) return "Choose a hostage in your court.";
  if (id === "lumon") return lumonError(state, player, action);
  if (id === "horned-hoof" && !trampleTargets(state, player).includes(String(action.army))) return "Choose an army of strength 1 next to one of your armies.";
  if (id === "dinker" && !dinkerOptions(state, player).includes(String(action.pay))) return "Choose a resource you can pay: food, stone or gold.";
  if (id === "sha-shi-oq") {
    const building = dedicatedBuildings(state, player).find(candidate => candidate.id === action.building);
    if (!building) return "Choose one of your villages or cities with a dedication.";
    if (!DEDICATIONS.includes(String(action.resource)) || action.resource === building.dedication) return "Choose another resource: gold, lumber, stone or food.";
  }
  if (id === "ogilgalog" && !shadowOptions(state, player).some(option => option.army === action.army && option.tiles.includes(action.tile as number))) return "Choose an army on a village, city or Sleeping City of yours and another one of yours without an army.";
  if (id === "coppygen" && !researchTargets(state, player).includes(String(action.building))) return "Choose a village or city of another player next to the Ark.";
  if (id === "nitrosium" && !sabotageTargets(state, player).includes(String(action.building))) return "Choose a building of another player next to one of your armies.";
  if (id === "aurosphoros" && !barrageTargets(state, player).includes(String(action.army))) return "Choose an army of another player next to the Ark.";
  if (id === "wololay" && !convertTargets(state, player).includes(String(action.army))) return "Choose an army that is weaker than one of yours next to it, of a player holding 3 of your treaties.";
  if (id === "ethereal") {
    const { take, give } = foresightOptions(state, player);
    if (!take.includes(String(action.take))) return "Foresight: choose a character from the character deck.";
    if (!give.includes(String(action.give))) return "Foresight: choose a character from your court (not the Ethereal or a hostage).";
  }
  if (id === "daxgrim" && !transferOptions(state, player).some(option => option.from === action.from && option.to.includes(String(action.to)))) return "Choose an army of another player and one of your armies next to it that has room for more strength.";
  if (id === "uhzrun" && !(Number.isInteger(action.amount) && (action.amount as number) >= 1 && (action.amount as number) <= refineMax(state, player))) return `Choose 1 to ${refineMax(state, player)} stone to turn into gold.`;
   if (id === "anvatsio" && !trickleTargets(state, player).includes(String(action.target))) return "Choose another player who holds a Trade Treaty of yours.";
   if (id === "sunumo" && !tsunamiTargets(state, player).includes(String(action.building))) return "Choose a building of another player next to an ocean and within 3 tiles of one of your armies.";
   return null;
}

export function activateAbility(state: KinState, player: string, action: Record<string, unknown>) {
  const cardId = String(action.character);
  const id = abilityOf(state, cardId);
  if (id === "leavavel") {
    state.players[player].resources.mana -= 2;
    state.players[player].resources.lumber -= action.amount as number;
    gain(state, player, String(action.to), action.amount as number);
  } else if (id === "maprassil") {
    state.players[player].resources.mana -= 2;
    state.armies.find(army => army.id === action.army)!.strength += 1;
  } else if (id === "birchawe") {
    state.players[player].resources.mana -= 2;
    (state.borrowed ??= {})[cardId] = String(action.target);
    announce(state, `${name(state, player)}'s Birchawe borrowed an ability until the end of the round.`);
  } else if (id === "yewanna") {
    state.players[player].resources.mana -= 2;
    swapTiles(state, action.forest as number, action.tile as number);
    announce(state, `${name(state, player)}'s Yewanna moved a forest.`);
  } else if (id === "torke") gain(state, player, "gear");
  else if (id === "steen") gain(state, player, "stone");
  else if (id === "horned-hoof") {
    state.players[player].resources.mana -= 1;
    const target = state.armies.find(army => army.id === action.army)!;
    breakOnAttack(state, player, target.owner);
    target.strength -= 1;
    state.armies = state.armies.filter(army => army.strength > 0);
    announce(state, `${name(state, player)}'s Horned Hoof trampled an army of ${name(state, target.owner)}.`);
  } else if (id === "dinker") {
    const pay = String(action.pay);
    state.players[player].resources[pay] -= 1;
    gain(state, player, DINKER_TRADES[pay]);
  } else if (id === "grog-og-n-zog") grogRoll(state, player, action);
  else if (id === "sha-shi-oq") {
    state.players[player].resources.mana -= 1;
    state.buildings.find(building => building.id === action.building)!.dedication = String(action.resource);
  } else if (id === "ogilgalog") state.armies.find(army => army.id === action.army)!.tile = action.tile as number;
  else if (id === "coppygen") {
    // The owner of the building must agree; the turn ends once they answered.
    const building = state.buildings.find(candidate => candidate.id === action.building)!;
    state.cards[cardId].tapped = true;
    state.play!.passes = 0;
    state.play!.consent = { player, owner: building.owner!, building: building.id };
    return;
  } else if (id === "nitrosium") {
    state.players[player].resources.mana -= 1;
    (state.sabotaged ??= []).push(String(action.building));
  } else if (id === "aurosphoros") {
    state.players[player].resources.mana -= 2;
    const target = state.armies.find(army => army.id === action.army)!;
    breakOnAttack(state, player, target.owner);
    target.strength -= 3;
    state.armies = state.armies.filter(army => army.strength > 0);
    announce(state, `${name(state, player)}'s Aurosphoros fired its Barrage Cannon at an army of ${name(state, target.owner)}.`);
  }
  else if (id === "lumon") {
    state.players[player].resources.mana -= 4;
    forceTreaty(state, player, action);
  } else if (id === "wololay") {
    state.players[player].resources.mana -= 2;
    state.armies.find(army => army.id === action.army)!.owner = player;
  } else if (id === "prishna") {
    for (const resource of BASIC) state.players[player].resources[resource] -= 1;
    gain(state, player, "mana", 2);
  }
  else if (id === "wimblewhisker") {
    state.players[player].resources.mana -= 1;
    gain(state, player, String(action.resource));
  } else if (id === "arachonos") {
    state.players[player].resources.mana -= 3;
    state.armies.find(army => army.id === action.army)!.status = "exhausted";
  } else if (id === "sneachy") state.armies.find(army => army.id === action.army)!.tile = action.tile as number;
  else if (id === "eyir") {
    state.players[player].resources.mana -= 4;
    applyAttrition(state);
  } else if (id === "beiliu") {
    spendInfluence(state, player, CONVERT_COST);
    delete state.cards[String(action.hostage)].hostageOf;
  } else if (id === "ethereal") {
    // Foresight: the chosen court character goes back to the deck and the chosen deck character joins the court.
    const give = state.cards[String(action.give)];
    const take = state.cards[String(action.take)];
    give.owner = null;
    give.zone = "deck:character";
    give.tapped = false;
    take.owner = player;
    take.zone = `court:${player}`;
  } else if (id === "daxgrim") {
    state.players[player].resources.gold -= 2;
    const from = state.armies.find(army => army.id === action.from)!;
    breakOnAttack(state, player, from.owner);
    from.strength -= 1;
    state.armies.find(army => army.id === action.to)!.strength += 1;
    state.armies = state.armies.filter(army => army.strength > 0);
    announce(state, `${name(state, player)}'s Daxgrim took 1 strength from an army of ${name(state, from.owner)} with Arkenax.`);
  } else if (id === "uhzrun") {
    const stone = action.amount as number;
    state.players[player].resources.stone -= stone;
    gain(state, player, "gold", stone);
  } else if (id === "jaggengrog") gain(state, player, "gold", breweries(state, player));
  else if (id === "anvatsio") gain(state, String(action.target), "gold", 2);
  else if (id === "koroko") {
    state.players[player].resources[TRADEGOOD] -= 1;
    gain(state, player, "gold", 2);
  } else if (id === "carvano") {
    const count = tradeTreaties(state, player).length;
    gain(state, player, "relic", count);
    (state.chapterUsed ??= {}).carvano = chaptersDone(state);
  } else if (id === "sunumo") tsunami(state, player, String(action.building));
  state.cards[cardId].tapped = true;
  state.play!.passes = 0;
  endTurn(state);
}

// Grog: the player names a choice for each result beforehand (grow, march, untap); the d3 decides which applies. A missing or
// invalid choice means the player declines that result.
function grogRoll(state: KinState, player: string, action: Record<string, unknown>) {
  const roll = rollDie(state.rng, 3);
  const options = grogOptions(state, player);
  if (roll === 1 && options.grow.includes(String(action.grow))) state.armies.find(army => army.id === action.grow)!.strength += 1;
  else if (roll === 2) {
    const march = options.march.find(option => option.army === action.marchArmy);
    if (march && march.tiles.includes(action.marchTile as number)) state.armies.find(army => army.id === action.marchArmy)!.tile = action.marchTile as number;
  } else if (roll === 3 && options.untap.includes(String(action.untap))) state.cards[String(action.untap)].tapped = false;
  announce(state, `${name(state, player)}'s Grog rolled a ${roll}.`);
}

// --- Znort: Cowardly ---

// The unbuilt plains the defending army could run to.
export function fleeTiles(state: KinState, defender: string): number[] {
  const battle = state.play?.battle;
  const holder = characterAbilityHolder(state, defender, "znort");
  if (!battle || battle.defender !== defender || battle.round || !holder || state.cards[holder].tapped) return [];
  if (!state.armies.some(army => army.tile === battle.tile && army.owner === defender)) return [];
  return adjacent(state, defender, battle.tile).filter(tile =>
    state.tiles[tile].terrain === "plains" && isUnbuiltTile(state, tile) && !state.armies.some(army => army.tile === tile) && !wallBlocks(state, defender, battle.tile, tile));
}

export function validateFlee(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const battle = state.play?.battle;
  if (!battle) return "There is no battle to flee from.";
  if (battle.defender !== player) return "The battle is not against you.";
  return fleeTiles(state, player).includes(action.tile as number) ? null : "Znort needs to be untapped, with an unbuilt plains next to the attacked army.";
}

export function flee(state: KinState, player: string, action: Record<string, unknown>) {
  const play = state.play!;
  const battle = play.battle!;
  const army = state.armies.find((candidate: Army) => candidate.tile === battle.tile && candidate.owner === player)!;
  const holder = characterAbilityHolder(state, player, "znort");
  if (holder) state.cards[holder].tapped = true;
  army.tile = action.tile as number;
  play.battle = null;
  announce(state, `${name(state, player)}'s army fled from ${name(state, battle.attacker)}'s attack with Znort: the battle is cancelled.`);
  endTurn(state);
}
