import crypto from 'node:crypto';
import type { Question } from '../../db/schema/questions';
import { QuestionPoolInsufficientError } from './errors';
import type { SelectedQuestionSlot, SlotAssignment } from './types';

export function defaultRng(): number {
  return crypto.randomInt(0, 1_000_000_000) / 1_000_000_000;
}

/**
 * Selects 10 unique questions strictly respecting:
 * - 3 initial (positions 1..3)
 * - 4 medium (positions 4..7)
 * - 3 advanced (positions 8..10)
 * - Category and approved status
 * - No duplicate question IDs within the game
 * - 100% competitive fairness: uniform random selection within difficulty pool,
 *   completely independent of participant age or education level
 * - Server-side randomization using injectable RNG
 */
export function selectQuestionsForSlots(
  candidates: Question[],
  plan: SlotAssignment[],
  rng: () => number = defaultRng
): SelectedQuestionSlot[] {
  if (plan.length !== 10) {
    throw new Error('El plan de asignación debe contener exactamente 10 posiciones.');
  }

  // Filter only approved questions
  const approved = candidates.filter((q) => q.status === 'approved');

  const initialPool = approved.filter((q) => q.difficulty === 'initial');
  const mediumPool = approved.filter((q) => q.difficulty === 'medium');
  const advancedPool = approved.filter((q) => q.difficulty === 'advanced');

  if (initialPool.length < 3 || mediumPool.length < 4 || advancedPool.length < 3) {
    throw new QuestionPoolInsufficientError(
      `Banco insuficiente: se requieren al menos 3 initial, 4 medium y 3 advanced (disponibles: ${initialPool.length}/${mediumPool.length}/${advancedPool.length}).`
    );
  }

  const usedQuestionIds = new Set<string>();
  const selected: SelectedQuestionSlot[] = [];

  for (const slot of plan) {
    let pool: Question[];
    if (slot.difficulty === 'initial') {
      pool = initialPool;
    } else if (slot.difficulty === 'medium') {
      pool = mediumPool;
    } else {
      pool = advancedPool;
    }

    // Available candidates not yet chosen in this game
    const available = pool.filter((q) => !usedQuestionIds.has(q.id));

    if (available.length === 0) {
      throw new QuestionPoolInsufficientError(
        `No hay preguntas disponibles para la posición ${slot.position} (${slot.difficulty}).`
      );
    }

    // Pick uniformly at random from all available questions in this difficulty pool
    const randomFraction = rng();
    const clampedIndex = Math.floor(randomFraction * available.length) % available.length;
    const chosen = available[clampedIndex];
    if (!chosen) {
      throw new QuestionPoolInsufficientError(
        `No question found for position ${slot.position} (${slot.difficulty})`
      );
    }

    usedQuestionIds.add(chosen.id);
    selected.push({
      slot,
      question: chosen,
    });
  }

  return selected;
}
