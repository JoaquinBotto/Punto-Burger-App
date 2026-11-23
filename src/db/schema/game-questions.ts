import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { gameSessions } from './game-sessions';
import { questions } from './questions';
import { answers } from './answers';

export const gameQuestions = pgTable(
  'game_questions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    gameSessionId: uuid('game_session_id')
      .notNull()
      .references(() => gameSessions.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    difficulty: text('difficulty', { enum: ['initial', 'medium', 'advanced'] }).notNull(),
    presentedAt: timestamp('presented_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('game_questions_session_position_idx').on(table.gameSessionId, table.position),
  ]
);

export const gameQuestionsRelations = relations(gameQuestions, ({ one }) => ({
  gameSession: one(gameSessions, {
    fields: [gameQuestions.gameSessionId],
    references: [gameSessions.id],
  }),
  question: one(questions, {
    fields: [gameQuestions.questionId],
    references: [questions.id],
  }),
  answer: one(answers, {
    fields: [gameQuestions.id],
    references: [answers.gameQuestionId],
  }),
}));

export type GameQuestion = typeof gameQuestions.$inferSelect;
export type NewGameQuestion = typeof gameQuestions.$inferInsert;
