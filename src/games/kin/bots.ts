// Autopilot handles setup; gameplay either passes or waits for manual control.
import { characterPicker, characterRound, eligibleCharacters } from "./draft";
import { DEDICATIONS } from "./deepones";
import { kinPicker, lastTilePlacer, riverMaker, tilePlacer } from "./engine";
import { KINS } from "./kins";
import { setupChoices } from "./setup";
import type { KinState } from "./types";
import { CLIMATES, LAND, climateSpots, riverNext, riverStarts } from "./world";

const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

export function kinBotMove(state: KinState, id: string, options: { forcePass: boolean } = { forcePass: true }): Record<string, unknown> | null {
  if (state.result) return null;
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
        return { type: "pickKin", kin: pick(KINS.filter(kin => !taken.includes(kin.id))).id };
      }
      case "setup": {
        const choices = setupChoices(state);
        if (!choices || choices.player !== id) return null;
        if (choices.task === "worksite") return choices.sides.length ? { type: "setupPlace", side: pick(choices.sides) } : null;
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
  return options.forcePass && state.play?.turn === id ? { type: "pass" } : null;
}
