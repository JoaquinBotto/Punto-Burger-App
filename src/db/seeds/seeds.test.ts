import { describe, it, expect } from 'vitest';
import { seedCategories } from './data/categories';
import { seedQuestions } from './data/questions';

describe('Seed Data Integrity and Quality (PPA-009 Hotfix)', () => {
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

  it('contains exactly 72 approved seed questions (12 per category)', () => {
    expect(seedQuestions.length).toBe(72);
  });

  it('ensures balanced difficulty distribution across the entire database (24 initial, 24 medium, 24 advanced)', () => {
    const initial = seedQuestions.filter((q) => q.difficulty === 'initial');
    const medium = seedQuestions.filter((q) => q.difficulty === 'medium');
    const advanced = seedQuestions.filter((q) => q.difficulty === 'advanced');

    expect(initial.length).toBe(24);
    expect(medium.length).toBe(24);
    expect(advanced.length).toBe(24);
  });

  it('ensures every single category has sufficient approved questions to build a 10-question game (>= 3 initial, >= 4 medium, >= 3 advanced)', () => {
    for (const cat of seedCategories) {
      const catQuestions = seedQuestions.filter((q) => q.categorySlug === cat.slug);
      expect(catQuestions.length).toBeGreaterThanOrEqual(10);
      expect(catQuestions.length).toBe(12);

      const catInitial = catQuestions.filter((q) => q.difficulty === 'initial');
      const catMedium = catQuestions.filter((q) => q.difficulty === 'medium');
      const catAdvanced = catQuestions.filter((q) => q.difficulty === 'advanced');

      expect(catInitial.length).toBeGreaterThanOrEqual(3);
      expect(catMedium.length).toBeGreaterThanOrEqual(4);
      expect(catAdvanced.length).toBeGreaterThanOrEqual(3);

      expect(catInitial.length).toBe(4);
      expect(catMedium.length).toBe(4);
      expect(catAdvanced.length).toBe(4);
    }
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
