import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { tableSessions } from './table-sessions';
import { groups } from './groups';
import { categories } from './categories';
import { gameQuestions } from './game-questions';
import { answers } from './answers';

export const gameSessions = pgTable(
  'game_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tableSessionId: uuid('table_session_id')
      .notNull()
      .references(() => tableSessions.id, { onDelete: 'restrict' }),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'restrict' }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'restrict' }),
    status: text('status', {
      enum: ['created', 'active', 'completed', 'abandoned', 'invalidated'],
    })
      .notNull()
      .default('created'),
    rankingEligible: boolean('ranking_eligible').notNull().default(true),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    totalScore: integer('total_score').notNull().default(0),
    correctCount: integer('correct_count').notNull().default(0),
    incorrectCount: integer('incorrect_count').notNull().default(0),
    unansweredCount: integer('unanswered_count').notNull().default(0),
    currentQuestionIndex: integer('current_question_index').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('game_sessions_table_session_status_idx').on(table.tableSessionId, table.status),
    index('game_sessions_ranking_idx').on(table.status, table.rankingEligible, table.finishedAt),
    uniqueIndex('game_sessions_active_table_session_idx')
      .on(table.tableSessionId)
      .where(sql`status IN ('created', 'active')`),
  ]
);

export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  tableSession: one(tableSessions, {
    fields: [gameSessions.tableSessionId],
    references: [tableSessions.id],
  }),
  group: one(groups, {
    fields: [gameSessions.groupId],
    references: [groups.id],
  }),
  category: one(categories, {
    fields: [gameSessions.categoryId],
    references: [categories.id],
  }),
  gameQuestions: many(gameQuestions),
  answers: many(answers),
}));

export type GameSession = typeof gameSessions.$inferSelect;
export type NewGameSession = typeof gameSessions.$inferInsert;
