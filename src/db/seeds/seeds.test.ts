import { describe, it, expect } from 'vitest';
import { seedCategories } from './data/categories';
import { seedQuestions, originalSeedQuestions, expandedSeedQuestions } from './data/questions';
import { expansion002Questions } from './data/expansion-002';

describe('Seed Data Integrity and Quality (PPA-009, PPA-CONTENT-001 & PPA-CONTENT-002)', () => {
  it('defines 6 active trivia categories', () => {
    expect(seedCategories.length).toBe(6);
    const slugs = seedCategories.map((c) => c.slug);
    expect(slugs).toContain('cultura-general');
    expect(slugs).toContain('deportes');
    expect(slugs).toContain('ciencia-naturaleza');
    expect(slugs).toContain('geografia');
    expect(slugs).toContain('historia');
    expect(slugs).toContain('entretenimiento');

    for (const cat of seedCategories) {
      expect(cat.name.trim().length).toBeGreaterThan(0);
      expect(cat.status).toBe('active');
    }
  });

  it('preserves the original 72 approved seed questions intact (12 per category)', () => {
    expect(originalSeedQuestions.length).toBe(72);

    for (const cat of seedCategories) {
      const catQuestions = originalSeedQuestions.filter((q) => q.categorySlug === cat.slug);
      expect(catQuestions.length).toBe(12);

      const catInitial = catQuestions.filter((q) => q.difficulty === 'initial');
      const catMedium = catQuestions.filter((q) => q.difficulty === 'medium');
      const catAdvanced = catQuestions.filter((q) => q.difficulty === 'advanced');

      expect(catInitial.length).toBe(4);
      expect(catMedium.length).toBe(4);
      expect(catAdvanced.length).toBe(4);
    }
  });

  it('preserves the base 360 approved seed questions from PPA-CONTENT-001', () => {
    const base360 = [...originalSeedQuestions, ...expandedSeedQuestions];
    expect(base360.length).toBe(360);
  });

  it('contains exactly 402 new approved questions in expansion-002 (67 per category)', () => {
    expect(expansion002Questions.length).toBe(402);
  });

  it('contains exactly 762 approved seed questions in the expanded bank (127 per category)', () => {
    expect(seedQuestions.length).toBe(762);
  });

  it('ensures balanced difficulty distribution across the entire database (254 initial, 254 medium, 254 advanced)', () => {
    const initial = seedQuestions.filter((q) => q.difficulty === 'initial');
    const medium = seedQuestions.filter((q) => q.difficulty === 'medium');
    const advanced = seedQuestions.filter((q) => q.difficulty === 'advanced');

    expect(initial.length).toBe(254);
    expect(medium.length).toBe(254);
    expect(advanced.length).toBe(254);
  });

  it('ensures every single category has exactly 127 approved questions with the expected difficulty breakdown', () => {
    const expectedByCategory: Record<
      string,
      { initial: number; medium: number; advanced: number }
    > = {
      'cultura-general': { initial: 43, medium: 42, advanced: 42 },
      deportes: { initial: 42, medium: 43, advanced: 42 },
      'ciencia-naturaleza': { initial: 42, medium: 42, advanced: 43 },
      geografia: { initial: 43, medium: 42, advanced: 42 },
      historia: { initial: 42, medium: 43, advanced: 42 },
      entretenimiento: { initial: 42, medium: 42, advanced: 43 },
    };

    for (const cat of seedCategories) {
      const catQuestions = seedQuestions.filter((q) => q.categorySlug === cat.slug);
      expect(catQuestions.length).toBe(127);

      const catInitial = catQuestions.filter((q) => q.difficulty === 'initial');
      const catMedium = catQuestions.filter((q) => q.difficulty === 'medium');
      const catAdvanced = catQuestions.filter((q) => q.difficulty === 'advanced');

      const expected = expectedByCategory[cat.slug]!;
      expect(catInitial.length).toBe(expected.initial);
      expect(catMedium.length).toBe(expected.medium);
      expect(catAdvanced.length).toBe(expected.advanced);
    }
  });

  it('ensures perfectly balanced distribution of correct options (191 A, 191 B, 190 C, 190 D)', () => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    for (const q of seedQuestions) {
      counts[q.correctOption]++;
    }
    expect(counts.A).toBe(191);
    expect(counts.B).toBe(191);
    expect(counts.C).toBe(190);
    expect(counts.D).toBe(190);
  });

  it('validates every seed question adheres to quality and structure constraints', () => {
    const categorySlugs = new Set(seedCategories.map((c) => c.slug));
    const prompts = new Set<string>();

    for (const q of seedQuestions) {
      // Pertenece a una categoría existente
      expect(categorySlugs.has(q.categorySlug)).toBe(true);

      // Prompt no vacío y único
      expect(q.prompt.trim().length).toBeGreaterThan(10);
      expect(prompts.has(q.prompt)).toBe(false);
      prompts.add(q.prompt);

      // 4 opciones completas y distintas
      expect(q.optionA.trim().length).toBeGreaterThan(0);
      expect(q.optionB.trim().length).toBeGreaterThan(0);
      expect(q.optionC.trim().length).toBeGreaterThan(0);
      expect(q.optionD.trim().length).toBeGreaterThan(0);

      const optionsSet = new Set([q.optionA, q.optionB, q.optionC, q.optionD]);
      expect(optionsSet.size).toBe(4);

      // Opción correcta válida
      expect(['A', 'B', 'C', 'D']).toContain(q.correctOption);

      // Estado aprobado para pruebas
      expect(q.status).toBe('approved');

      // Explicación didáctica presente
      expect(q.explanation.trim().length).toBeGreaterThan(5);
    }
  });
});
