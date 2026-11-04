import type { KinPlayer, KinState } from "./types";

export const tappedRelics = (player: KinPlayer) => Math.min(player.relicsTapped ?? 0, player.resources.relic ?? 0);
export const untappedRelics = (player: KinPlayer) => (player.resources.relic ?? 0) - tappedRelics(player);

export function relicTapError(state: KinState, player: string): string | null {
  const play = state.play;
  if (!play) return "The game is not being played yet.";
  if (state.chapter?.pending || state.exploration?.placing || play.donation || play.schemer || play.oppose) return "Finish the chapter decision before tapping relics.";
  if (play.turn !== player) return "It is not your turn.";
  if (play.move || play.barter || play.battle || play.council || play.auction || play.quantum || play.consent || play.reactions?.length) return "Finish the current action or response before tapping relics.";
  return untappedRelics(state.players[player]) > 0 ? null : "You have no untapped relics.";
}
