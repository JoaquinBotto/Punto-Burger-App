import { eq, and } from 'drizzle-orm';
import type { Database } from '@/db/client';
import { tables, tableSessions, gameSessions, competitionEntries } from '@/db/schema';
import { updateTableStatus } from '@/db/repositories/tables.repository';
import { updateSessionStatus, revokeDevice } from '@/db/repositories/table-sessions.repository';
import { createAuditEvent } from '@/db/repositories/audit-events.repository';
import { TableNotFoundError } from './errors';

export interface RenewTableOptions {
  force?: boolean;
  operatorId?: string;
}

export interface RenewTableResult {
  ok: true;
  tableCode: string;
  tableDisplayName: string;
  previousSessionId: string | null;
  previousCompetitionEntryId: string | null;
  forced: boolean;
  message: string;
}

export async function renewTable(
  db: Database,
  tableCode: string,
  options: RenewTableOptions = {},
  now = new Date()
): Promise<RenewTableResult> {
  const normalizedCode = tableCode.trim().toLowerCase();
  const force = Boolean(options.force);
  const operatorId = options.operatorId ?? 'cli-operator';

  return db.transaction(async (tx) => {
    // 1. Resolver mesa por code con lock
    const [table] = await tx
      .select()
      .from(tables)
      .where(eq(tables.code, normalizedCode))
      .for('update');

    if (!table) {
      throw new TableNotFoundError(`Mesa ${tableCode} no encontrada.`);
    }

    // 2. Localizar table_session activa
    const [activeSession] = await tx
      .select()
      .from(tableSessions)
      .where(and(eq(tableSessions.tableId, table.id), eq(tableSessions.status, 'active')))
      .limit(1);

    if (!activeSession) {
      // Si la mesa no tiene sesión activa, asegurar que esté disponible y sin cooldown
      await updateTableStatus(tx, table.id, 'available');

      await createAuditEvent(tx, {
        venueId: table.venueId,
        eventType: 'table_renewed',
        entityType: 'table',
        entityId: table.id,
        actorType: 'operator',
        actorId: operatorId,
        metadata: {
          tableCode: table.code,
          oldTableSessionId: null,
          oldCompetitionEntryId: null,
          forced: force,
          timestamp: now.toISOString(),
        },
      });

      return {
        ok: true,
        tableCode: table.code,
        tableDisplayName: table.displayName,
        previousSessionId: null,
        previousCompetitionEntryId: null,
        forced: force,
        message: `Mesa ${table.displayName} renovada y disponible (no tenía sesión activa).`,
      };
    }

    // 3. Comprobar partidas asociadas a la sesión activa
    const sessionGames = await tx
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.tableSessionId, activeSession.id));

    const activeGame = sessionGames.find((g) => g.status === 'active');
    if (activeGame && !force) {
      throw new Error(`Hay una partida activa en ${table.displayName}.`);
    }

    // 4. Comprobar competition_entry asociada a la sesión
    const [compEntry] = await tx
      .select()
      .from(competitionEntries)
      .where(eq(competitionEntries.tableSessionId, activeSession.id))
      .limit(1);

    let entryWasAbandoned = false;

    if (force) {
      // Con --force:
      // Si existe game_session created o active -> marcar abandoned
      for (const gs of sessionGames) {
        if (gs.status === 'created' || gs.status === 'active') {
          await tx
            .update(gameSessions)
            .set({ status: 'abandoned', finishedAt: now, updatedAt: now })
            .where(eq(gameSessions.id, gs.id));
        }
      }
    } else {
      // Sin --force (no había active game, pero puede haber created huérfano)
      for (const gs of sessionGames) {
        if (gs.status === 'created') {
          await tx
            .update(gameSessions)
            .set({ status: 'abandoned', finishedAt: now, updatedAt: now })
            .where(eq(gameSessions.id, gs.id));
        }
      }
    }

    // Tanto con --force como sin --force:
    // Si table:renew cierra la table_session, cualquier competition_entry asociada en registered o active
    // DEBE pasar a abandoned (NO tocar completed).
    if (compEntry && (compEntry.status === 'registered' || compEntry.status === 'active')) {
      await tx
        .update(competitionEntries)
        .set({ status: 'abandoned', updatedAt: now })
        .where(eq(competitionEntries.id, compEntry.id));
      entryWasAbandoned = true;
    }

    // 5. Cerrar correctamente sesión previa y limpiar cooldown
    await updateSessionStatus(tx, activeSession.id, 'closed', now, null);

    // 6. Revocar dispositivo si había uno activo
    if (activeSession.activeDeviceId) {
      await revokeDevice(tx, activeSession.activeDeviceId, now);
    }

    // 7. Establecer table.status = 'available'
    await updateTableStatus(tx, table.id, 'available');

    // 8. Auditoría
    if (entryWasAbandoned && compEntry) {
      await createAuditEvent(tx, {
        venueId: table.venueId,
        eventType: 'competition_entry_abandoned_by_operator',
        entityType: 'competition_entry',
        entityId: compEntry.id,
        actorType: 'operator',
        actorId: operatorId,
        metadata: {
          tableCode: table.code,
          oldTableSessionId: activeSession.id,
          oldCompetitionEntryId: compEntry.id,
          forced: force,
          timestamp: now.toISOString(),
        },
      });
    }

    await createAuditEvent(tx, {
      venueId: table.venueId,
      eventType: 'table_session_closed_by_operator',
      entityType: 'table_session',
      entityId: activeSession.id,
      actorType: 'operator',
      actorId: operatorId,
      metadata: {
        tableCode: table.code,
        oldTableSessionId: activeSession.id,
        oldCompetitionEntryId: compEntry ? compEntry.id : null,
        forced: force,
        timestamp: now.toISOString(),
      },
    });

    await createAuditEvent(tx, {
      venueId: table.venueId,
      eventType: 'table_renewed',
      entityType: 'table',
      entityId: table.id,
      actorType: 'operator',
      actorId: operatorId,
      metadata: {
        tableCode: table.code,
        oldTableSessionId: activeSession.id,
        oldCompetitionEntryId: compEntry ? compEntry.id : null,
        forced: force,
        timestamp: now.toISOString(),
      },
    });

    return {
      ok: true,
      tableCode: table.code,
      tableDisplayName: table.displayName,
      previousSessionId: activeSession.id,
      previousCompetitionEntryId: compEntry ? compEntry.id : null,
      forced: force,
      message: `Mesa ${table.displayName} renovada y disponible con éxito.`,
    };
  });
}
