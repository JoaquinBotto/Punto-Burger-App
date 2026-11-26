import { boolean, date, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { venues } from './venues';
import { competitionBlueprintSlots } from './competition-blueprint-slots';
import { competitionEntries } from './competition-entries';

export const competitions = pgTable(
  'competitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    venueId: uuid('venue_id')
      .notNull()
      .references(() => venues.id, { onDelete: 'restrict' }),
    localDate: date('local_date', { mode: 'string' }).notNull(),
    name: text('name'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    registrationOpensAt: timestamp('registration_opens_at', { withTimezone: true }).notNull(),
    joinCutoffAt: timestamp('join_cutoff_at', { withTimezone: true }).notNull(),
    finalizationGraceUntil: timestamp('finalization_grace_until', { withTimezone: true }).notNull(),
    status: text('status', {
      enum: ['scheduled', 'active', 'finalized', 'cancelled'],
    })
      .notNull()
      .default('scheduled'),
    isTest: boolean('is_test').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('competitions_venue_date_status_idx').on(table.venueId, table.localDate, table.status),
    index('competitions_status_idx').on(table.status),
  ]
);

export const competitionsRelations = relations(competitions, ({ one, many }) => ({
  venue: one(venues, {
    fields: [competitions.venueId],
    references: [venues.id],
  }),
  blueprintSlots: many(competitionBlueprintSlots),
  entries: many(competitionEntries),
}));

export type Competition = typeof competitions.$inferSelect;
export type NewCompetition = typeof competitions.$inferInsert;
