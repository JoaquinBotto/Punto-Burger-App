import { COMPETITION_ROUND_DIFFICULTIES } from './constants';
import type { CompetitionBlueprintSlotData } from './types';
import { defaultRng } from '@/modules/trivia/question-selection';

/**
 * Genera el blueprint inmutable oficial de 30 slots para una competencia.
 *
 * Reglas de equidad:
 * 1. 3 Ciclos de 10 preguntas cada uno (30 slots en total).
 * 2. Distribución de dificultad progresiva por ciclo:
 *    - Ciclo 1: 5 initial (pos 1-5), 4 medium (pos 6-9), 1 advanced (pos 10). Máximo: 1300 pts.
 *    - Ciclo 2: 3 initial (pos 1-3), 4 medium (pos 4-7), 3 advanced (pos 8-10). Máximo: 1500 pts.
 *    - Ciclo 3: 1 initial (pos 1), 4 medium (pos 2-5), 5 advanced (pos 6-10). Máximo: 1700 pts.
 * 3. 6 Categorías oficiales: cada una aparece EXACTAMENTE 5 veces en los 30 slots (6 x 5 = 30).
 * 4. Distribución balanceada entre ciclos: cada categoría aparece 1 o 2 veces en cada ciclo (nunca 0, nunca 3+).
 * 5. La asignación de categorías a las posiciones de cada ciclo se baraja de manera pseudoaleatoria auditable.
 */
export function generateCompetitionBlueprint(
  categoryIds: string[],
  rng: () => number = defaultRng
): CompetitionBlueprintSlotData[] {
  if (categoryIds.length !== 6) {
    throw new Error(
      `Se requieren exactamente 6 categorías para generar el blueprint de competencia. Recibidas: ${categoryIds.length}`
    );
  }

  // Barajar las 6 categorías para que el orden base varíe en cada competencia
  const shuffledCats = [...categoryIds];
  for (let i = shuffledCats.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = shuffledCats[i]!;
    shuffledCats[i] = shuffledCats[j]!;
    shuffledCats[j] = temp;
  }

  const [c0, c1, c2, c3, c4, c5] = shuffledCats as [string, string, string, string, string, string];

  // Matriz balanceada 2-2-1 / 2-2-1 / 2-2-1:
  // Ciclo 1: c0(2), c1(2), c2(2), c3(2), c4(1), c5(1) => 10 slots
  // Ciclo 2: c2(2), c3(2), c4(2), c5(2), c0(1), c1(1) => 10 slots
  // Ciclo 3: c4(2), c5(2), c0(2), c1(2), c2(1), c3(1) => 10 slots
  // Suma total por categoría: c0: 5, c1: 5, c2: 5, c3: 5, c4: 5, c5: 5
  const roundCategoryPools: Record<1 | 2 | 3, string[]> = {
    1: [c0, c0, c1, c1, c2, c2, c3, c3, c4, c5],
    2: [c2, c2, c3, c3, c4, c4, c5, c5, c0, c1],
    3: [c4, c4, c5, c5, c0, c0, c1, c1, c2, c3],
  };

  const slots: CompetitionBlueprintSlotData[] = [];

  for (const roundNum of [1, 2, 3] as const) {
    const difficulties = COMPETITION_ROUND_DIFFICULTIES[roundNum];
    const pool = [...roundCategoryPools[roundNum]];

    // Barajar los 10 elementos de pool para asignarlos a las posiciones 1..10
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const temp = pool[i]!;
      pool[i] = pool[j]!;
      pool[j] = temp;
    }

    for (let pos = 1; pos <= 10; pos++) {
      slots.push({
        roundNumber: roundNum,
        position: pos,
        difficulty: difficulties[pos - 1]!,
        categoryId: pool[pos - 1]!,
      });
    }
  }

  return slots;
}
