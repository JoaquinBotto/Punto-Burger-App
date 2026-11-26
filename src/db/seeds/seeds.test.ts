import { describe, it, expect } from 'vitest';
import { seedCategories } from './data/categories';
import { seedQuestions, originalSeedQuestions } from './data/questions';

describe('Seed Data Integrity and Quality (PPA-009 & PPA-CONTENT-001)', () => {
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

  it('contains exactly 360 approved seed questions in the expanded bank (60 per category)', () => {
    expect(seedQuestions.length).toBe(360);
  });

  it('ensures balanced difficulty distribution across the entire database (120 initial, 120 medium, 120 advanced)', () => {
    const initial = seedQuestions.filter((q) => q.difficulty === 'initial');
    const medium = seedQuestions.filter((q) => q.difficulty === 'medium');
    const advanced = seedQuestions.filter((q) => q.difficulty === 'advanced');

    expect(initial.length).toBe(120);
    expect(medium.length).toBe(120);
    expect(advanced.length).toBe(120);
  });

  it('ensures every single category has exactly 60 approved questions (20 initial, 20 medium, 20 advanced)', () => {
    for (const cat of seedCategories) {
      const catQuestions = seedQuestions.filter((q) => q.categorySlug === cat.slug);
      expect(catQuestions.length).toBe(60);

      const catInitial = catQuestions.filter((q) => q.difficulty === 'initial');
      const catMedium = catQuestions.filter((q) => q.difficulty === 'medium');
      const catAdvanced = catQuestions.filter((q) => q.difficulty === 'advanced');

      expect(catInitial.length).toBe(20);
      expect(catMedium.length).toBe(20);
      expect(catAdvanced.length).toBe(20);

      // Verify age distributions in each difficulty bucket (8 general, 4 child, 4 teen, 4 adult)
      for (const bucket of [catInitial, catMedium, catAdvanced]) {
        const general = bucket.filter((q) => q.ageRange === 'general');
        const child = bucket.filter((q) => q.ageRange === 'child');
        const teen = bucket.filter((q) => q.ageRange === 'teen');
        const adult = bucket.filter((q) => q.ageRange === 'adult');

        expect(general.length).toBe(8);
        expect(child.length).toBe(4);
        expect(teen.length).toBe(4);
        expect(adult.length).toBe(4);
      }
    }
  });

  it('ensures perfectly balanced distribution of correct options (exactly 90 of each A, B, C, D)', () => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    for (const q of seedQuestions) {
      counts[q.correctOption]++;
    }
    expect(counts.A).toBe(90);
    expect(counts.B).toBe(90);
    expect(counts.C).toBe(90);
    expect(counts.D).toBe(90);
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
