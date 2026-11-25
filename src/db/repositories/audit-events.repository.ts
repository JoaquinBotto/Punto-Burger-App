import type { Database } from '../client';
import { auditEvents, type AuditEvent, type NewAuditEvent } from '../schema/audit-events';

/**
 * Registra un evento de auditoría inmutable en la base de datos.
 */
export async function createAuditEvent(db: Database, data: NewAuditEvent): Promise<AuditEvent> {
  const [created] = await db.insert(auditEvents).values(data).returning();
  if (!created) {
    throw new Error('No se pudo registrar el evento de auditoría.');
  }
  return created;
}
