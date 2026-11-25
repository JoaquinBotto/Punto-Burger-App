export const TOTAL_GAME_QUESTIONS = 10;

export const DIFFICULTY_DISTRIBUTION = {
  initial: 3,
  medium: 4,
  advanced: 3,
} as const;

export type QuestionDifficulty = keyof typeof DIFFICULTY_DISTRIBUTION;

export function getPositionDifficulty(position: number): QuestionDifficulty {
  if (position >= 1 && position <= 3) return 'initial';
  if (position >= 4 && position <= 7) return 'medium';
  if (position >= 8 && position <= 10) return 'advanced';
  throw new Error(`Posición inválida: ${position}. Debe estar entre 1 y 10.`);
}
