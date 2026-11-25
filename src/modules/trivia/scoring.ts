export const QUESTION_DURATION_SECONDS = 20;

export const SCORING_RULES = {
  initial: {
    correct: 100,
    incorrect: 20,
    unanswered: 0,
  },
  medium: {
    correct: 150,
    incorrect: 20,
    unanswered: 0,
  },
  advanced: {
    correct: 200,
    incorrect: 20,
    unanswered: 0,
  },
} as const;

export type QuestionDifficultyLevel = keyof typeof SCORING_RULES;
export type AnswerResultType = 'correct' | 'incorrect' | 'unanswered';

/**
 * Puntuación máxima alcanzable en una partida oficial estándar:
 * 3 iniciales (3 x 100 = 300) + 4 medias (4 x 150 = 600) + 3 avanzadas (3 x 200 = 600) = 1500 puntos.
 * No existen multiplicadores, bonificaciones por velocidad ni puntos negativos en el MVP.
 */
export const MAX_POSSIBLE_SCORE = 1500;

/**
 * Calcula los puntos otorgados por una respuesta según la dificultad y el resultado.
 * Autoridad 100% server-side sin bonificación por velocidad.
 */
export function calculatePoints(
  difficulty: QuestionDifficultyLevel,
  result: AnswerResultType
): number {
  if (result === 'unanswered') {
    return 0;
  }
  return SCORING_RULES[difficulty][result];
}

/**
 * Reconcilia la suma de puntos registrados en las respuestas con el total almacenado en la sesión de juego.
 */
export function reconcileScores(
  answersList: Array<{ pointsAwarded: number }>,
  sessionTotalScore: number
): { isConsistent: boolean; calculatedTotal: number } {
  const calculatedTotal = answersList.reduce((acc, curr) => acc + curr.pointsAwarded, 0);
  return {
    isConsistent: calculatedTotal === sessionTotalScore,
    calculatedTotal,
  };
}
