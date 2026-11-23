import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { venues } from './venues';
import { tableSessions } from './table-sessions';

export const tables = pgTable(
  'tables',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    venueId: uuid('venue_id')
      .notNull()
      .references(() => venues.id, { onDelete: 'restrict' }),
    code: text('code').notNull(),
    displayName: text('display_name').notNull(),
    status: text('status', { enum: ['disabled', 'available', 'in_use', 'cooldown'] })
      .notNull()
      .default('available'),
    qrToken: text('qr_token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('tables_venue_code_idx').on(table.venueId, table.code)]
);

export const tablesRelations = relations(tables, ({ one, many }) => ({
  venue: one(venues, {
    fields: [tables.venueId],
    references: [venues.id],
  }),
  tableSessions: many(tableSessions),
}));

export type Table = typeof tables.$inferSelect;
export type NewTable = typeof tables.$inferInsert;
