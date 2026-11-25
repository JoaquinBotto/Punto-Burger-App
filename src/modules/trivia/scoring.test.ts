import { describe, expect, it } from 'vitest';
import {
  calculatePoints,
  MAX_POSSIBLE_SCORE,
  QUESTION_DURATION_SECONDS,
  reconcileScores,
  SCORING_RULES,
} from './scoring';

describe('Trivia Scoring Rules (PPA-013)', () => {
  it('define el temporizador estándar en exactamente 20 segundos', () => {
    expect(QUESTION_DURATION_SECONDS).toBe(20);
  });

  it('calcula correctamente los puntos para respuestas correctas según dificultad', () => {
    expect(calculatePoints('initial', 'correct')).toBe(100);
    expect(calculatePoints('medium', 'correct')).toBe(150);
    expect(calculatePoints('advanced', 'correct')).toBe(200);
  });

  it('calcula exactamente 20 puntos para cualquier respuesta incorrecta sin importar dificultad', () => {
    expect(calculatePoints('initial', 'incorrect')).toBe(20);
    expect(calculatePoints('medium', 'incorrect')).toBe(20);
    expect(calculatePoints('advanced', 'incorrect')).toBe(20);
  });

  it('calcula 0 puntos para preguntas sin responder', () => {
    expect(calculatePoints('initial', 'unanswered')).toBe(0);
    expect(calculatePoints('medium', 'unanswered')).toBe(0);
    expect(calculatePoints('advanced', 'unanswered')).toBe(0);
  });

  it('verifica que el puntaje máximo posible sea exactamente 1500', () => {
    const initialPoints = 3 * SCORING_RULES.initial.correct; // 300
    const mediumPoints = 4 * SCORING_RULES.medium.correct; // 600
    const advancedPoints = 3 * SCORING_RULES.advanced.correct; // 600
    const totalMax = initialPoints + mediumPoints + advancedPoints;

    expect(totalMax).toBe(1500);
    expect(MAX_POSSIBLE_SCORE).toBe(1500);
  });

  it('reconcilia correctamente la consistencia de puntuación', () => {
    const sampleAnswers = [
      { pointsAwarded: 100 },
      { pointsAwarded: 100 },
      { pointsAwarded: 20 },
      { pointsAwarded: 150 },
      { pointsAwarded: 150 },
      { pointsAwarded: 0 },
      { pointsAwarded: 150 },
      { pointsAwarded: 200 },
      { pointsAwarded: 200 },
      { pointsAwarded: 200 },
    ];

    const sum = 100 + 100 + 20 + 150 + 150 + 0 + 150 + 200 + 200 + 200; // 1170
    expect(reconcileScores(sampleAnswers, sum)).toEqual({
      isConsistent: true,
      calculatedTotal: sum,
    });

    expect(reconcileScores(sampleAnswers, sum + 50)).toEqual({
      isConsistent: false,
      calculatedTotal: sum,
    });
  });
});
