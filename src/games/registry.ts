import { codenames } from "./codenames";
import { saboteur } from "./saboteur";
import { tetris } from "./tetris";
import { thirtyone } from "./thirtyone";
import type { GameInfo, GameModule } from "./types";

// To add a game: create src/games/<id>/index.ts exporting a GameModule, then list it here.
export const MODULES: Record<string, GameModule<any>> = {
  [tetris.info.id]: tetris,
  [codenames.info.id]: codenames,
  [thirtyone.info.id]: thirtyone,
  [saboteur.info.id]: saboteur
};

export const GAMES: Record<string, GameInfo> = Object.fromEntries(Object.values(MODULES).map(module => [module.info.id, module.info]));
