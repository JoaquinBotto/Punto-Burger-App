import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { categories } from './categories';
import { gameQuestions } from './game-questions';

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    prompt: text('prompt').notNull(),
    optionA: text('option_a').notNull(),
    optionB: text('option_b').notNull(),
    optionC: text('option_c').notNull(),
    optionD: text('option_d').notNull(),
    correctOption: text('correct_option', { enum: ['A', 'B', 'C', 'D'] }).notNull(),
    difficulty: text('difficulty', { enum: ['initial', 'medium', 'advanced'] }).notNull(),
    ageRange: text('age_range').notNull(),
    educationLevel: text('education_level'),
    explanation: text('explanation'),
    status: text('status', { enum: ['draft', 'approved', 'rejected', 'archived'] })
      .notNull()
      .default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('questions_cat_status_diff_idx').on(table.categoryId, table.status, table.difficulty),
  ]
);

export const questionsRelations = relations(questions, ({ one, many }) => ({
  category: one(categories, {
    fields: [questions.categoryId],
    references: [categories.id],
  }),
  gameQuestions: many(gameQuestions),
}));

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
