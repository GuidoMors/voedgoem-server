import { codenames } from "./codenames";
import { blokus } from "./blokus";
import { dworf } from "./dworf";
import { kin } from "./kin";
import { tetris } from "./tetris";
import { thirtyone } from "./thirtyone";
import { werewolves } from "./werewolves";
import type { GameInfo, GameModule } from "./types";

// To add a game: create src/games/<id>/index.ts exporting a GameModule, then list it here.
export const MODULES: Record<string, GameModule<any>> = {
  [tetris.info.id]: tetris,
  [blokus.info.id]: blokus,
  [codenames.info.id]: codenames,
  [thirtyone.info.id]: thirtyone,
  [dworf.info.id]: dworf,
  [werewolves.info.id]: werewolves,
  [kin.info.id]: kin
};

export const GAMES: Record<string, GameInfo> = Object.fromEntries(Object.values(MODULES).map(module => [module.info.id, module.info]));
