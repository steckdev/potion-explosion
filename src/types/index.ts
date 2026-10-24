export type RuneType = 'fire' | 'frost' | 'venom' | 'moon';

export type GameMode = 'kids' | 'adults';

export type ScreenState = 'hub' | 'kids_game' | 'adults_game' | 'victory';

export interface CardData {
  id: string;
  number: number;
  name: string;
  sprite: string;
  runes: RuneType[];
  riddle: string;
  riddleAnswer: string;
  targetLetter: string;
  location?: string;
  decorations?: string;
}

export interface QuestInfo {
  rune: RuneType;
  title: string;
  totemName: string;
  icon: string;
  color: string;
  accentColor: string;
  secondaryColor: string;
  glowColor: string;
  secretWord: string;
  subtitle: string;
  description: string;
}

export interface GameResult {
  questRune: RuneType;
  mode: GameMode;
  attempts: number;
  purity: number;
  timeSpentSeconds: number;
  wordSolved?: string;
}
