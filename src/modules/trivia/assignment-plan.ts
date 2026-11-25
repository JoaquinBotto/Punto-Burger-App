import type { Participant } from '../../db/schema/participants';
import { getPositionDifficulty } from './constants';
import type { SlotAssignment } from './types';

/**
 * Builds an immutable assignment plan for 10 trivia question slots.
 * Follows specs/03-game-mechanics.md and PPA-012 guidelines:
 * - 1 participant: all questions adapted to their profile.
 * - Homogeneous group (all same ageRange): all questions are group questions adapted to the common ageRange.
 * - Mixed group: balanced distribution where every participant receives at least 1 directed question,
 *   age ranges alternate, and group questions are included when space exists.
 */
export function buildAssignmentPlan(participants: Participant[]): SlotAssignment[] {
  if (participants.length === 0 || participants.length > 8) {
    throw new Error('El grupo debe tener entre 1 y 8 participantes.');
  }

  // Sort stably by position
  const sorted = [...participants].sort((a, b) => a.position - b.position);

  // Case 1: Exactly 1 participant
  if (sorted.length === 1) {
    const single = sorted[0];
    if (!single) {
      throw new Error('Participante no encontrado.');
    }
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

  // Check if all participants share the exact same ageRange (homogeneous)
  const firstAgeRange = sorted[0]?.ageRange;
  const isHomogeneous = sorted.every((p) => p.ageRange === firstAgeRange);

  if (isHomogeneous && firstAgeRange) {
    return Array.from({ length: 10 }, (_, i) => {
      const position = i + 1;
      return {
        position,
        difficulty: getPositionDifficulty(position),
        targetParticipantId: null,
        targetAlias: null,
        targetAgeRange: firstAgeRange,
        targetEducationLevel: null,
        isGroup: true,
      };
    });
  }

  // Case 3: Mixed group (different age ranges)
  const n = sorted.length;
  // Determine how many directed questions each participant receives:
  // - n=2: 3 directed each (6 directed, 4 group)
  // - n=3: 2 directed each (6 directed, 4 group)
  // - n=4: 2 directed each (8 directed, 2 group)
  // - n=5..8: 1 directed each (5..8 directed, 5..2 group)
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

  // Determine group positions based on totalGroup count
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

  // Interleave participants to alternate age ranges
  // 1. Bucket participants by ageRange in order of first appearance
  const buckets = new Map<string, Participant[]>();
  for (const p of sorted) {
    if (!buckets.has(p.ageRange)) {
      buckets.set(p.ageRange, []);
    }
    buckets.get(p.ageRange)!.push(p);
  }

  // 2. Round-robin through distinct ageRange buckets
  const interleavedParticipants: Participant[] = [];
  const bucketList = Array.from(buckets.values());
  let added = true;
  let round = 0;
  while (added) {
    added = false;
    for (const bucket of bucketList) {
      if (round < bucket.length) {
        const item = bucket[round];
        if (item) {
          interleavedParticipants.push(item);
          added = true;
        }
      }
    }
    round++;
  }

  // 3. Build directed sequence (repeat interleaved sequence if directedPerParticipant > 1)
  const directedSequence: Participant[] = [];
  for (let rep = 0; rep < directedPerParticipant; rep++) {
    for (const p of interleavedParticipants) {
      directedSequence.push(p);
    }
  }

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
      const target = directedSequence[directedIndex++];
      if (!target) {
        throw new Error(`Secuencia de participantes insuficiente para la posición ${position}.`);
      }
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
