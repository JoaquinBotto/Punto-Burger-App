import type { Participant } from '../../db/schema/participants';
import { getPositionDifficulty } from './constants';
import type { SlotAssignment } from './types';

/**
 * Builds an immutable assignment plan for 10 trivia question slots.
 * Follows PPA-LAUNCH-001 competitive fairness guidelines:
 * - Completely independent of ageRange and educationLevel.
 * - Dynamic assignment depends ONLY on participant count and stable position.
 * - 1 participant: 10 directed questions.
 * - 2+ participants: combination of directed (round robin) and group questions.
 * - Question difficulty is determined strictly by position (3 initial, 4 medium, 3 advanced).
 */
export function buildAssignmentPlan(participants: Participant[]): SlotAssignment[] {
  if (participants.length === 0 || participants.length > 8) {
    throw new Error('El grupo debe tener entre 1 y 8 participantes.');
  }

  // Sort stably by position
  const sorted = [...participants].sort((a, b) => a.position - b.position);
  const n = sorted.length;

  // Case 1: Exactly 1 participant
  if (n === 1) {
    const single = sorted[0]!;
    return Array.from({ length: 10 }, (_, i) => {
      const position = i + 1;
      return {
        position,
        difficulty: getPositionDifficulty(position),
        targetParticipantId: single.id,
        targetAlias: single.alias,
        targetAgeRange: single.ageRange,
        targetEducationLevel: single.educationLevel,
        isGroup: false,
      };
    });
  }

  // Case 2: 2 or more participants
  // Reparto de turnos según número de jugadores:
  // - n=2: 3 dirigidas cada uno (6 dirigidas, 4 grupales)
  // - n=3: 2 dirigidas cada uno (6 dirigidas, 4 grupales)
  // - n=4: 2 dirigidas cada uno (8 dirigidas, 2 grupales)
  // - n=5..8: 1 dirigida cada uno (5..8 dirigidas, 5..2 grupales)
  let directedPerParticipant: number;
  if (n === 2) {
    directedPerParticipant = 3;
  } else if (n === 3 || n === 4) {
    directedPerParticipant = 2;
  } else {
    directedPerParticipant = 1;
  }

  const totalDirected = n * directedPerParticipant;
  const totalGroup = 10 - totalDirected;

  // Determinar posiciones fijas para preguntas grupales
  const groupPositions = new Set<number>();
  if (totalGroup === 5) {
    [2, 4, 6, 8, 10].forEach((p) => groupPositions.add(p));
  } else if (totalGroup === 4) {
    [3, 5, 7, 10].forEach((p) => groupPositions.add(p));
  } else if (totalGroup === 3) {
    [3, 7, 10].forEach((p) => groupPositions.add(p));
  } else if (totalGroup === 2) {
    [6, 10].forEach((p) => groupPositions.add(p));
  }

  // Asignación Round Robin de preguntas dirigidas por posición estable
  let directedIndex = 0;
  const slots: SlotAssignment[] = [];

  for (let i = 0; i < 10; i++) {
    const position = i + 1;
    const difficulty = getPositionDifficulty(position);

    if (groupPositions.has(position)) {
      slots.push({
        position,
        difficulty,
        targetParticipantId: null,
        targetAlias: null,
        targetAgeRange: 'general',
        targetEducationLevel: null,
        isGroup: true,
      });
    } else {
      const target = sorted[directedIndex % n]!;
      directedIndex++;
      slots.push({
        position,
        difficulty,
        targetParticipantId: target.id,
        targetAlias: target.alias,
        targetAgeRange: target.ageRange,
        targetEducationLevel: target.educationLevel,
        isGroup: false,
      });
    }
  }

  return slots;
}
