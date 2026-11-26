import { check, integer, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { competitionEntries } from './competition-entries';
import { gameSessions } from './game-sessions';

export const competitionRounds = pgTable(
  'competition_rounds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    competitionEntryId: uuid('competition_entry_id')
      .notNull()
      .references(() => competitionEntries.id, { onDelete: 'cascade' }),
    roundNumber: integer('round_number').notNull(),
    gameSessionId: uuid('game_session_id')
      .notNull()
      .unique()
      .references(() => gameSessions.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('competition_rounds_entry_round_unique').on(
      table.competitionEntryId,
      table.roundNumber
    ),
    check('competition_rounds_round_range', sql`"round_number" BETWEEN 1 AND 3`),
  ]
);

export const competitionRoundsRelations = relations(competitionRounds, ({ one }) => ({
  entry: one(competitionEntries, {
    fields: [competitionRounds.competitionEntryId],
    references: [competitionEntries.id],
  }),
  gameSession: one(gameSessions, {
    fields: [competitionRounds.gameSessionId],
    references: [gameSessions.id],
  }),
}));

export type CompetitionRound = typeof competitionRounds.$inferSelect;
export type NewCompetitionRound = typeof competitionRounds.$inferInsert;
