import { describe, it, expect } from 'vitest';
import { generateCompetitionBlueprint } from './blueprint-generator';
import {
  ROUND_1_MAX_SCORE,
  ROUND_2_MAX_SCORE,
  ROUND_3_MAX_SCORE,
  TOTAL_COMPETITION_MAX_SCORE,
} from './constants';
import { calculatePoints } from '@/modules/trivia/scoring';

describe('Competition Blueprint Generator', () => {
  const dummyCategories = [
    'cat-cultura',
    'cat-deportes',
    'cat-ciencia',
    'cat-geografia',
    'cat-historia',
    'cat-entretenimiento',
  ];

  it('throws if categoryIds length is not 6', () => {
    expect(() => generateCompetitionBlueprint(dummyCategories.slice(0, 5))).toThrow(
      /exactamente 6 categorías/
    );
  });

  it('generates exactly 30 slots across 3 rounds', () => {
    const slots = generateCompetitionBlueprint(dummyCategories);
    expect(slots).toHaveLength(30);

    const r1 = slots.filter((s) => s.roundNumber === 1);
    const r2 = slots.filter((s) => s.roundNumber === 2);
    const r3 = slots.filter((s) => s.roundNumber === 3);

    expect(r1).toHaveLength(10);
    expect(r2).toHaveLength(10);
    expect(r3).toHaveLength(10);
  });

  it('contains each of the 6 categories exactly 5 times across the 30 slots', () => {
    const slots = generateCompetitionBlueprint(dummyCategories);
    const catCounts: Record<string, number> = {};

    for (const s of slots) {
      catCounts[s.categoryId] = (catCounts[s.categoryId] || 0) + 1;
    }

    expect(Object.keys(catCounts)).toHaveLength(6);
    for (const catId of dummyCategories) {
      expect(catCounts[catId]).toBe(5);
    }
  });

  it('distributes categories in each round such that every category appears 1 or 2 times', () => {
    const slots = generateCompetitionBlueprint(dummyCategories);

    for (const roundNum of [1, 2, 3]) {
      const roundSlots = slots.filter((s) => s.roundNumber === roundNum);
      const roundCounts: Record<string, number> = {};

      for (const s of roundSlots) {
        roundCounts[s.categoryId] = (roundCounts[s.categoryId] || 0) + 1;
      }

      for (const catId of dummyCategories) {
        const count = roundCounts[catId] || 0;
        expect(count).toBeGreaterThanOrEqual(1);
        expect(count).toBeLessThanOrEqual(2);
      }
    }
  });

  it('strictly adheres to progressive difficulty distribution per round', () => {
    const slots = generateCompetitionBlueprint(dummyCategories);

    // Ciclo 1: 5 initial (pos 1-5), 4 medium (pos 6-9), 1 advanced (pos 10)
    const r1 = slots.filter((s) => s.roundNumber === 1);
    for (let pos = 1; pos <= 5; pos++) {
      expect(r1.find((s) => s.position === pos)?.difficulty).toBe('initial');
    }
    for (let pos = 6; pos <= 9; pos++) {
      expect(r1.find((s) => s.position === pos)?.difficulty).toBe('medium');
    }
    expect(r1.find((s) => s.position === 10)?.difficulty).toBe('advanced');

    // Ciclo 2: 3 initial (pos 1-3), 4 medium (pos 4-7), 3 advanced (pos 8-10)
    const r2 = slots.filter((s) => s.roundNumber === 2);
    for (let pos = 1; pos <= 3; pos++) {
      expect(r2.find((s) => s.position === pos)?.difficulty).toBe('initial');
    }
    for (let pos = 4; pos <= 7; pos++) {
      expect(r2.find((s) => s.position === pos)?.difficulty).toBe('medium');
    }
    for (let pos = 8; pos <= 10; pos++) {
      expect(r2.find((s) => s.position === pos)?.difficulty).toBe('advanced');
    }

    // Ciclo 3: 1 initial (pos 1), 4 medium (pos 2-5), 5 advanced (pos 6-10)
    const r3 = slots.filter((s) => s.roundNumber === 3);
    expect(r3.find((s) => s.position === 1)?.difficulty).toBe('initial');
    for (let pos = 2; pos <= 5; pos++) {
      expect(r3.find((s) => s.position === pos)?.difficulty).toBe('medium');
    }
    for (let pos = 6; pos <= 10; pos++) {
      expect(r3.find((s) => s.position === pos)?.difficulty).toBe('advanced');
    }
  });

  it('matches theoretical maximum scores: 1300, 1500, 1700, and 4500 total', () => {
    const slots = generateCompetitionBlueprint(dummyCategories);

    const r1 = slots.filter((s) => s.roundNumber === 1);
    const r2 = slots.filter((s) => s.roundNumber === 2);
    const r3 = slots.filter((s) => s.roundNumber === 3);

    const r1Max = r1.reduce((sum, s) => sum + calculatePoints(s.difficulty, 'correct'), 0);
    const r2Max = r2.reduce((sum, s) => sum + calculatePoints(s.difficulty, 'correct'), 0);
    const r3Max = r3.reduce((sum, s) => sum + calculatePoints(s.difficulty, 'correct'), 0);

    expect(r1Max).toBe(ROUND_1_MAX_SCORE);
    expect(r1Max).toBe(1300);

    expect(r2Max).toBe(ROUND_2_MAX_SCORE);
    expect(r2Max).toBe(1500);

    expect(r3Max).toBe(ROUND_3_MAX_SCORE);
    expect(r3Max).toBe(1700);

    expect(r1Max + r2Max + r3Max).toBe(TOTAL_COMPETITION_MAX_SCORE);
    expect(r1Max + r2Max + r3Max).toBe(4500);
  });
});
