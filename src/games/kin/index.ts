import type { GameModule } from "../types";
import { armyLimit, population, production } from "./buildings";
import { AREAS_NEEDED, areaLeaders, standings } from "./victory";
import { relicTapError, tappedRelics } from "./relics";
import { choosesRuins, exploreOptions, reclaimOptions } from "./archeology";
import { oxyliumTiles } from "./ark";
import { eventOptions } from "./events";
import { isDeepOnes, thrallTargets, whisperOptions } from "./deepones";
import { enactedLaw, LAWS } from "./laws";
import { SUBTERFUGE, TACTICS, subterfugeOf, tacticOptions } from "./tactics";
import { buildOptions, observatoryChoices, demolishOptions, deployOptions } from "./expansion";
import { canYuguan, embarkOptions, harvestOptions, recruitCost, recruitOptions, recruitPayment, reinforceOptions } from "./control";
import { abilityOptions, fleeTiles, hasChar } from "./neutrals";
import { influence } from "./hanshu";
import { canHunt, huntTiles, shownResources } from "./lumon";
import { nomadOptions } from "./wanderers";
import { RUTHLESS_COST, canPlea, ruthlessTargets, tradegoods } from "./streams";
import { canCraft } from "./hammers";
import { calculatorOptions, driftTiles, isArkPlayer, massHarvestYield } from "./ark";
import { battleOptions, canPredict, canSmite, defenderBase, defenderGenerals, unlockedDice } from "./battle";
import { characterPicker, characterRound, eligibleCharacters } from "./draft";
import { createState, dispatch, kinPicker, lastTilePlacer, riverMaker, tilePlacer } from "./engine";
import { KINS } from "./kins";
import { setupChoices } from "./setup";
import { hasActionCard, moveTargets, movableArmies, sourcesFor, startPlay } from "./play";
import { publicizeOptions, researchOptions } from "./tech";
import { barterInfo, dissolvable } from "./treaties";
import { RIVER_COUNT, riverNext, riverStarts } from "./world";
import { kinBotMove } from "./bots";
import { MAX_PLAYERS, MAX_USERS, MIN_PLAYERS, type Action, type KinState } from "./types";

const DESCRIPTION = "An asymmetric strategy game for up to 10 players. Pick a Kin, build, trade, fight and win the chapter.";

export const kin: GameModule<KinState> = {
  info: {
    id: "kin",
    name: "Kin",
    description: DESCRIPTION,
    maxPlayers: MAX_PLAYERS,
    maxUsers: MAX_USERS
  },
  perViewer: false,

  create: () => createState(),

  // Saves from before a field existed get it filled in here.
  migrate(state) {
    state.options ??= { mode: "short", testing: false };
    state.log ??= [];
    state.cards ??= {};
    state.buildings ??= [];
    state.armies ??= [];
    state.items ??= [];
    state.play ??= null;
    if (state.play) { state.play.barter ??= null; state.play.verdicts ??= []; }
    if (state.world?.step === "done" && !state.play) startPlay(state);
    state.tiles ??= [];
    state.world ??= null;
    if (state.world) { state.world.kinPicks ??= {}; state.world.charPicks ??= []; state.world.setup ??= {}; state.world.claimed ??= []; }
  },

  connect(state, userId) {
    const player = state.players[userId];
    if (!player || player.connected) return false;
    player.connected = true;
    return true;
  },

  handle(state, actor, message) {
    if (typeof message.type !== "string") return "ignore";
    const { type: _type, actor: _actor, ...payload } = message;
    const action: Action = { ...payload, type: message.type, actor: { id: actor.userId, username: actor.username, isHost: actor.isHost } };
    const error = dispatch(state, action);
    return error ? { error } : "save";
  },

  botMove: kinBotMove,

  openSpots(state, userId) {
    if (state.phase !== "lobby" || state.players[userId] || state.seats.length >= MAX_PLAYERS) return [];
    return [{ type: "join" }];
  },

  disconnect(state, userId) {
    const player = state.players[userId];
    if (!player) return false;
    if (state.phase === "lobby") {
      dispatch(state, { type: "leave", actor: { id: userId, username: player.username, isHost: false } });
      return true;
    }
    if (!player.connected) return false;
    player.connected = false;
    return true;
  },

  participants: state => new Set(Object.keys(state.players)),

  snapshot(state, viewerId, connected) {
    const viewer = state.players[viewerId];
    return {
      phase: state.phase,
      options: state.options,
      round: state.round,
      minPlayers: MIN_PLAYERS,
      order: state.order,
      seats: state.seats.map(id => ({
        id,
        username: state.players[id].username,
        connected: connected.has(id),
        resources: shownResources(state, id),
        relicsTapped: tappedRelics(state.players[id]),
        relicTapReason: state.result ? "The game is over." : relicTapError(state, id),
        characters: Object.values(state.cards).filter(card => card.owner === id).length,
        population: population(state, id),
        armies: state.armies.filter(army => army.owner === id).length,
        armyLimit: armyLimit(state, id),
        production: production(state, id)
      })),
      // The seed and cheats only matter for the host of a testing game.
      testing: state.options.testing,
      seed: state.options.testing ? state.rng.seed : null,
      you: viewer ? { id: viewer.id, resources: shownResources(state, viewer.id) } : null,
      world: state.world && {
        step: state.world.step,
        pile: state.world.pile,
        lastPile: state.world.lastPile ?? null,
        board: state.tiles.map(tile => tile.terrain),
        rivers: state.world.rivers,
        riversDone: state.world.riversDone,
        riverTotal: RIVER_COUNT,
        freeEnd: state.world.freeEnd,
        // Whose turn it is in the current setup step, and where they may click next.
        turn: state.world.step === "tiles" ? tilePlacer(state, state.world)
          : state.world.step === "lastTiles" ? lastTilePlacer(state, state.world)
          : state.world.step === "rivers" ? riverMaker(state, state.world)
          : state.world.step === "kin" ? kinPicker(state, state.world)
          : state.world.step === "setup" ? setupChoices(state)?.player ?? null
          : state.world.step === "done" ? state.play?.turn ?? null
          : characterPicker(state),
        kinPicks: state.world.kinPicks,
        kins: KINS,
        // Starting setup: what the player on turn has to place and where they may click.
        setup: state.world.step === "setup" ? setupChoices(state) : null,
        buildings: state.buildings,
        blocks: state.blocks ?? [],
        law: enactedLaw(state) ?? null,
        lawList: LAWS,
        lawDeck: { deck: state.laws?.deck.length ?? LAWS.length, discard: state.laws?.discard.length ?? 0 },
        // Tactics cards lie open in courts; subterfuge cards are hidden: you only see your own and how many the others hold.
        tacticsList: TACTICS,
        subterfugeList: SUBTERFUGE,
        tactics: {
          deck: state.tactics?.deck.length ?? 0,
          discard: state.tactics?.discard.length ?? 0,
          hands: state.tactics?.hands ?? {},
          archeologist: choosesRuins(state, viewerId)
        },
        subterfuge: {
          deck: state.subterfuge?.deck.length ?? SUBTERFUGE.length,
          discard: state.subterfuge?.discard.length ?? 0,
          mine: subterfugeOf(state, viewerId),
          counts: Object.fromEntries(state.order.map(id => [id, subterfugeOf(state, id).length]))
        },
        armies: state.armies,
        items: state.items,
        play: state.play && {
          phase: state.play.phase,
          turn: state.play.turn,
          selectionStep: state.play.selectionStep ?? null,
          passes: state.play.passes,
          forcePass: state.play.forcePass ?? [],
          autoEventPass: state.play.phase === "event" && eventOptions(state, viewerId).length === 0,
          move: state.play.move && { ...state.play.move, targets: moveTargets(state, state.play.move) },
          // What the player on turn can tap, which armies could go somewhere with a Move, and the technologies they can Research or Publicize.
          options: state.play.phase === "control" && !state.play.move
            ? {
              sources: sourcesFor(state, state.play.turn, "control"),
              armies: [],
              research: [],
              publicize: [],
              dissolve: [],
              barter: null,
              recruit: recruitOptions(state, state.play.turn, canYuguan(state, state.play.turn)),
              yuguan: canYuguan(state, state.play.turn),
              predict: canPredict(state, state.play.turn, "liangzhuge", 0),
              reinforce: reinforceOptions(state, state.play.turn),
              harvest: harvestOptions(state, state.play.turn),
              embark: embarkOptions(state, state.play.turn),
              explore: exploreOptions(state, state.play.turn),
              oxylium: oxyliumTiles(state, state.play.turn),
              battle: battleOptions(state, state.play.turn),
              hunt: canHunt(state, state.play.turn, "taahira")
                ? state.armies.filter(army => army.owner === state.play!.turn && army.tile >= 0).map(army => ({ army: army.id, tiles: huntTiles(state, state.play!.turn, army) }))
                : [],
              smite: canSmite(state, state.play.turn, "barendam"),
              goldRecruit: recruitPayment(state, state.play.turn, true) === "gold",
              manaRecruit: recruitPayment(state, state.play.turn, "mana") === "mana",
              recruitCost: recruitCost(state, state.play.turn),
              dice: unlockedDice(state, state.play.turn)
            }
            : state.play.phase === "expansion" && !state.play.move
            ? {
              sources: sourcesFor(state, state.play.turn, "expansion"),
              armies: [],
              research: [],
              publicize: [],
              dissolve: [],
              barter: null,
              build: buildOptions(state, state.play.turn),
              observatory: observatoryChoices(state, state.play.turn),
              deploy: deployOptions(state, state.play.turn),
              demolish: demolishOptions(state, state.play.turn),
              reclaim: reclaimOptions(state, state.play.turn),
              revoke: !!state.laws?.enacted,
              craft: canCraft(state, state.play.turn)
            }
            : state.play.phase === "discovery" && !state.play.move
            ? {
              sources: sourcesFor(state, state.play.turn, "discovery"),
              armies: movableArmies(state, state.play.turn).map(army => army.id),
              research: researchOptions(state, state.play.turn),
              publicize: publicizeOptions(state, state.play.turn),
              dissolve: dissolvable(state, state.play.turn),
              barter: barterInfo(state, state.play.turn),
              nomads: hasActionCard(state, state.play.turn, "nomads") ? nomadOptions(state, state.play.turn) : [],
              ruthless: hasActionCard(state, state.play.turn, "ruthless-capitalists") && tradegoods(state, state.play.turn) >= RUTHLESS_COST ? ruthlessTargets(state, state.play.turn) : [],
              drift: hasActionCard(state, state.play.turn, "drifting-citadel") ? driftTiles(state, state.play.turn) : [],
              longReach: hasChar(state, state.play.turn, "loong") && influence(state, state.play.turn) >= 1
            }
            : null,
          barter: state.play.barter,
          // A battle waiting for its defender; the attacker's dice stay hidden until the roll.
          battle: state.play.battle ? (({ dice: _hidden, ...open }) => ({
            ...open,
            base: defenderBase(state, open.defender, open.tile),
            generals: defenderGenerals(state, open.defender),
            smite: canSmite(state, open.defender, "barendam"),
            predict: canPredict(state, open.defender, "liangzhuge", 0),
            plea: canPlea(state, open.defender, "qumono"),
            flee: { tiles: fleeTiles(state, open.defender) },
            dice: unlockedDice(state, open.defender),
            round: open.round ? { stage: open.round.stage, report: open.round.report } : null
          }))(state.play.battle) : null,
          reaction: state.play.reactions?.[0] ?? null,
          report: state.play.report ?? null,
          found: state.play.found ?? null,
          council: state.play.council ? { ...state.play.council, grand: undefined, canGrand: hasChar(state, viewerId, "yamanano") && influence(state, viewerId) >= 1, grandBy: state.play.council.grand ?? [] } : null,
          councilResult: state.play.councilResult ?? null,
          auction: state.play.auction ?? null,
          auctionResult: state.play.auctionResult ?? null,
          notice: state.play.notice ?? null,
          quantum: state.play.quantum && state.play.quantum.player === viewerId ? state.play.quantum : state.play.quantum ? { player: state.play.quantum.player, kind: state.play.quantum.kind, options: [], pick: state.play.quantum.pick, activator: state.play.quantum.activator } : null,
          abilities: !state.play.battle && !state.play.move && !state.play.barter && !state.play.council && !state.play.auction && !state.play.quantum && !state.play.consent
            ? abilityOptions(state, state.play.turn)
            : [],
          tacticOptions: ["discovery", "expansion", "control"].includes(state.play.phase) && !state.play.move && !state.play.barter && !state.play.battle && !state.play.council && !state.play.auction && !state.play.quantum && !state.play.consent
            ? tacticOptions(state, state.play.turn)
            : [],
          events: state.play.phase === "event" ? eventOptions(state, state.play.turn) : [],
          // Deep Ones: Chosen Thrall (your secret choice) and the targets of Chosen Thrall and Whispered Gifts.
          thrall: state.thralls?.[viewerId] ?? null,
          thrallTargets: state.play.phase === "event" && isDeepOnes(state, state.play.turn) ? thrallTargets(state, state.play.turn) : [],
          whisper: state.play.phase === "event" && isDeepOnes(state, state.play.turn) ? whisperOptions(state, state.play.turn) : null,
          consent: state.play.consent ? { ...state.play.consent, plea: state.play.consent.plea ? true : undefined } : null,
          // Calculators: the prediction is secret; each player only sees their own.
          predictions: (state.predictions ?? []).filter(entry => entry.player === viewerId),
          calculators: state.play.phase === "event" && isArkPlayer(state, state.play.turn) ? calculatorOptions(state, state.play.turn) : null,
          massHarvest: massHarvestYield(state, state.play.turn),
          sabotaged: state.sabotaged ?? [],
          verdicts: state.play.verdicts.filter(entry => state.items.some(item => item.id === entry.treaty))
        },
        // Every claimed character with its owner, the stack still to draw from, and what the player on turn may take.
        charClaims: Object.fromEntries(Object.values(state.cards).filter(card => card.owner).map(card => [card.id, card.owner])),
        charTapped: Object.values(state.cards).filter(card => card.tapped).map(card => card.id),
        borrowed: state.borrowed ?? {},
        charPool: Object.values(state.cards).map(card => card.id),
        charRound: state.world.step === "characters" ? characterRound(state) : null,
        charEligible: state.world.step === "characters" ? eligibleCharacters(state, characterPicker(state)!, characterRound(state)).map(c => c.id) : [],
        riverChoices: state.world.step !== "rivers" ? [] : state.world.freeEnd ? riverNext(state.world, state.world.freeEnd) : riverStarts(state.world, state.tiles.map(tile => tile.terrain))
      },
      eventCount: state.log.length,
      victory: state.order.length > 0 && state.phase !== "lobby" ? {
        chapter: state.chapter?.current ?? "new-dawn",
        leader: state.chapter?.leader ?? null,
        needed: AREAS_NEEDED,
        standings: standings(state),
        leaders: areaLeaders(state),
        points: state.chapter?.points ?? {},
        result: state.result ?? null
      } : null
    };
  }
};
