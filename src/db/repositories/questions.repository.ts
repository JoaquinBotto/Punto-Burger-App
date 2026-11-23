import { and, eq } from 'drizzle-orm';
import type { Database } from '../client';
import { questions, type Question } from '../schema/questions';

export interface QuestionFilters {
  categoryId?: string;
  difficulty?: 'initial' | 'medium' | 'advanced';
}

export async function getApprovedQuestions(
  db: Database,
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
