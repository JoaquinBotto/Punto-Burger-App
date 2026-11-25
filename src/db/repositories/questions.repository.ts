import { and, eq } from 'drizzle-orm';
import type { DbClient } from '../client';
import { questions, type Question } from '../schema/questions';

export interface QuestionFilters {
  categoryId?: string;
  difficulty?: 'initial' | 'medium' | 'advanced';
}

export async function getApprovedQuestions(
  db: DbClient,
  filters?: QuestionFilters
): Promise<Question[]> {
  const conditions = [eq(questions.status, 'approved')];

  if (filters?.categoryId) {
    conditions.push(eq(questions.categoryId, filters.categoryId));
  }
  if (filters?.difficulty) {
    conditions.push(eq(questions.difficulty, filters.difficulty));
  }

  return db
    .select()
    .from(questions)
    .where(and(...conditions));
}

export async function getApprovedQuestionsForCategory(
  db: DbClient,
  categoryId: string
): Promise<Question[]> {
  return db
    .select()
    .from(questions)
    .where(and(eq(questions.status, 'approved'), eq(questions.categoryId, categoryId)));
}
