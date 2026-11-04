import { createRng, nextFloat, randomSeed } from "./rng";
import { relicTapError, tappedRelics, untappedRelics } from "./relics";
import { kinById } from "./kins";
import { characterPicker, characterRound, eligibleCharacters, settleCharacters } from "./draft";
import { addItem, dealBoardCards } from "./cards";
import { mayStopOn, moveStep, pass, startMove, startPlay, stopMove, validateMoveStart, validateMoveStep } from "./play";
import { publicize, research, validatePublicize, validateResearch } from "./tech";
import { build, craftdwarves, demolish, deploy, revoke, validateBuild, validateCraft, validateDemolish, validateDeploy, validateRevoke } from "./expansion";
import { nomads, validateNomads } from "./wanderers";
import { ruthless, validateRuthless } from "./streams";
import { consentRespond, drift, resolvePredictions, validateConsent, validateDrift } from "./ark";
import { quantum, validateQuantum, validateVote, vote } from "./council";
import { bid, fold, playTactic, validateBid, validateFold, validatePlayTactic } from "./tactics";
import { embark, harvest, recruit, reinforce, validateEmbark, validateHarvest, validateRecruit, validateReinforce } from "./control";
import { battle, battleRespond, reactionRespond, validateBattle, validateBattleRespond, validateReaction } from "./battle";
import { activateAbility, flee, validateAbility, validateFlee } from "./neutrals";
import { explore, reclaim, validateExplore, validateReclaim } from "./archeology";
import { activateEvent, eventOptions, validateEvent } from "./events";
import { barter, dissolve, respond, validateBarter, validateDissolve, validateRespond, validateVerdict, verdict } from "./treaties";
import { applySetup, settleSetup, validateSetup } from "./setup";
import {
  LAND, CLIMATES, PILE_SIZE, RIVER_COUNT, TILE_COUNT, climateSpots, createWorld, edgeId, fillClimate, lastPileTotal, pileTotal, riverNext, riverShouldStop, riverStarts, tileCol, tileRow,
  type ClimateTerrain, type LandTerrain, type Terrain, type WorldState, type WorldStep
} from "./world";
import { GAME_MODES, MAX_PLAYERS, MIN_PLAYERS, STATE_VERSION, type Action, type GameMode, type KinState } from "./types";

// Every change to the game goes through dispatch(): the action is validated, applied to the plain-data state and appended to the log.
// Replaying the logged actions on a fresh state with the same seed always reproduces the same state.
interface ActionHandler {
  // Returns an error message, or null when the action is legal.
  validate(state: KinState, action: Action): string | null;
  apply(state: KinState, action: Action): void;
}

export function createState(seed: number = randomSeed()): KinState {
  return {
    version: STATE_VERSION,
    phase: "lobby",
    options: { mode: "short", testing: false },
    players: {},
    order: [],
    seats: [],
    rng: createRng(seed),
    round: 0,
    cards: {},
    buildings: [],
    armies: [],
    items: [],
    tiles: [],
    world: null,
    play: null,
    log: [],
    recorded: false
  };
}

const boardOf = (state: KinState): Terrain[] => state.tiles.map(tile => tile.terrain);

// Returns the world when the game is in the given setup step, otherwise an error message.
function worldIn(state: KinState, step: WorldStep): WorldState | string {
  if (state.phase !== "draft" || !state.world) return "The game is not in setup.";
  return state.world.step === step ? state.world : "That is not part of the current setup step.";
}

// Players take turns clockwise starting with the host (natural turn order).
export const tilePlacer = (state: KinState, world: WorldState) => state.order[(3 * PILE_SIZE - pileTotal(world)) % state.order.length];
export const riverMaker = (state: KinState, world: WorldState) => state.order[world.riversDone % state.order.length];
export const lastTilePlacer = (state: KinState, world: WorldState) => state.order[world.lastPlaced % state.order.length];

// A climate with no free ocean tile left cannot be placed, so its tiles leave the pile. The step ends when the pile is gone.
function settleLastTiles(state: KinState) {
  const world = state.world!;
  for (const climate of CLIMATES) {
    if (climateSpots(boardOf(state), climate).length === 0) world.lastPile[climate] = 0;
  }
  if (lastPileTotal(world) === 0) world.step = "rivers";
}
// Kin are drafted in turn order, host first; nobody picks twice.
export const kinPicker = (state: KinState, world: WorldState) => state.order[Object.keys(world.kinPicks).length];

const inLobby = (state: KinState) => state.phase === "lobby" ? null : "The game has already started.";
const hostOnly = (action: Action) => action.actor.isHost ? null : "Only the host can do that.";
export const RESOURCES = ["gold", "lumber", "stone", "food", "gear", "mana", "relic"];

function removePlayer(state: KinState, id: string) {
  delete state.players[id];
  state.seats = state.seats.filter(seat => seat !== id);
}

const HANDLERS: Record<string, ActionHandler> = {
  join: {
    validate(state, action) {
      const error = inLobby(state);
      if (error) return error;
      if (state.players[action.actor.id]) return "You are already playing.";
      if (state.seats.length >= MAX_PLAYERS) return `All ${MAX_PLAYERS} player slots are taken.`;
      return null;
    },
    apply(state, action) {
      state.players[action.actor.id] = { id: action.actor.id, username: action.actor.username, connected: true, resources: {} };
      state.seats.push(action.actor.id);
    }
  },
  leave: {
    validate: (state, action) => inLobby(state) ?? (state.players[action.actor.id] ? null : "You are not playing."),
    apply: (state, action) => removePlayer(state, action.actor.id)
  },
  kick: {
    validate(state, action) {
      return inLobby(state) ?? hostOnly(action) ?? (typeof action.userId === "string" && state.players[action.userId] ? null : "That player is not in the game.");
    },
    apply: (state, action) => removePlayer(state, action.userId as string)
  },
  setOptions: {
    validate(state, action) {
      const error = inLobby(state) ?? hostOnly(action);
      if (error) return error;
      if (action.mode !== undefined && !GAME_MODES.includes(action.mode as GameMode)) return "Unknown game mode.";
      if (action.testing !== undefined && typeof action.testing !== "boolean") return "Testing must be on or off.";
      return null;
    },
    apply(state, action) {
      if (action.mode !== undefined) state.options.mode = action.mode as GameMode;
      if (action.testing !== undefined) state.options.testing = action.testing as boolean;
    }
  },
  start: {
    validate(state, action) {
      const error = inLobby(state) ?? hostOnly(action);
      if (error) return error;
      return state.seats.length < MIN_PLAYERS ? `At least ${MIN_PLAYERS} players are required to start.` : null;
    },
    apply(state, action) {
      // The host player goes first; everyone else follows in join order.
      const hostSeated = state.seats.includes(action.actor.id);
      state.order = hostSeated ? [action.actor.id, ...state.seats.filter(id => id !== action.actor.id)] : [...state.seats];
      state.phase = "draft";
      state.round = 0;
      state.world = createWorld();
      state.tiles = Array.from({ length: TILE_COUNT }, (_, index) => ({ col: tileCol(index), row: tileRow(index), terrain: "ocean" as const, tapped: false }));
    }
  },
  // Setup step 1: in turn order, each player places one tile from the pile on an ocean tile.
  placeTile: {
    validate(state, action) {
      const world = worldIn(state, "tiles");
      if (typeof world === "string") return world;
      if (action.actor.id !== tilePlacer(state, world)) return "It is not your turn.";
      if (!LAND.includes(action.terrain as LandTerrain)) return "Choose mountain, forest or farmland.";
      if (world.pile[action.terrain as LandTerrain] <= 0) return `There are no ${action.terrain} tiles left in the pile.`;
      if (!Number.isInteger(action.tile) || (action.tile as number) < 0 || (action.tile as number) >= TILE_COUNT) return "Choose a tile on the board.";
      return state.tiles[action.tile as number].terrain === "ocean" ? null : "Tiles can only be placed on an ocean tile.";
    },
    apply(state, action) {
      const world = state.world!;
      state.tiles[action.tile as number].terrain = action.terrain as LandTerrain;
      world.pile[action.terrain as LandTerrain] -= 1;
      if (pileTotal(world) > 0) return;
      // Step 2 needs no choices, so it happens as soon as the pile is gone.
      const board = state.tiles.map(tile => tile.terrain);
      fillClimate(board);
      board.forEach((terrain, index) => { state.tiles[index].terrain = terrain; });
      world.step = "lastTiles";
      settleLastTiles(state);
    }
  },
  // Setup step 3: in turn order, each player places one climate tile from the pile on an ocean tile of that climate.
  placeLastTile: {
    validate(state, action) {
      const world = worldIn(state, "lastTiles");
      if (typeof world === "string") return world;
      if (action.actor.id !== lastTilePlacer(state, world)) return "It is not your turn.";
      if (!CLIMATES.includes(action.terrain as ClimateTerrain)) return "Choose plains, snow or desert.";
      const climate = action.terrain as ClimateTerrain;
      if (world.lastPile[climate] <= 0) return `There are no ${climate} tiles left in the pile.`;
      if (!Number.isInteger(action.tile)) return "Choose a tile on the board.";
      return climateSpots(boardOf(state), climate).includes(action.tile as number) ? null : `A ${climate} tile can only go on an ocean tile in a ${climate} row.`;
    },
    apply(state, action) {
      const world = state.world!;
      state.tiles[action.tile as number].terrain = action.terrain as ClimateTerrain;
      world.lastPile[action.terrain as ClimateTerrain] -= 1;
      world.lastPlaced += 1;
      settleLastTiles(state);
    }
  },
  // Setup step 3: choose the vertex next to a mountain where the river begins (its free end).
  riverStart: {
    validate(state, action) {
      const world = worldIn(state, "rivers");
      if (typeof world === "string") return world;
      if (action.actor.id !== riverMaker(state, world)) return "It is not your turn.";
      if (world.freeEnd) return "Extend the river you are drawing.";
      return typeof action.vertex === "string" && riverStarts(world, boardOf(state)).includes(action.vertex) ? null : "A river must start at a corner of a mountain that is not on a river.";
    },
    apply(state, action) {
      state.world!.freeEnd = action.vertex as string;
    }
  },
  // Move the free end one edge further; the river ends by itself when it touches a river or an ocean tile.
  riverExtend: {
    validate(state, action) {
      const world = worldIn(state, "rivers");
      if (typeof world === "string") return world;
      if (action.actor.id !== riverMaker(state, world)) return "It is not your turn.";
      if (!world.freeEnd) return "Choose where the river starts first.";
      return typeof action.vertex === "string" && riverNext(world, world.freeEnd).includes(action.vertex) ? null : "The river must continue along an edge next to its free end that has no river.";
    },
    apply(state, action) {
      const world = state.world!;
      const to = action.vertex as string;
      world.rivers[edgeId(world.freeEnd!, to)] = world.riversDone;
      world.freeEnd = to;
      if (!riverShouldStop(world, boardOf(state), to)) return;
      world.freeEnd = null;
      world.riversDone += 1;
      if (world.riversDone >= RIVER_COUNT) world.step = "kin";
    }
  },
  // Setup step 4: in turn order, each player picks a different Kin.
  pickKin: {
    validate(state, action) {
      const world = worldIn(state, "kin");
      if (typeof world === "string") return world;
      if (action.actor.id !== kinPicker(state, world)) return "It is not your turn.";
      if (!kinById(action.kin)) return "Choose one of the ten Kin.";
      return Object.values(world.kinPicks).includes(action.kin as string) ? "Another player already picked that Kin." : null;
    },
    apply(state, action) {
      const world = state.world!;
      world.kinPicks[action.actor.id] = action.kin as string;
      if (Object.keys(world.kinPicks).length < state.order.length) return;
      world.step = "setup";
      dealBoardCards(state);
      settleSetup(state);
    }
  },
  // Setup step 4.2: in natural order, place the buildings of the starting setup of your Kin. The action carries a tile or, for a worksite, a side.
  setupPlace: {
    validate(state, action) {
      const world = worldIn(state, "setup");
      return typeof world === "string" ? world : validateSetup(state, action.actor.id, action);
    },
    apply: (state, action) => applySetup(state, action.actor.id, action)
  },
  // Setup step 5: in natural order, claim a character of your Kin, then a Discovery, an Expansion and a Control character.
  pickCharacter: {
    validate(state, action) {
      const world = worldIn(state, "characters");
      if (typeof world === "string") return world;
      if (action.actor.id !== characterPicker(state)) return "It is not your turn.";
      if (typeof action.character !== "string" || !state.cards[action.character]) return "Choose a character that is in this game.";
      return eligibleCharacters(state, action.actor.id, characterRound(state)).some(c => c.id === action.character) ? null : "You cannot claim that character right now.";
    },
    apply(state, action) {
      const card = state.cards[action.character as string];
      card.zone = `court:${action.actor.id}`;
      card.owner = action.actor.id;
      state.world!.charPicks.push(card.id);
      settleCharacters(state);
      if (state.world!.step === "done") startPlay(state);
    }
  },
  // The round loop: in natural order each player activates a card of the current phase or passes.
  selectionStep: {
    validate(state, action) {
      if (!state.play || state.play.turn !== action.actor.id) return "Only the current player can share their selection step.";
      if (action.round !== state.round || action.phase !== state.play.phase) return "The turn has changed.";
      return ["default", "activation", "army", "tile", "building", "blueprint", "technology", "treaty", "dialog"].includes(String(action.step)) ? null : "Unknown selection step.";
    },
    apply(state, action) {
      state.play!.selectionStep = String(action.step);
    }
  },
  tapRelics: {
    validate(state, action) {
      const error = relicTapError(state, action.actor.id);
      if (error) return error;
      if (!Number.isInteger(action.amount) || (action.amount as number) < 1 || (action.amount as number) > untappedRelics(state.players[action.actor.id])) return "Choose a whole number of untapped relics.";
      return ["gold", "lumber", "stone", "food"].includes(String(action.resource)) ? null : "Choose a basic resource.";
    },
    apply(state, action) {
      const player = state.players[action.actor.id];
      player.relicsTapped = tappedRelics(player) + (action.amount as number);
      const resource = String(action.resource);
      player.resources[resource] = (player.resources[resource] ?? 0) + (action.amount as number);
    }
  },
  forcePass: {
    validate(state, action) {
      if (!state.play) return "The game is not being played yet.";
      if (!state.order.includes(action.actor.id)) return "Only players can force pass.";
      return state.play.turn === action.actor.id ? "Use Pass on your own turn." : null;
    },
    apply(state, action) {
      const players = state.play!.forcePass ??= [];
      if (!players.includes(action.actor.id)) players.push(action.actor.id);
    }
  },
  pass: {
    validate(state, action) {
      if (!state.play) return "The game is not being played yet.";
      if (state.play.turn !== action.actor.id) return "It is not your turn.";
      if (state.play.barter) return "Wait for the answer to your barter offer.";
      if (state.play.battle) return "Wait for the defender of your battle.";
      if (state.play.council) return "Vote in the council first.";
      if (state.play.auction) return "Bid or drop out of the auction first.";
      if (state.play.quantum) return "Quantum Collapse: choose your cards first.";
      if (state.play.consent) return "Wait for the answer of the other player.";
      return state.play.move ? "Finish or stop your Move first." : null;
    },
    apply: state => pass(state)
  },
  // Move: tap a Discovery character or activation card, choose an army, then step to adjacent tiles.
  activateMove: {
    validate: (state, action) => validateMoveStart(state, action.actor.id, action),
    apply: (state, action) => startMove(state, action.actor.id, action)
  },
  // Build, Deploy, Demolish: tap Expansion cards. Build and Demolish need enough build power from the cards tapped.
  build: {
    validate: (state, action) => validateBuild(state, action.actor.id, action),
    apply: (state, action) => build(state, action.actor.id, action)
  },
  deploy: {
    validate: (state, action) => validateDeploy(state, action.actor.id, action),
    apply: (state, action) => deploy(state, action.actor.id, action)
  },
  demolish: {
    validate: (state, action) => validateDemolish(state, action.actor.id, action),
    apply: (state, action) => demolish(state, action.actor.id, action)
  },
  // Recruit, Reinforce, Harvest, Embark: tap a Control card.
  recruit: { validate: (state, action) => validateRecruit(state, action.actor.id, action), apply: (state, action) => recruit(state, action.actor.id, action) },
  reinforce: { validate: (state, action) => validateReinforce(state, action.actor.id, action), apply: (state, action) => reinforce(state, action.actor.id, action) },
  harvest: { validate: (state, action) => validateHarvest(state, action.actor.id, action), apply: (state, action) => harvest(state, action.actor.id, action) },
  explore: { validate: (state, action) => validateExplore(state, action.actor.id, action), apply: (state, action) => explore(state, action.actor.id, action) },
  reclaim: { validate: (state, action) => validateReclaim(state, action.actor.id, action), apply: (state, action) => reclaim(state, action.actor.id, action) },
  nomads: { validate: (state, action) => validateNomads(state, action.actor.id, action), apply: (state, action) => nomads(state, action.actor.id, action) },
  ruthless: { validate: (state, action) => validateRuthless(state, action.actor.id, action), apply: (state, action) => ruthless(state, action.actor.id, action) },
  driftingCitadel: { validate: (state, action) => validateDrift(state, action.actor.id, action), apply: (state, action) => drift(state, action.actor.id, action) },
  // Coppygen: the owner of the village or city agrees or declines.
  consentRespond: { validate: (state, action) => validateConsent(state, action.actor.id, action), apply: (state, action) => consentRespond(state, action.accept === true) },
  activateEvent: { validate: (state, action) => validateEvent(state, action.actor.id, action), apply: (state, action) => activateEvent(state, action) },
  // Council: each voter votes for one of the three laws that were drawn. Revoke: tap 5 Expansion power to discard the enacted law.
  vote: { validate: (state, action) => validateVote(state, action.actor.id, action), apply: (state, action) => vote(state, action.actor.id, action) },
  quantum: { validate: (state, action) => validateQuantum(state, action.actor.id, action), apply: (state, action) => quantum(state, action.actor.id, action) },
  revoke: { validate: (state, action) => validateRevoke(state, action.actor.id, action), apply: (state, action) => revoke(state, action.actor.id, action) },
  craftdwarves: { validate: (state, action) => validateCraft(state, action.actor.id, action), apply: (state, action) => craftdwarves(state, action.actor.id, action) },
  // Tactician auction: bid more gold or drop out. Tactics cards are played from your court without using your turn.
  bid: { validate: (state, action) => validateBid(state, action.actor.id, action), apply: (state, action) => bid(state, action.actor.id, action) },
  fold: { validate: (state, action) => validateFold(state, action.actor.id), apply: (state, action) => fold(state, action.actor.id) },
  playTactic: { validate: (state, action) => validatePlayTactic(state, action.actor.id, action), apply: (state, action) => playTactic(state, action.actor.id, action) },
  embark: { validate: (state, action) => validateEmbark(state, action.actor.id, action), apply: (state, action) => embark(state, action.actor.id, action) },
  // Battle: tap a Control card, choose an army, the tile it attacks and the dice; the defender then answers with a general and their dice.
  battle: { validate: (state, action) => validateBattle(state, action.actor.id, action), apply: (state, action) => battle(state, action.actor.id, action) },
  battleRespond: { validate: (state, action) => validateBattleRespond(state, action.actor.id, action), apply: (state, action) => battleRespond(state, action.actor.id, action) },
  // Neutral characters: tap abilities (Torke, Wimblewhisker, Arachonos, Steen, Sneachy) and Znort's Cowardly in reaction to a battle.
  ability: { validate: (state, action) => validateAbility(state, action.actor.id, action), apply: (state, action) => activateAbility(state, action.actor.id, action) },
  flee: { validate: (state, action) => validateFlee(state, action.actor.id, action), apply: (state, action) => flee(state, action.actor.id, action) },
  // Iherat (Deep Ones), Dorhor, Bulu, Relic Seekers, Taahira and Dolomor Darkeye: the decision at the front of the reaction queue of a battle.
  reactionRespond: { validate: (state, action) => validateReaction(state, action.actor.id, action), apply: (state, action) => reactionRespond(state, action.actor.id, action) },
  // Research: tap a Discovery card and pay the gears of a technology on the research track to claim it.
  research: {
    validate: (state, action) => validateResearch(state, action.actor.id, action),
    apply: (state, action) => research(state, action.actor.id, action)
  },
  // Publicize: tap a Discovery card to put a technology from any court on the public track.
  publicize: {
    validate: (state, action) => validatePublicize(state, action.actor.id, action),
    apply: (state, action) => publicize(state, action.actor.id, action)
  },
  moveStep: {
    validate: (state, action) => validateMoveStep(state, action.actor.id, action.tile, action.blocks),
    apply: (state, action) => moveStep(state, action.tile as number, action.blocks as string[] | undefined)
  },
  moveStop: {
    validate(state, action) {
      const move = state.play?.move;
      if (!move) return "You are not moving an army.";
      if (move.player !== action.actor.id) return "It is not your turn.";
      const army = state.armies.find(candidate => candidate.id === move.army)!;
      return mayStopOn(state, move.player, army.tile) ? null : "You may pass buildings of a player who gave you access, but not end a Move on them.";
    },
    apply: state => stopMove(state)
  },
  // Barter: tap a Discovery card, offer goods (and new treaties) to another player, who then accepts or declines.
  barter: {
    validate: (state, action) => validateBarter(state, action.actor.id, action),
    apply: (state, action) => barter(state, action.actor.id, action)
  },
  barterRespond: {
    validate: (state, action) => validateRespond(state, action.actor.id) ?? (typeof action.accept === "boolean" ? null : "Accept or decline."),
    apply: (state, action) => respond(state, action.accept === true)
  },
  // Dissolve: tap a Discovery card to give back a treaty another player gave you.
  dissolve: {
    validate: (state, action) => validateDissolve(state, action.actor.id, action),
    apply: (state, action) => dissolve(state, action.actor.id, action)
  },
  // The arbiter of a Promise Treaty says whether it was broken, after the Lapsed Treaties event.
  verdict: {
    validate: (state, action) => validateVerdict(state, action.actor.id, action),
    apply: (state, action) => verdict(state, action)
  },
  // Testing only: the host gives themselves an activation card (these normally come from the Active technologies and Steampower).
  giveActivation: {
    validate(state, action) {
      if (!state.options.testing) return "Testing mode is off.";
      const error = hostOnly(action);
      if (error) return error;
      if (!state.play) return "The game is not being played yet.";
      return ["activation-discovery", "activation-expansion", "activation-control", "activation-universal"].includes(action.card as string) ? null : "Unknown activation card.";
    },
    apply: (state, action) => { addItem(state, action.card as string, `court:${action.actor.id}`, action.actor.id); }
  },
  // Returns the game to the lobby, keeping the players and options.
  // Testing only: the host gives themselves 100 of one basic or special resource.
  giveResource: {
    validate(state, action) {
      if (!state.options.testing) return "Testing mode is off.";
      const error = hostOnly(action);
      if (error) return error;
      if (!state.world) return "The game has not started.";
      if (!state.players[action.actor.id]) return "You are not playing.";
      return RESOURCES.includes(action.resource as string) ? null : "Unknown resource.";
    },
    apply(state, action) {
      const resources = state.players[action.actor.id].resources;
      const name = action.resource as string;
      resources[name] = (resources[name] ?? 0) + 100;
    }
  },
  abort: {
    validate: (state, action) => state.phase === "lobby" ? "The game has not started." : hostOnly(action),
    apply(state) {
      const seed = Math.floor(nextFloat(state.rng) * 4294967296);
      state.phase = "lobby";
      state.order = [];
      state.round = 0;
      state.cards = {};
      state.buildings = [];
      state.armies = [];
      state.items = [];
      state.tiles = [];
      state.world = null;
      state.play = null;
      delete state.chapter;
      delete state.blocks;
      delete state.laws;
      delete state.tactics;
      delete state.subterfuge;
      delete state.tradeGiven;
      delete state.predictions;
      delete state.sabotaged;
      delete state.chapterUsed;
      delete state.result;
      state.rng = createRng(seed);
      state.recorded = false;
      for (const player of Object.values(state.players)) player.resources = {};
    }
  }
};

export function dispatch(state: KinState, action: Action): string | null {
  const handler = HANDLERS[action.type];
  if (!handler) return "Unknown action.";
  if (state.result && action.type !== "abort") return "The game is over.";
  if (state.play?.reactions?.length && action.type !== "reactionRespond" && action.type !== "forcePass") return "A reaction is waiting for an answer.";
  const error = handler.validate(state, action);
  if (error) return error;
  if (action.type === "selectionStep") {
    handler.apply(state, action);
    state.log.push({ seq: state.log.length + 1, action });
    return null;
  }
  if (state.play && action.type !== "forcePass") delete state.play.selectionStep;
  resolvePredictions(state, action);
  handler.apply(state, action);
  for (const player of Object.values(state.players)) {
    if (player.relicsTapped !== undefined) player.relicsTapped = tappedRelics(player);
  }
  while (!state.result && state.play && (state.play.forcePass?.includes(state.play.turn) || (state.play.phase === "event" && eventOptions(state, state.play.turn).length === 0))) {
    const autoPass: Action = { type: "pass", actor: { id: state.play.turn, username: state.players[state.play.turn].username, isHost: false } };
    if (state.play.reactions?.length || HANDLERS.pass.validate(state, autoPass)) break;
    pass(state);
  }
  state.log.push({ seq: state.log.length + 1, action });
  return null;
}

export function replay(seed: number, actions: Action[]): KinState {
  const state = createState(seed);
  for (const action of actions) {
    const error = dispatch(state, action);
    if (error) throw new Error(`Replay failed at "${action.type}": ${error}`);
  }
  return state;
}

export function serialize(state: KinState): string {
  return JSON.stringify(state);
}

export function deserialize(json: string): KinState {
  const parsed = JSON.parse(json) as Partial<KinState>;
  if (!parsed || typeof parsed !== "object" || parsed.version !== STATE_VERSION) throw new Error("Unsupported save version.");
  if (!parsed.players || !parsed.seats || !parsed.rng || !parsed.options || !parsed.log) throw new Error("The save file is incomplete.");
  return parsed as KinState;
}
