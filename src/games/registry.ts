import { MODULES } from "./modules.generated";
import type { GameInfo, GameModule } from "./types";

export { MODULES };

export const GAMES: Record<string, GameInfo> = Object.fromEntries(Object.values(MODULES).map(module => [module.info.id, module.info]));
