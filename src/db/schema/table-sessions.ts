import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { venues } from './venues';
import { tables } from './tables';
import { devices } from './devices';
import { groups } from './groups';
import { gameSessions } from './game-sessions';

export const tableSessions = pgTable(
  'table_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    venueId: uuid('venue_id')
      .notNull()
      .references(() => venues.id, { onDelete: 'restrict' }),
    tableId: uuid('table_id')
      .notNull()
      .references(() => tables.id, { onDelete: 'restrict' }),
    status: text('status', { enum: ['active', 'expired', 'closed', 'invalidated'] })
      .notNull()
      .default('active'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    cooldownUntil: timestamp('cooldown_until', { withTimezone: true }),
    // Dispositivo que ostenta el control activo de la mesa (nullable en cooldown/creación)
    activeDeviceId: uuid('active_device_id').references((): AnyPgColumn => devices.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Garantiza que solo exista una sesión en estado 'active' por mesa simultáneamente a nivel PostgreSQL
    uniqueIndex('table_sessions_active_table_idx')
      .on(table.tableId)
      .where(sql`status = 'active'`),
    index('table_sessions_table_status_idx').on(table.tableId, table.status),
  ]
);

export const tableSessionsRelations = relations(tableSessions, ({ one, many }) => ({
  venue: one(venues, {
    fields: [tableSessions.venueId],
    references: [venues.id],
  }),
  table: one(tables, {
    fields: [tableSessions.tableId],
    references: [tables.id],
  }),
  activeDevice: one(devices, {
    fields: [tableSessions.activeDeviceId],
    references: [devices.id],
  }),
  devices: many(devices),
  groups: many(groups),
  gameSessions: many(gameSessions),
}));

export type TableSession = typeof tableSessions.$inferSelect;
export type NewTableSession = typeof tableSessions.$inferInsert;
