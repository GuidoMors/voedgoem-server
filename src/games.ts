export interface GameInfo {
  id: string;
  name: string;
  description: string;
  maxPlayers: number;
}

export const GAMES: Record<string, GameInfo> = {
  tetris: {
    id: "tetris",
    name: "Tetris",
    description: "Everyone plays their own board. The round lasts until the last player tops out.",
    maxPlayers: 8
  }
};
