import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tables } from './tables';
import { accessCodes } from './access-codes';
import { tableSessions } from './table-sessions';
import { auditEvents } from './audit-events';

export const venues = pgTable('venues', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  status: text('status', { enum: ['active', 'inactive'] })
    .notNull()
    .default('active'),
  timezone: text('timezone').notNull().default('America/Argentina/Cordoba'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const venuesRelations = relations(venues, ({ many }) => ({
  tables: many(tables),
  accessCodes: many(accessCodes),
  tableSessions: many(tableSessions),
  auditEvents: many(auditEvents),
}));

export type Venue = typeof venues.$inferSelect;
export type NewVenue = typeof venues.$inferInsert;
