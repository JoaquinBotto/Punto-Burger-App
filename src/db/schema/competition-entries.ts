import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { competitions } from './competitions';
import { tables } from './tables';
import { tableSessions } from './table-sessions';
import { groups } from './groups';
import { competitionRounds } from './competition-rounds';

export const competitionEntries = pgTable(
  'competition_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    competitionId: uuid('competition_id')
      .notNull()
      .references(() => competitions.id, { onDelete: 'restrict' }),
    tableId: uuid('table_id')
      .notNull()
      .references(() => tables.id, { onDelete: 'restrict' }),
    tableSessionId: uuid('table_session_id')
      .notNull()
      .references(() => tableSessions.id, { onDelete: 'restrict' }),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'restrict' }),
    status: text('status', {
      enum: ['registered', 'active', 'completed', 'abandoned', 'disqualified'],
    })
      .notNull()
      .default('registered'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('competition_entries_competition_table_unique').on(
      table.competitionId,
      table.tableId
    ),
    index('competition_entries_competition_status_idx').on(table.competitionId, table.status),
  ]
);

export const competitionEntriesRelations = relations(competitionEntries, ({ one, many }) => ({
  competition: one(competitions, {
    fields: [competitionEntries.competitionId],
    references: [competitions.id],
  }),
  table: one(tables, {
    fields: [competitionEntries.tableId],
    references: [tables.id],
  }),
  tableSession: one(tableSessions, {
    fields: [competitionEntries.tableSessionId],
    references: [tableSessions.id],
  }),
  group: one(groups, {
    fields: [competitionEntries.groupId],
    references: [groups.id],
  }),
  rounds: many(competitionRounds),
}));

export type CompetitionEntry = typeof competitionEntries.$inferSelect;
export type NewCompetitionEntry = typeof competitionEntries.$inferInsert;
