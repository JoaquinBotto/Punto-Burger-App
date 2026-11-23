import { asc, eq } from 'drizzle-orm';
import type { Database } from '../client';
import { categories, type Category } from '../schema/categories';

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
