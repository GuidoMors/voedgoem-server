import { addItem, hasCard } from "./cards";
import { untappedRelics } from "./relics";
import { cardById } from "./cards.data";
import { activationError, endTurn, setTapped } from "./play";
import { onBarter } from "./tactics";
import { hasChar, onTradeGiven } from "./neutrals";
import { diplomatGift } from "./lumon";
import { BASIC, TRADEGOOD, tradespeople } from "./streams";
import type { Action, BarterGoods, BarterOffer, BarterTreaty, Building, Item, KinState } from "./types";
import { neighbors, sideCorners, sideNeighbor, vertexTiles } from "./world";

export const TREATY_TYPES = ["trade", "access", "peace", "faction", "promise", "vassal"] as const;
export type TreatyType = typeof TREATY_TYPES[number];

export const treatyDef = (type: TreatyType) => `${type}-treaty`;
export const banDef = (type: TreatyType) => `${type}-ban`;
// The technology that lets you barter a treaty.
export const diplomacyDef = (type: TreatyType) => `${type}-diplomacy`;
export const treatyType = (def: string): TreatyType | null => TREATY_TYPES.find(type => treatyDef(type) === def) ?? null;

const BARTER_RESOURCES = ["gold", "lumber", "stone", "food", "gear", "mana", "relic", "tradegood"];
const court = (player: string) => `court:${player}`;

export const treatiesHeldBy = (state: KinState, player: string) => state.items.filter(item => item.zone === court(player) && treatyType(item.def));

// Does `holder` hold a treaty of this type given by `giver`?
export const holdsTreaty = (state: KinState, holder: string, giver: string, type: TreatyType) =>
  state.items.some(item => item.def === treatyDef(type) && item.zone === court(holder) && item.giver === giver);

export const hasBan = (state: KinState, player: string, type: TreatyType) => state.items.some(item => item.def === banDef(type) && item.zone === court(player));

export const hasTech = (state: KinState, player: string, def: string) => state.items.some(item => item.def === def && (item.zone === court(player) || item.zone === "board:public"));

const footprint = (building: Building) => building.tile < 0 ? [] : building.to !== undefined ? [building.tile, building.to] : [building.tile];

// Water routes can start at either player's Harbor and end at the other's tile building.
export function connected(state: KinState, a: string, b: string): boolean {
  const tilesOf = (player: string) => state.buildings.filter(building => building.owner === player).flatMap(footprint);
  const theirs = new Set(tilesOf(b));
  for (const tile of tilesOf(a)) if (theirs.has(tile) || neighbors(tile).some(next => theirs.has(next))) return true;
  const occupied = new Set(state.buildings.filter(building => building.kind === "tile" && building.tile >= 0).map(building => building.tile));
  const ocean = (tile: number) => state.tiles[tile]?.terrain === "ocean" && !occupied.has(tile);
  const graph = new Map<string, Set<string>>();
  const link = (first: string, second: string) => {
    if (!graph.has(first)) graph.set(first, new Set());
    if (!graph.has(second)) graph.set(second, new Set());
    graph.get(first)!.add(second);
    graph.get(second)!.add(first);
  };
  for (const edge of Object.keys(state.world?.rivers ?? {})) {
    const [first, second] = edge.split("|");
    link(first, second);
  }
  for (const vertex of [...graph.keys()]) for (const tile of vertexTiles(vertex)) if (ocean(tile)) link(vertex, `ocean:${tile}`);
  for (let tile = 0; tile < state.tiles.length; tile++) if (ocean(tile))
    for (const next of neighbors(tile)) if (ocean(next)) link(`ocean:${tile}`, `ocean:${next}`);

  const reaches = (from: string, to: string) => {
    const destinations = state.buildings.filter(building => building.owner === to && building.kind === "tile" && building.tile >= 0);
    const goals = new Set(destinations.flatMap(building => [
      ...neighbors(building.tile).filter(ocean).map(tile => `ocean:${tile}`),
      ...Array.from({ length: 6 }, (_, side) => sideCorners(building.tile, side)).flat()
    ]));
    const queue = state.buildings.filter(building => building.owner === from && building.def === "harbor" && building.tile >= 0 && Number.isInteger(building.side))
      .flatMap(harbor => {
        const adjacent = sideNeighbor(harbor.tile, harbor.side!);
        return [
          ...sideCorners(harbor.tile, harbor.side!).filter(vertex => graph.has(vertex)),
          ...(adjacent !== null && ocean(adjacent) ? [`ocean:${adjacent}`] : [])
        ];
      });
    const seen = new Set<string>();
    while (queue.length > 0) {
      const node = queue.pop()!;
      if (seen.has(node)) continue;
      if (goals.has(node)) return true;
      seen.add(node);
      for (const next of graph.get(node) ?? []) queue.push(next);
    }
    return false;
  };
  return reaches(a, b) || reaches(b, a);
}

// What a player could put in a Barter, for the UI.
export function barterInfo(state: KinState, player: string) {
  return {
    targets: state.order.filter(other => other !== player).map(other => ({
      player: other, connected: connected(state, player, other),
      giveMintable: TREATY_TYPES.filter(type => hasTech(state, player, diplomacyDef(type)) && !treatyAllowed(state, type, player, other, [])),
      mintable: TREATY_TYPES.filter(type => hasTech(state, other, diplomacyDef(type)) && !treatyAllowed(state, type, other, player, []))
    })),
    mintable: TREATY_TYPES.filter(type => hasTech(state, player, diplomacyDef(type)) && !hasBan(state, player, type))
  };
}

export const dissolvable = (state: KinState, player: string): string[] =>
  treatiesHeldBy(state, player).filter(item => item.giver && item.giver !== player).map(item => item.id);

export function removeItem(state: KinState, item: Item) {
  state.items.splice(state.items.indexOf(item), 1);
  if (state.play) state.play.verdicts = state.play.verdicts.filter(verdict => verdict.treaty !== item.id);
}

function dissolveAll(state: KinState, type: TreatyType, player: string) {
  for (const item of [...state.items]) if (item.def === treatyDef(type) && (item.owner === player || item.giver === player)) removeItem(state, item);
}

// Gaining a ban dissolves every treaty of that type you hold or gave out.
function giveBan(state: KinState, player: string, type: TreatyType) {
  dissolveAll(state, type, player);
  if (!hasBan(state, player, type)) addItem(state, banDef(type), court(player), player);
}

// A treaty is broken: it ends, and the penalty written on it applies. The Vassal Treaty also costs a vassal a hostage and its gold.
export function breakTreaty(state: KinState, breaker: string, item: Item) {
  const type = treatyType(item.def);
  if (!type) return;
  // Student of the Ways: the Ethereal cannot break a Faction Treaty.
  if (type === "faction" && hasCard(state, breaker, "student-of-the-ways")) return;
  const lord = item.owner;
  const giver = item.giver;
  removeItem(state, item);
  if (type === "access" || type === "peace" || type === "promise" || type === "vassal") giveBan(state, breaker, type);
  if (type === "vassal" && breaker === giver && lord) {
    const hostage = Object.values(state.cards).find(card => card.owner === breaker && !card.hostageOf);
    if (hostage) {
      hostage.owner = lord;
      hostage.zone = court(lord);
      hostage.hostageOf = breaker;
    }
    const gold = state.players[breaker].resources.gold ?? 0;
    state.players[breaker].resources.gold = 0;
    state.players[lord].resources.gold = (state.players[lord].resources.gold ?? 0) + gold;
  }
}

// Attacking someone breaks every treaty that is broken by an attack between the two. Combat calls this.
export function breakOnAttack(state: KinState, attacker: string, defender: string) {
  const ends = (item: Item) => (item.owner === attacker && item.giver === defender) || (item.owner === defender && item.giver === attacker);
  for (const item of state.items.filter(candidate => treatyType(candidate.def) && treatyType(candidate.def) !== "promise" && ends(candidate))) {
    if (state.items.includes(item)) breakTreaty(state, attacker, item);
  }
}

// --- Barter ---

const emptyGoods = (): BarterGoods => ({ resources: {}, characters: [], treaties: [] });

function readGoods(value: unknown): BarterGoods | string {
  const raw = (value ?? {}) as Partial<BarterGoods>;
  const goods = emptyGoods();
  for (const [name, amount] of Object.entries(raw.resources ?? {})) {
    if (!BARTER_RESOURCES.includes(name) || !Number.isInteger(amount) || (amount as number) < 0) return "Choose whole amounts of resources.";
    if ((amount as number) > 0) goods.resources[name] = amount as number;
  }
  if (!Array.isArray(raw.characters ?? []) || !Array.isArray(raw.treaties ?? [])) return "The offer is malformed.";
  goods.characters = (raw.characters ?? []).map(String);
  goods.treaties = (raw.treaties ?? []).map(String);
  if (goods.treaties.length > 0) return "Held treaties cannot be traded. Create a new treaty instead.";
  if (goods.resources[TRADEGOOD]) {
    if (!BASIC.includes(String(raw.tradegoodAs))) return "Choose which basic resource the tradegoods turn into.";
    goods.tradegoodAs = String(raw.tradegoodAs);
  }
  return goods;
}

function readMint(value: unknown): BarterTreaty[] | string {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return "The offer is malformed.";
  const result: BarterTreaty[] = [];
  for (const raw of value as Partial<BarterTreaty>[]) {
    if (!raw || (raw.giver !== "from" && raw.giver !== "to") || !treatyType(String(raw.def))) return "Choose a valid treaty.";
    result.push({
      def: String(raw.def),
      giver: raw.giver,
      ...(raw.duration !== undefined ? { duration: Number(raw.duration) } : {}),
      ...(raw.promise !== undefined ? { promise: String(raw.promise).trim() } : {}),
      ...(raw.arbiter !== undefined ? { arbiter: String(raw.arbiter) } : {})
    });
  }
  return result;
}

// Checks that `receiver` may receive a treaty of this type from `giver`.
export function treatyAllowed(state: KinState, type: TreatyType, giver: string, receiver: string, pending: { type: TreatyType; giver: string; receiver: string }[]): string | null {
  const name = cardById(treatyDef(type))?.name ?? type;
  if (giver === receiver) return `You cannot give a ${name} to its own giver.`;
  if (hasBan(state, giver, type) || hasBan(state, receiver, type)) return `A ${cardById(banDef(type))?.name ?? "ban"} stops this ${name}.`;
  if (type !== "promise") {
    const twice = holdsTreaty(state, receiver, giver, type) || pending.filter(entry => entry.type === type && entry.giver === giver && entry.receiver === receiver).length > 1;
    if (twice) return `${state.players[receiver].username} can only hold one ${name} from ${state.players[giver]?.username ?? "that Kin"}.`;
  }
  if (type === "trade" && !connected(state, giver, receiver)) return "A Trade Treaty can only be bartered with a player you are connected to.";
  if (type === "vassal") {
    const others = state.items.some(item => item.def === treatyDef("vassal") && item.giver === giver && item.owner !== receiver);
    if (others || pending.filter(entry => entry.type === "vassal" && entry.giver === giver && entry.receiver !== receiver).length > 0) return "Another player already holds a Vassal Treaty from that giver.";
  }
  return null;
}

// Validates an offer and returns it, or the reason it cannot be made.
export function readOffer(state: KinState, player: string, action: Record<string, unknown>): { offer: BarterOffer } | string {
  const to = String(action.to);
  if (!state.order.includes(to) || to === player) return "Choose another player to barter with.";
  const give = readGoods(action.give);
  const take = readGoods(action.take);
  const mint = readMint(action.mint);
  if (typeof give === "string") return give;
  if (typeof take === "string") return take;
  if (typeof mint === "string") return mint;
  const source = { kind: String(action.kind) as "character" | "item", id: String(action.card) };

  const sides: [string, BarterGoods][] = [[player, give], [to, take]];
  const pending: { type: TreatyType; giver: string; receiver: string }[] = [];
  for (const [owner, goods] of sides) {
    if (goods.resources[TRADEGOOD] && !hasCard(state, owner, "tradegoods")) return "Only the Seven Streams Syndicate can offer tradegoods.";
    for (const [name, amount] of Object.entries(goods.resources)) {
      if (name === "relic" && amount > untappedRelics(state.players[owner])) return `${state.players[owner].username} does not have ${amount} untapped relics.`;
      if (amount > (state.players[owner].resources[name] ?? 0)) return `${state.players[owner].username} does not have ${amount} ${name}.`;
    }
    for (const id of new Set(goods.characters)) {
      const card = state.cards[id];
      if (!card || card.owner !== owner) return "A chosen character is not in that court.";
      if (id === "lumon" || id === "ethereal") return "Lumon and the Ethereal cannot be bartered away.";
      if (source.kind === "character" && source.id === id) return "The character that is tapped for the Barter cannot be offered.";
    }
    if (new Set(goods.characters).size !== goods.characters.length) return "A character was chosen twice.";
  }
  for (const entry of mint) {
    const type = treatyType(entry.def)!;
    const giver = entry.giver === "from" ? player : to;
    const receiver = entry.giver === "from" ? to : player;
    if (!hasTech(state, giver, diplomacyDef(type))) return `${state.players[giver].username} lacks ${cardById(diplomacyDef(type))?.name}.`;
    pending.push({ type, giver, receiver });
    const error = treatyAllowed(state, type, giver, receiver, pending);
    if (error) return error;
    if (type === "peace" && !(Number.isInteger(entry.duration) && entry.duration! >= 1 && entry.duration! <= 10)) return "A Peace Treaty lasts 1 to 10 rounds.";
    if (type === "promise") {
      if (!entry.promise || entry.promise.length > 200) return "Write the promise in up to 200 characters.";
      if (!entry.arbiter || !state.order.includes(entry.arbiter) || entry.arbiter === giver) return "Choose another player as the arbiter.";
    }
  }
  const empty = (goods: BarterGoods) => Object.keys(goods.resources).length + goods.characters.length + goods.treaties.length === 0;
  if (empty(give) && empty(take) && mint.length === 0) return "Offer something.";
  return { offer: { from: player, to, source, give, take, mint } };
}

export function validateBarter(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "barter");
  if (typeof source === "string") return source;
  const offer = readOffer(state, player, action);
  return typeof offer === "string" ? offer : null;
}

// The card is tapped as payment. Now the other player answers.
export function barter(state: KinState, player: string, action: Record<string, unknown>) {
  const { offer } = readOffer(state, player, action) as { offer: BarterOffer };
  setTapped(state, offer.source, true);
  state.play!.passes = 0;
  state.play!.barter = offer;
}

export function validateRespond(state: KinState, player: string): string | null {
  const offer = state.play?.barter;
  if (!offer) return "There is no offer to answer.";
  return offer.to === player ? null : "The offer is not for you.";
}

function transfer(state: KinState, goods: BarterGoods, from: string, to: string) {
  for (const [name, amount] of Object.entries(goods.resources)) {
    state.players[from].resources[name] = (state.players[from].resources[name] ?? 0) - amount;
    // Tradegoods: the receiver gets the basic resource the sender assigned.
    const received = name === TRADEGOOD ? goods.tradegoodAs! : name;
    state.players[to].resources[received] = (state.players[to].resources[received] ?? 0) + amount;
  }
  for (const id of goods.characters) {
    const card = state.cards[id];
    card.owner = to;
    card.zone = court(to);
    // A hostage that goes back to its owner unlocks.
    if (card.hostageOf === to) delete card.hostageOf;
  }
  for (const id of goods.treaties) {
    const item = state.items.find(candidate => candidate.id === id)!;
    item.owner = to;
    item.zone = court(to);
  }
}

export function respond(state: KinState, accept: boolean) {
  const play = state.play!;
  const offer = play.barter!;
  play.barter = null;
  if (accept) {
    // Diplomats: treaties that change hands in this barter gift their receiver something.
    const received = [
      ...offer.give.treaties.map(id => ({ id, to: offer.to })),
      ...offer.take.treaties.map(id => ({ id, to: offer.from }))
    ].flatMap(({ id, to }) => {
      const item = state.items.find(candidate => candidate.id === id);
      const type = item && treatyType(item.def);
      return type && item!.giver ? [{ type, giver: item!.giver, receiver: to }] : [];
    });
    for (const entry of offer.mint) received.push({ type: treatyType(entry.def)!, giver: entry.giver === "from" ? offer.from : offer.to, receiver: entry.giver === "from" ? offer.to : offer.from });
    transfer(state, offer.give, offer.from, offer.to);
    transfer(state, offer.take, offer.to, offer.from);
    for (const entry of offer.mint) {
      const giver = entry.giver === "from" ? offer.from : offer.to;
      const receiver = entry.giver === "from" ? offer.to : offer.from;
      const item = addItem(state, entry.def, court(receiver), receiver, giver);
      if (entry.duration !== undefined) item.duration = entry.duration;
      if (entry.promise !== undefined) item.promise = entry.promise;
      if (entry.arbiter !== undefined) item.arbiter = entry.arbiter;
      if (treatyType(entry.def) === "trade") onTradeGiven(state, giver, receiver);
      if (treatyType(entry.def) === "trade") tradespeople(state, receiver, giver);
    }
    // A Trade Treaty untaps the character its giver used in a successful Barter.
    if (state.items.some(item => item.def === treatyDef("trade") && item.giver === offer.from && item.owner === offer.to)) setTapped(state, offer.source, false);
    onBarter(state, offer);
    for (const entry of received) diplomatGift(state, entry.type, entry.giver, entry.receiver);
  }
  play.passes = 0;
  endTurn(state);
}

// --- Dissolve ---

export function validateDissolve(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "dissolve");
  if (typeof source === "string") return source;
  return dissolvable(state, player).includes(String(action.treaty)) ? null : "Choose a treaty in your court that another player gave you.";
}

// Dissolving returns the treaty to its giver; it does not count as breaking it.
export function dissolve(state: KinState, player: string, action: Record<string, unknown>) {
  const source = activationError(state, player, action, "dissolve") as Exclude<ReturnType<typeof activationError>, string>;
  setTapped(state, source, true);
  removeItem(state, state.items.find(item => item.id === action.treaty)!);
  state.play!.passes = 0;
  endTurn(state);
}

// --- Seasons Change and the Lapsed Treaties event ---

// Peace Treaties lose a round and are dissolved at 0.
export function seasonsChangeTreaties(state: KinState) {
  for (const item of [...state.items]) {
    if (item.def !== treatyDef("peace") || item.duration === undefined) continue;
    item.duration -= 1;
    if (item.duration <= 0) removeItem(state, item);
  }
}

// Lapsed Treaties: Trade Treaties between players that are no longer connected are dissolved, and every arbiter has to judge
// the Promise Treaties. The event card then taps.
export const lapsedTrades = (state: KinState) => state.items.filter(item => item.def === treatyDef("trade") && item.giver && item.owner && !connected(state, item.giver, item.owner)
 );
const openPromises = (state: KinState) => state.items.filter(item => item.def === treatyDef("promise") && item.arbiter && !state.play!.verdicts.some(verdict => verdict.treaty === item.id));

export const canLapse = (state: KinState) => lapsedTrades(state).length > 0 || openPromises(state).length > 0;

export function lapsedTreaties(state: KinState) {
  const event = state.items.find(item => item.def === "lapsed-treaties" && item.zone === "board:phase" && !item.tapped);
  if (!event || !canLapse(state)) return;
  for (const item of lapsedTrades(state)) removeItem(state, item);
  for (const item of openPromises(state)) state.play!.verdicts.push({ treaty: item.id, arbiter: item.arbiter! });
  event.tapped = true;
}

export function validateVerdict(state: KinState, player: string, action: Action): string | null {
  const verdict = state.play?.verdicts.find(entry => entry.treaty === action.treaty);
  if (!verdict) return "There is no promise waiting for a verdict.";
  if (verdict.arbiter !== player) return "You are not the arbiter of that promise.";
  return typeof action.broken === "boolean" ? null : "Say whether the promise was broken.";
}

export function verdict(state: KinState, action: Action) {
  const item = state.items.find(candidate => candidate.id === action.treaty);
  state.play!.verdicts = state.play!.verdicts.filter(entry => entry.treaty !== action.treaty);
  if (item && action.broken === true) breakTreaty(state, item.giver!, item);
}
