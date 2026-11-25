import crypto from 'node:crypto';
import type { Question } from '../../db/schema/questions';
import { QuestionPoolInsufficientError } from './errors';
import type { SelectedQuestionSlot, SlotAssignment } from './types';

export function defaultRng(): number {
  return crypto.randomInt(0, 1_000_000_000) / 1_000_000_000;
}

/**
 * Calculates a compatibility score between a candidate question and a target profile.
 * Higher scores mean better compatibility:
 * - Specific ageRange exact match + educationLevel match (Score: 5)
 * - Specific ageRange exact match + no educationLevel constraint (Score: 4)
 * - Specific ageRange exact match + different educationLevel (Score: 3)
 * - General ageRange + educationLevel match (Score: 2)
 * - General ageRange + no educationLevel constraint (Score: 1 - Current seed default)
 * - Incompatible ageRange (Score: 0 - Rejected)
 */
export function scoreCompatibility(
  question: Question,
  targetAgeRange: string,
  targetEducationLevel: string | null
): number {
  // If target is general (e.g. group question in mixed group)
  if (targetAgeRange === 'general') {
    if (question.ageRange === 'general') {
      if (
        targetEducationLevel &&
        question.educationLevel &&
        question.educationLevel === targetEducationLevel
      ) {
        return 4;
      }
      if (!question.educationLevel || question.educationLevel === 'none') {
        return 3;
      }
      return 2;
    }
    // Specific questions for a general group slot have lowest compatibility
    return 1;
  }

  // Target is a specific ageRange (child, teen, adult)
  if (question.ageRange === targetAgeRange) {
    if (
      targetEducationLevel &&
      question.educationLevel &&
      question.educationLevel === targetEducationLevel
    ) {
      return 5;
    }
    if (!question.educationLevel || question.educationLevel === 'none') {
      return 4;
    }
    return 3;
  }

  // Fallback to general questions
  if (question.ageRange === 'general') {
    if (
      targetEducationLevel &&
      question.educationLevel &&
      question.educationLevel === targetEducationLevel
    ) {
      return 2;
    }
    return 1;
  }

  // Incompatible ageRange (e.g. child target with adult question)
  return 0;
}

/**
 * Selects 10 unique questions strictly respecting:
 * - 3 initial (positions 1..3)
 * - 4 medium (positions 4..7)
 * - 3 advanced (positions 8..10)
 * - Category and approved status
 * - No duplicate question IDs
 * - Highest available compatibility score per slot with fallback to general
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

    // Available candidates not yet chosen
    const available = pool.filter((q) => !usedQuestionIds.has(q.id));

    // Calculate score for each
    const scored = available
      .map((q) => ({
        question: q,
        score: scoreCompatibility(q, slot.targetAgeRange, slot.targetEducationLevel),
      }))
      .filter((item) => item.score > 0);

    if (scored.length === 0) {
      throw new QuestionPoolInsufficientError(
        `No hay preguntas compatibles disponibles para la posición ${slot.position} (${slot.difficulty}).`
      );
    }

    // Find highest score
    const maxScore = Math.max(...scored.map((item) => item.score));
    const topTier = scored.filter((item) => item.score === maxScore);

    // Pick randomly from top tier
    const randomFraction = rng();
    const clampedIndex = Math.floor(randomFraction * topTier.length) % topTier.length;
    const chosenCandidate = topTier[clampedIndex];
    if (!chosenCandidate) {
      throw new QuestionPoolInsufficientError(
        `No compatible question found for position ${slot.position} (${slot.difficulty})`
      );
    }
    const chosen = chosenCandidate.question;

    usedQuestionIds.add(chosen.id);
    selected.push({
      slot,
      question: chosen,
    });
  }

  return selected;
}
