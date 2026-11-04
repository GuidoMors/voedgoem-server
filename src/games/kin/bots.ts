// Autopilot handles setup; gameplay either passes or waits for manual control.
import { characterPicker, characterRound, eligibleCharacters } from "./draft";
import { DEDICATIONS } from "./deepones";
import { kinPicker, lastTilePlacer, riverMaker, tilePlacer } from "./engine";
import { KINS } from "./kins";
import { ruinsSpots } from "./archeology";
import { explorationPlacer } from "./exploration";
import { setupChoices } from "./setup";
import type { KinState } from "./types";
import { CLIMATES, LAND, climateSpots, riverNext, riverStarts } from "./world";

const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

export function kinBotMove(state: KinState, id: string, options: { forcePass: boolean } = { forcePass: true }): Record<string, unknown> | null {
  if (state.result) return null;
  if (state.chapter?.pending) return state.chapter.pending.player === id ? { type: "chooseChapter", chapter: state.chapter.pending.choices[0] } : null;
  if (state.exploration?.placing) return explorationPlacer(state) === id ? { type: "placeExplorationRuins", tile: pick(ruinsSpots(state)) } : null;
  if (state.phase === "draft" && state.world && state.world.step !== "done") {
    const world = state.world;
    const board = state.tiles.map(tile => tile.terrain);
    switch (world.step) {
      case "tiles": {
        if (tilePlacer(state, world) !== id) return null;
        const terrain = pick(LAND.filter(item => world.pile[item] > 0));
        const oceans = state.tiles.flatMap((tile, index) => (tile.terrain === "ocean" ? [index] : []));
        return terrain && oceans.length ? { type: "placeTile", terrain, tile: pick(oceans) } : null;
      }
      case "lastTiles": {
        if (lastTilePlacer(state, world) !== id) return null;
        const options = CLIMATES.filter(item => world.lastPile[item] > 0 && climateSpots(board, item).length > 0);
        if (!options.length) return null;
        const terrain = pick(options);
        return { type: "placeLastTile", terrain, tile: pick(climateSpots(board, terrain)) };
      }
      case "rivers": {
        if (riverMaker(state, world) !== id) return null;
        const vertices = world.freeEnd ? riverNext(world, world.freeEnd) : riverStarts(world, board);
        return vertices.length ? { type: world.freeEnd ? "riverExtend" : "riverStart", vertex: pick(vertices) } : null;
      }
      case "kin": {
        if (kinPicker(state, world) !== id) return null;
        const taken = Object.values(world.kinPicks);
        return { type: "pickKin", kin: pick(KINS.filter(kin => !taken.includes(kin.id) && !state.chapter?.retiredKins?.includes(kin.id))).id };
      }
      case "setup": {
        const choices = setupChoices(state);
        if (!choices || choices.player !== id) return null;
        if (choices.tile !== null) return choices.sides.length ? { type: "setupPlace", side: pick(choices.sides) } : null;
        return choices.tiles.length ? { type: "setupPlace", tile: pick(choices.tiles), ...(choices.dedicate ? { dedication: pick(DEDICATIONS) } : {}) } : null;
      }
      case "characters": {
        if (characterPicker(state) !== id) return null;
        const options = eligibleCharacters(state, id, characterRound(state));
        return options.length ? { type: "pickCharacter", character: pick(options).id } : null;
      }
    }
    return null;
  }
  if (!options.forcePass || state.play?.turn !== id) return null;
  if (state.play.council?.king === id) return { type: "royalEnact", law: state.play.council.laws[0], track: "rebel" };
  if (state.kingdom && state.play.quantum?.player === id)
    return { type: "quantum", cards: state.play.quantum.options.slice(0, state.play.quantum.pick) };
  if (state.play.schemer) return { type: "schemerRespond", last: false };
  if (state.play.donation) return { type: "donate", gold: 0 };
  if (state.play.oppose) return { type: "opposeRespond", accept: false };
  return { type: "pass" };
}
