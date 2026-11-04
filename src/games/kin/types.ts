import type { BuildingKind } from "./buildings.data";
import type { Rng } from "./rng";
import type { Terrain, WorldState } from "./world";

export const MAX_PLAYERS = 10;
export const MIN_PLAYERS = 1;
export const MAX_USERS = 20;
export const STATE_VERSION = 1;

export type GameMode = "short" | "long" | "campaign";
export const GAME_MODES: readonly GameMode[] = ["short", "long", "campaign"];

// "lobby" -> "draft" (world setup, Kin and character picks, starting setup) -> "playing" -> "results".
export type KinPhase = "lobby" | "draft" | "playing" | "results";

export interface KinOptions {
  mode: GameMode;
  // When on, the host gets cheat tools in later milestones.
  testing: boolean;
}

export interface KinPlayer {
  id: string;
  username: string;
  connected: boolean;
  // Basic and special resources by name, e.g. { gold: 3, mana: 1 }.
  resources: Record<string, number>;
  relicsTapped?: number;
}

// Where a card currently is, e.g. "deck:event", "court:<playerId>", "discard:event".
export type Zone = string;

export interface Card {
  id: string;
  // Key into the (later) card definitions.
  def: string;
  zone: Zone;
  owner: string | null;
  tapped: boolean;
  // A hostage: the court of the player holding it is `owner`; this is the player it belongs to. It is locked.
  hostageOf?: string;
}

export interface Item {
  id: string;
  // Key into CARDS (cards.data.ts).
  def: string;
  // "court:<playerId>", "board:building", "board:phase" (action and event cards), "board:research" or "board:public".
  zone: Zone;
  owner: string | null;
  tapped: boolean;
  // Treaties: the player that gave it away. The owner is the receiver.
  giver?: string;
  // Peace Treaty: rounds left.
  duration?: number;
  // Promise Treaty: the promise in plain text and the player that judges it.
  promise?: string;
  arbiter?: string;
}

export interface Building {
  id: string;
  // Key into BUILDINGS (buildings.data.ts).
  def: string;
  // Player id; roads belong to nobody.
  owner: string | null;
  kind: BuildingKind;
  // Tile the building is on; -1 is the Ark board.
  tile: number;
  // Slice and edge buildings: the side of the tile (see sideCorners in world.ts).
  side?: number;
  // Cross buildings: the other tile it reaches.
  to?: number;
  // Underwater Cult (Deep Ones): the resource a village or city is dedicated to.
  dedication?: string;
}

export interface Army {
  id: string;
  owner: string;
  tile: number;
  strength: number;
  // Exhausted armies cannot Move, Reinforce, Harvest or Battle. Overexhausted ones become exhausted at the next Seasons Change.
  status?: "exhausted" | "overexhausted";
  // Embarked armies can move over oceans.
  embarked?: boolean;
}

export interface Tile {
  col: number;
  row: number;
  terrain: Terrain;
  tapped: boolean;
}

export type Action = { type: string; actor: { id: string; username: string; isHost: boolean } } & Record<string, unknown>;

export interface LogEntry {
  seq: number;
  action: Action;
}

export type PlayPhase = "event" | "discovery" | "expansion" | "control";

// What is tapped to pay for an action: a character, an activation card, or the Graphiscope tactics card (discarded when used).
export type SourceKind = "character" | "item" | "tactic";

// A Move in progress: the card that was tapped for it and the army being moved. Speed is counted in halves, so 2 is one full speed.
export interface MoveState {
  player: string;
  army: string;
  source: { kind: SourceKind; id: string };
  speed: number;
  moved: boolean;
}

// What one side puts into a Barter: resources, characters from its court and treaties it holds.
export interface BarterGoods {
  resources: Record<string, number>;
  characters: string[];
  treaties: string[];
  // Tradegoods (Seven Streams Syndicate): the basic resource the tradegoods in this offer turn into for the receiver.
  tradegoodAs?: string;
}

// A new treaty made by its giver for this Barter. The other side of the Barter receives it.
export interface BarterTreaty {
  def: string;
  giver: "from" | "to";
  duration?: number;
  promise?: string;
  arbiter?: string;
}

// An offer waiting for the other player to accept or decline. `give` comes from the offering player, `take` from the other.
export interface BarterOffer {
  from: string;
  to: string;
  source: { kind: SourceKind; id: string };
  give: BarterGoods;
  take: BarterGoods;
  mint: BarterTreaty[];
}

// A Promise Treaty the arbiter still has to judge after the Lapsed Treaties event.
export interface Verdict {
  treaty: string;
  arbiter: string;
}

// A Battle waiting for the defender: the attacker has tapped their general and chosen their dice, the defender answers.
export type DiceKind = "strategic" | "aggressive" | "ambush" | "defensive";
export type DiceChoice = Partial<Record<DiceKind, number>>;

export interface BattleState {
  attacker: string;
  defender: string;
  army: string;
  tile: number;
  // The attacker's general: a character or activation card.
  source: { kind: SourceKind; id: string };
  generalPower: number;
  // Strength added to the general's pool by Barendam's Smite.
  smite?: number;
  // Liangzhuge's prediction of the hits the defender rolls (already paid).
  predict?: number;
  dice: DiceChoice;
  // Set once the defender answered and the dice are rolled; the rest of the battle runs step by step with reactions in between.
  round?: BattleRound;
}

// The battle after the roll. `dice`: before Resolve Dice (Dorhor, Iherat); `ambush`: damage dealt, before Ambush (Bulu, Relic Seekers);
// `after`: the hostages are taken, the battle has fully resolved (Taahira, Dolomor Darkeye).
export interface BattleRound {
  stage: "dice" | "ambush" | "after";
  report: BattleReport;
  defenderGeneral: { id: string; power: number } | null;
  attackerPower: number;
  garrison: number;
  // Liangzhuge's predictions of the hits the opposing side rolls, already paid.
  predicted: { attacker?: number; defender?: number };
  attackerTileBuilt?: boolean;
  defenderTileBuilt?: boolean;
  defendersBefore?: number;
  // Relic Seekers: the attacker chose to steal a relic instead of taking a general hostage.
  steal?: boolean;
}

// A decision a player has to take (or may decline) in the middle of an action. The reactions are a queue in `play.reactions`: the first
// one is active and blocks every other action until its owner answers with `reactionRespond` and between `min` and `max` of the option ids.
export interface ReactionState {
  kind: "dorhor" | "iherat" | "bulu" | "steal" | "taahira" | "dolomor" | "dolomor-army" | "river-toll" | "river-toll-pay";
  owner: string;
  title: string;
  text: string;
  options: { id: string; label: string }[];
  min: number;
  max: number;
  data?: Record<string, string | number>;
}

// What happened in the last Battle, so everybody can see the dice and the damage.
export interface BattleSide {
  player: string;
  general: string | null;
  pool: { general: number; army: number; garrison: number };
  dice: { kind: DiceKind; face: number }[];
  hits: number;
  blocks: number;
  selfHits: number;
  ambush: number;
  // Hits that got through: the hits of the other side plus own self hits, minus the blocks of this side.
  unblocked: number;
}

export interface BattleReport {
  id: number;
  attacker: BattleSide;
  defender: BattleSide;
  tile: number;
  immediate: boolean;
  disbanded: string[];
  weakened: string[];
  destroyed: string | null;
  hostages: string[];
}

// The round loop: which phase it is, whose turn, how many players passed in a row, and a Move in progress.
export interface PlayState {
  selectionStep?: string;
  phase: PlayPhase;
  turn: string;
  passes: number;
  forcePass?: string[];
  move: MoveState | null;
  barter: BarterOffer | null;
  verdicts: Verdict[];
  battle?: BattleState | null;
  reactions?: ReactionState[];
  report?: BattleReport | null;
  found?: Found | null;
  council?: CouncilState | null;
  // The outcome of the last Council event.
  councilResult?: CouncilResult | null;
  // The Tactician auction in progress, the last auction's outcome, and the last tactics or subterfuge card that was played.
  auction?: AuctionState | null;
  auctionResult?: AuctionResult | null;
  notice?: { id: number; text: string } | null;
  // Quantum Collapse: the Ethereal is choosing which cards to draw. Only the chooser sees the options.
  quantum?: QuantumState | null;
  // Coppygen: the owner of a village or city is asked for permission.
  consent?: ConsentState | null;
}

export interface ConsentState {
  player: string;
  owner: string;
  building: string;
  // Counterfuge (Rohdrimbral): the secret tactics card that was drawn; the owner may discard it and draw again.
  counterfuge?: string;
  // Qumono, Merciful Plea: `player` is the defender and `owner` the attacker, who pays 2 gold or cancels. The defender's pending answer to the battle.
  plea?: Record<string, unknown>;
}

// Calculators: a secret prediction by the Archive Ark that `target` takes `action` (an action card) with `character` this round.
export interface Prediction {
  player: string;
  target: string;
  action: string;
  character: string;
  round: number;
}

export interface QuantumState {
  player: string;
  kind: "subterfuge" | "laws";
  options: string[];
  pick: number;
  activator: string;
}

// A Tactician auction: the card drawn, the bidders in bidding order, those still in, and the highest bid so far.
export interface AuctionState {
  activator: string;
  card: string;
  order: string[];
  active: string[];
  bid: number;
  leader: string | null;
}

export interface AuctionResult {
  id: number;
  card: string;
  winner: string | null;
  bid: number;
}

// The tactics deck: tactics cards and secret tactics cards. Tactics cards held by players lie open in their court.
export interface TacticsBoard {
  deck: string[];
  discard: string[];
  hands: Record<string, string[]>;
  // Which science has already shuffled its cards into the deck.
  shuffled: { tactics: boolean; secret: boolean };
  // Players whose Explore this round picks the outcome (Great Archeologist).
  archeologists: string[];
}

// The subterfuge deck; the cards in the hands are hidden from the other players.
export interface SubterfugeBoard {
  deck: string[];
  discard: string[];
  hands: Record<string, string[]>;
}

// A Council in progress: the three laws drawn and the votes so far. The voters vote one by one in natural order.
export interface CouncilState {
  activator: string;
  laws: string[];
  voters: string[];
  votes: Record<string, string>;
  // Voters who paid influence for Yamanano's Grand Works (+3 votes).
  grand?: string[];
}

export interface CouncilResult {
  id: number;
  laws: string[];
  tally: Record<string, number>;
  enacted: string | null;
}

// A block lying on a tile: ruins that can be explored, and the treasure and relic blocks they turn into.
export type BlockKind = "ruins" | "treasure" | "relic";

export interface Block {
  tile: number;
  kind: BlockKind;
}

// The last Explore: the d6 roll and what the ruins turned out to be.
export interface Found {
  id: number;
  player: string;
  tile: number;
  roll: number;
  result: "warp" | "treasure" | "relic";
}

export interface ChapterState {
  current: string;
  // The winner of the previous chapter; there is no leader during the first chapter.
  leader: string | null;
  history: { chapter: string; winner: string; round: number }[];
  // Campaign points per player.
  points: Record<string, number>;
}

export interface GameResult {
  winner: string;
  reason: string;
  mode: GameMode;
  chapter: string;
  round: number;
  // For each of the six comparison areas, who held the strict most.
  areas: Record<string, string | null>;
  points: Record<string, number>;
}

export interface KinState {
  version: number;
  phase: KinPhase;
  options: KinOptions;
  players: Record<string, KinPlayer>;
  // Player ids in turn order ("natural order"); set when the game starts. Empty in the lobby.
  order: string[];
  // Join order in the lobby.
  seats: string[];
  rng: Rng;
  round: number;
  cards: Record<string, Card>;
  // Placed buildings and armies on the world board (the Ark board counts as tile -1).
  buildings: Building[];
  armies: Army[];
  // Cards other than characters: technologies, blueprints, faction effects, treaties, action and event cards, ...
  items: Item[];
  // Indexed by tile index (see world.ts); empty until the game starts.
  tiles: Tile[];
  // Ruins, treasure blocks and relic blocks; created by the first Archeology event.
  blocks?: Block[];
  // The law deck, its discard pile and the enacted law; created by the first Council event.
  laws?: { deck: string[]; discard: string[]; enacted: string | null };
  tactics?: TacticsBoard;
  subterfuge?: SubterfugeBoard;
  // "giver>receiver" for every Trade Treaty that was given (Doropolopolos).
  tradeGiven?: string[];
  // Calculators predictions of this round, and the buildings Nitrosium sabotaged for the rest of the round.
  predictions?: Prediction[];
  sabotaged?: string[];
  // Power set at Seasons Change for characters whose power is dynamic (Khaz, Gottrek).
  charPower?: Record<string, number>;
  // Once-per-chapter abilities (Carvano): character id -> number of chapters that were finished when it was last used.
  chapterUsed?: Record<string, number>;
  // Birchawe, Nature's Splendour: character id -> the character whose ability it has until the end of the round.
  borrowed?: Record<string, string>;
  // Chosen Thrall (Deep Ones): Deep Ones player id -> the character they secretly chose.
  thralls?: Record<string, string>;
  world: WorldState | null;
  // Null until the setup is finished.
  play: PlayState | null;
  // The chapter being played and the chapters that were won; the result is set once the game is won.
  chapter?: ChapterState;
  result?: GameResult | null;
  log: LogEntry[];
  recorded: boolean;
}
