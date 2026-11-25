import { and, asc, eq, sql } from 'drizzle-orm';
import type { Database } from '../client';
import { categories, type Category } from '../schema/categories';
import { questions } from '../schema/questions';
import { CATEGORY_READINESS_REQUIREMENTS } from '../../modules/groups/constants';
import type { CategoryReadinessInfo, CategoryWithReadiness } from '../../modules/groups/types';

export async function getActiveCategories(db: Database): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(eq(categories.status, 'active'))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getCategoryBySlug(db: Database, slug: string): Promise<Category | null> {
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);

  return result[0] ?? null;
}

/**
 * Comprueba el readiness de preguntas aprobadas para una categoría (3 initial, 4 medium, 3 advanced).
 */
export async function checkCategoryReadiness(
  db: Database,
  categoryId: string
): Promise<CategoryReadinessInfo> {
  const counts = await db
    .select({
      difficulty: questions.difficulty,
      count: sql<number>`count(*)::int`,
    })
    .from(questions)
    .where(and(eq(questions.categoryId, categoryId), eq(questions.status, 'approved')))
    .groupBy(questions.difficulty);

  let initialCount = 0;
  let mediumCount = 0;
  let advancedCount = 0;

  for (const row of counts) {
    if (row.difficulty === 'initial') initialCount = Number(row.count);
    if (row.difficulty === 'medium') mediumCount = Number(row.count);
    if (row.difficulty === 'advanced') advancedCount = Number(row.count);
  }

  const isReady =
    initialCount >= CATEGORY_READINESS_REQUIREMENTS.initial &&
    mediumCount >= CATEGORY_READINESS_REQUIREMENTS.medium &&
    advancedCount >= CATEGORY_READINESS_REQUIREMENTS.advanced;

  return {
    isReady,
    initialCount,
    mediumCount,
    advancedCount,
  };
}

/**
 * Obtiene todas las categorías activas con su flag isReady calculado server-side.
 */
export async function getActiveCategoriesWithReadiness(
  db: Database
): Promise<CategoryWithReadiness[]> {
  const activeList = await getActiveCategories(db);

  // Consultar todas las preguntas aprobadas agrupadas por category_id y difficulty
  const counts = await db
    .select({
      categoryId: questions.categoryId,
      difficulty: questions.difficulty,
      count: sql<number>`count(*)::int`,
    })
    .from(questions)
    .where(eq(questions.status, 'approved'))
    .groupBy(questions.categoryId, questions.difficulty);

  const statsMap = new Map<string, { initial: number; medium: number; advanced: number }>();

  for (const row of counts) {
    let stat = statsMap.get(row.categoryId);
    if (!stat) {
      stat = { initial: 0, medium: 0, advanced: 0 };
      statsMap.set(row.categoryId, stat);
    }
    if (row.difficulty === 'initial') stat.initial = Number(row.count);
    if (row.difficulty === 'medium') stat.medium = Number(row.count);
    if (row.difficulty === 'advanced') stat.advanced = Number(row.count);
  }

  return activeList.map((category) => {
    const stat = statsMap.get(category.id) ?? { initial: 0, medium: 0, advanced: 0 };
    const isReady =
      stat.initial >= CATEGORY_READINESS_REQUIREMENTS.initial &&
      stat.medium >= CATEGORY_READINESS_REQUIREMENTS.medium &&
      stat.advanced >= CATEGORY_READINESS_REQUIREMENTS.advanced;

    return {
      ...category,
      isReady,
    };
  });
}
