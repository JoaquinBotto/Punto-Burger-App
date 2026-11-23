import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { venues } from './venues';

/**
 * Tabla access_codes:
 * Con el diseño determinístico HMAC-SHA256 (PPA-009 Hotfix), el código temporal de local
 * se calcula en runtime a partir de (venue_id + time_window + ACCESS_CODE_SECRET) sin requerir
 * escrituras periódicas continuas en la base de datos.
 *
 * Esta tabla se preserva como registro de auditoría, trazabilidad y soporte para eventuales
 * códigos excepcionales emitidos manualmente o forzados por el personal administrativo.
 * NUNCA almacena el código temporal en texto plano, únicamente su representación hash.
 */
export const accessCodes = pgTable(
  'access_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    venueId: uuid('venue_id')
      .notNull()
      .references(() => venues.id, { onDelete: 'restrict' }),
    codeHash: text('code_hash').notNull(),
    validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
    graceUntil: timestamp('grace_until', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('access_codes_venue_valid_until_idx').on(table.venueId, table.validUntil)]
);

export const accessCodesRelations = relations(accessCodes, ({ one }) => ({
  venue: one(venues, {
    fields: [accessCodes.venueId],
    references: [venues.id],
  }),
}));

export type AccessCode = typeof accessCodes.$inferSelect;
export type NewAccessCode = typeof accessCodes.$inferInsert;
