import { index, pgTable, text, timestamp, uuid, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tableSessions } from './table-sessions';

export const devices = pgTable(
  'devices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tableSessionId: uuid('table_session_id')
      .notNull()
      .references((): AnyPgColumn => tableSessions.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    status: text('status', { enum: ['active', 'revoked'] })
      .notNull()
      .default('active'),
    claimedAt: timestamp('claimed_at', { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('devices_table_session_status_idx').on(table.tableSessionId, table.status)]
);

export const devicesRelations = relations(devices, ({ one }) => ({
  tableSession: one(tableSessions, {
    fields: [devices.tableSessionId],
    references: [tableSessions.id],
  }),
}));

export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
