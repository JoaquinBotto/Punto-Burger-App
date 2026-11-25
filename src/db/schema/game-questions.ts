import { check, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { gameSessions } from './game-sessions';
import { questions } from './questions';
import { answers } from './answers';
import { participants } from './participants';

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
    targetParticipantId: uuid('target_participant_id').references(() => participants.id, {
      onDelete: 'restrict',
    }),
    promptSnapshot: text('prompt_snapshot').notNull(),
    optionASnapshot: text('option_a_snapshot').notNull(),
    optionBSnapshot: text('option_b_snapshot').notNull(),
    optionCSnapshot: text('option_c_snapshot').notNull(),
    optionDSnapshot: text('option_d_snapshot').notNull(),
    correctOptionSnapshot: text('correct_option_snapshot', {
      enum: ['A', 'B', 'C', 'D'],
    }).notNull(),
    explanationSnapshot: text('explanation_snapshot'),
    ageRangeSnapshot: text('age_range_snapshot').notNull(),
    educationLevelSnapshot: text('education_level_snapshot'),
    presentedAt: timestamp('presented_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('game_questions_session_position_idx').on(table.gameSessionId, table.position),
    uniqueIndex('game_questions_session_question_unique').on(table.gameSessionId, table.questionId),
    check('game_questions_position_range', sql`"position" BETWEEN 1 AND 10`),
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
  targetParticipant: one(participants, {
    fields: [gameQuestions.targetParticipantId],
    references: [participants.id],
  }),
  answer: one(answers, {
    fields: [gameQuestions.id],
    references: [answers.gameQuestionId],
  }),
}));

export type GameQuestion = typeof gameQuestions.$inferSelect;
export type NewGameQuestion = typeof gameQuestions.$inferInsert;
