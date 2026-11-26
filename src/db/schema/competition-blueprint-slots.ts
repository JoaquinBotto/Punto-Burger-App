import { check, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { competitions } from './competitions';
import { categories } from './categories';

export const competitionBlueprintSlots = pgTable(
  'competition_blueprint_slots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    competitionId: uuid('competition_id')
      .notNull()
      .references(() => competitions.id, { onDelete: 'cascade' }),
    roundNumber: integer('round_number').notNull(),
    position: integer('position').notNull(),
    difficulty: text('difficulty', { enum: ['initial', 'medium', 'advanced'] }).notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('competition_blueprint_slots_comp_round_pos_idx').on(
      table.competitionId,
      table.roundNumber,
      table.position
    ),
    check('competition_blueprint_slots_round_range', sql`"round_number" BETWEEN 1 AND 3`),
    check('competition_blueprint_slots_position_range', sql`"position" BETWEEN 1 AND 10`),
  ]
);

export const competitionBlueprintSlotsRelations = relations(
  competitionBlueprintSlots,
  ({ one }) => ({
    competition: one(competitions, {
      fields: [competitionBlueprintSlots.competitionId],
      references: [competitions.id],
    }),
    category: one(categories, {
      fields: [competitionBlueprintSlots.categoryId],
      references: [categories.id],
    }),
  })
);

export type CompetitionBlueprintSlot = typeof competitionBlueprintSlots.$inferSelect;
export type NewCompetitionBlueprintSlot = typeof competitionBlueprintSlots.$inferInsert;
