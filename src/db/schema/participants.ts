import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { groups } from './groups';

export const participants = pgTable(
  'participants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    alias: text('alias').notNull(),
    ageRange: text('age_range').notNull(),
    educationLevel: text('education_level'),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('participants_group_id_idx').on(table.groupId)]
);

export const participantsRelations = relations(participants, ({ one }) => ({
  group: one(groups, {
    fields: [participants.groupId],
    references: [groups.id],
  }),
}));

export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
