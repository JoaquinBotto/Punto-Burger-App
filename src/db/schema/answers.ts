import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { gameSessions } from './game-sessions';
import { gameQuestions } from './game-questions';

export const answers = pgTable(
  'answers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    gameSessionId: uuid('game_session_id')
      .notNull()
      .references(() => gameSessions.id, { onDelete: 'cascade' }),
    gameQuestionId: uuid('game_question_id')
      .notNull()
      .references(() => gameQuestions.id, { onDelete: 'restrict' }),
    selectedOption: text('selected_option', { enum: ['A', 'B', 'C', 'D'] }),
    result: text('result', { enum: ['correct', 'incorrect', 'unanswered'] }).notNull(),
    pointsAwarded: integer('points_awarded').notNull().default(0),
    answeredAt: timestamp('answered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Garantiza estrictamente que solo pueda existir una respuesta por pregunta de partida
    uniqueIndex('answers_game_question_unique_idx').on(table.gameQuestionId),
    index('answers_game_session_idx').on(table.gameSessionId),
  ]
);

export const answersRelations = relations(answers, ({ one }) => ({
  gameSession: one(gameSessions, {
    fields: [answers.gameSessionId],
    references: [gameSessions.id],
  }),
  gameQuestion: one(gameQuestions, {
    fields: [answers.gameQuestionId],
    references: [gameQuestions.id],
  }),
}));

export type Answer = typeof answers.$inferSelect;
export type NewAnswer = typeof answers.$inferInsert;
