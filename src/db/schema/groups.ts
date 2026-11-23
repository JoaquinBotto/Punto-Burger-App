import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tableSessions } from './table-sessions';
import { participants } from './participants';
import { gameSessions } from './game-sessions';

export const groups = pgTable('groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  tableSessionId: uuid('table_session_id')
    .notNull()
    .references(() => tableSessions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const groupsRelations = relations(groups, ({ one, many }) => ({
  tableSession: one(tableSessions, {
    fields: [groups.tableSessionId],
    references: [tableSessions.id],
  }),
  participants: many(participants),
  gameSessions: many(gameSessions),
}));

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
