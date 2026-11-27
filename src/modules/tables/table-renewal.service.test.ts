import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renewTable } from './table-renewal.service';
import { TableNotFoundError } from './errors';
import * as tablesRepo from '@/db/repositories/tables.repository';
import * as sessionsRepo from '@/db/repositories/table-sessions.repository';
import * as auditRepo from '@/db/repositories/audit-events.repository';
import type { Database } from '@/db/client';

describe('TableRenewalService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lanza TableNotFoundError si el código de mesa no existe', async () => {
    const mockTx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            for: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };

    const mockDb = {
      transaction: vi.fn().mockImplementation(async (cb) => cb(mockTx)),
    } as unknown as Database;

    await expect(renewTable(mockDb, 'mesa-999')).rejects.toThrow(TableNotFoundError);
  });

  it('libera mesa sin sesión activa y emite table_renewed', async () => {
    const fakeTable = {
      id: 't-1',
      code: 'mesa-01',
      displayName: 'Mesa 01',
      venueId: 'v-1',
      status: 'cooldown',
    };

    const mockTx = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            // tables query
            return {
              for: vi.fn().mockResolvedValue([fakeTable]),
              limit: vi.fn().mockResolvedValue([]), // tableSessions query: no active session
            };
          }),
        })),
      })),
    };

    const mockDb = {
      transaction: vi.fn().mockImplementation(async (cb) => cb(mockTx)),
    } as unknown as Database;

    const updateTableSpy = vi.spyOn(tablesRepo, 'updateTableStatus').mockResolvedValue({} as never);
    const auditSpy = vi.spyOn(auditRepo, 'createAuditEvent').mockResolvedValue({} as never);

    const result = await renewTable(mockDb, 'mesa-01');

    expect(result.ok).toBe(true);
    expect(result.tableCode).toBe('mesa-01');
    expect(updateTableSpy).toHaveBeenCalledWith(mockTx, 't-1', 'available');
    expect(auditSpy).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({
        eventType: 'table_renewed',
        metadata: expect.objectContaining({
          tableCode: 'mesa-01',
          oldTableSessionId: null,
          forced: false,
        }),
      })
    );
  });

  it('aborta si hay una partida activa y no se usa --force', async () => {
    const fakeTable = {
      id: 't-1',
      code: 'mesa-01',
      displayName: 'Mesa 01',
      venueId: 'v-1',
      status: 'in_use',
    };

    const fakeSession = {
      id: 'ts-1',
      tableId: 't-1',
      status: 'active',
      activeDeviceId: 'd-1',
    };

    const fakeActiveGame = {
      id: 'gs-1',
      status: 'active',
      tableSessionId: 'ts-1',
    };

    let queryCount = 0;
    const mockTx = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            queryCount++;
            if (queryCount === 1) {
              // tables
              return { for: vi.fn().mockResolvedValue([fakeTable]) };
            }
            if (queryCount === 2) {
              // tableSessions
              return { limit: vi.fn().mockResolvedValue([fakeSession]) };
            }
            // gameSessions
            return Promise.resolve([fakeActiveGame]);
          }),
        })),
      })),
    };

    const mockDb = {
      transaction: vi.fn().mockImplementation(async (cb) => cb(mockTx)),
    } as unknown as Database;

    await expect(renewTable(mockDb, 'mesa-01')).rejects.toThrow(
      'Hay una partida activa en Mesa 01.'
    );
  });

  it('con --force abandona partida activa y entry de competencia, cierra sesión y libera mesa', async () => {
    const fakeTable = {
      id: 't-1',
      code: 'mesa-01',
      displayName: 'Mesa 01',
      venueId: 'v-1',
      status: 'in_use',
    };

    const fakeSession = {
      id: 'ts-1',
      tableId: 't-1',
      status: 'active',
      activeDeviceId: 'd-1',
    };

    const fakeActiveGame = {
      id: 'gs-1',
      status: 'active',
      tableSessionId: 'ts-1',
    };

    const fakeCompEntry = {
      id: 'ce-1',
      status: 'active',
      tableSessionId: 'ts-1',
    };

    let queryCount = 0;
    const updateSpy = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const mockTx = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            queryCount++;
            if (queryCount === 1) {
              return { for: vi.fn().mockResolvedValue([fakeTable]) };
            }
            if (queryCount === 2) {
              return { limit: vi.fn().mockResolvedValue([fakeSession]) };
            }
            if (queryCount === 3) {
              return Promise.resolve([fakeActiveGame]);
            }
            // compEntry
            return { limit: vi.fn().mockResolvedValue([fakeCompEntry]) };
          }),
        })),
      })),
      update: updateSpy,
    };

    const mockDb = {
      transaction: vi.fn().mockImplementation(async (cb) => cb(mockTx)),
    } as unknown as Database;

    const updateSessionSpy = vi
      .spyOn(sessionsRepo, 'updateSessionStatus')
      .mockResolvedValue({} as never);
    const revokeDeviceSpy = vi.spyOn(sessionsRepo, 'revokeDevice').mockResolvedValue({} as never);
    const updateTableSpy = vi.spyOn(tablesRepo, 'updateTableStatus').mockResolvedValue({} as never);
    const auditSpy = vi.spyOn(auditRepo, 'createAuditEvent').mockResolvedValue({} as never);

    const result = await renewTable(mockDb, 'mesa-01', { force: true });

    expect(result.ok).toBe(true);
    expect(result.forced).toBe(true);
    expect(result.previousSessionId).toBe('ts-1');
    expect(result.previousCompetitionEntryId).toBe('ce-1');

    // Comprobar cierres
    expect(updateSessionSpy).toHaveBeenCalledWith(mockTx, 'ts-1', 'closed', expect.any(Date), null);
    expect(revokeDeviceSpy).toHaveBeenCalledWith(mockTx, 'd-1', expect.any(Date));
    expect(updateTableSpy).toHaveBeenCalledWith(mockTx, 't-1', 'available');

    // Comprobar eventos de auditoría emitidos
    expect(auditSpy).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({
        eventType: 'competition_entry_abandoned_by_operator',
        metadata: expect.objectContaining({
          tableCode: 'mesa-01',
          oldTableSessionId: 'ts-1',
          oldCompetitionEntryId: 'ce-1',
          forced: true,
        }),
      })
    );

    expect(auditSpy).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({
        eventType: 'table_session_closed_by_operator',
        metadata: expect.objectContaining({
          tableCode: 'mesa-01',
          oldTableSessionId: 'ts-1',
          forced: true,
        }),
      })
    );

    expect(auditSpy).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({
        eventType: 'table_renewed',
        metadata: expect.objectContaining({
          tableCode: 'mesa-01',
          oldTableSessionId: 'ts-1',
          forced: true,
        }),
      })
    );
  });

  it('sin --force abandona competition_entry activa/registrada cuando el juego solo está created', async () => {
    const fakeTable = {
      id: 't-1',
      code: 'mesa-01',
      displayName: 'Mesa 01',
      venueId: 'v-1',
      status: 'in_use',
    };

    const fakeSession = {
      id: 'ts-1',
      tableId: 't-1',
      status: 'active',
      activeDeviceId: 'd-1',
    };

    const fakeCreatedGame = {
      id: 'gs-1',
      status: 'created',
      tableSessionId: 'ts-1',
    };

    const fakeCompEntry = {
      id: 'ce-1',
      status: 'registered',
      tableSessionId: 'ts-1',
    };

    let queryCount = 0;
    const updateSpy = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const mockTx = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            queryCount++;
            if (queryCount === 1) return { for: vi.fn().mockResolvedValue([fakeTable]) };
            if (queryCount === 2) return { limit: vi.fn().mockResolvedValue([fakeSession]) };
            if (queryCount === 3) return Promise.resolve([fakeCreatedGame]);
            return { limit: vi.fn().mockResolvedValue([fakeCompEntry]) };
          }),
        })),
      })),
      update: updateSpy,
    };

    const mockDb = {
      transaction: vi.fn().mockImplementation(async (cb) => cb(mockTx)),
    } as unknown as Database;

    vi.spyOn(sessionsRepo, 'updateSessionStatus').mockResolvedValue({} as never);
    vi.spyOn(sessionsRepo, 'revokeDevice').mockResolvedValue({} as never);
    vi.spyOn(tablesRepo, 'updateTableStatus').mockResolvedValue({} as never);
    const auditSpy = vi.spyOn(auditRepo, 'createAuditEvent').mockResolvedValue({} as never);

    const result = await renewTable(mockDb, 'mesa-01', { force: false });

    expect(result.ok).toBe(true);
    expect(result.forced).toBe(false);

    expect(auditSpy).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({
        eventType: 'competition_entry_abandoned_by_operator',
        metadata: expect.objectContaining({
          tableCode: 'mesa-01',
          oldTableSessionId: 'ts-1',
          oldCompetitionEntryId: 'ce-1',
          forced: false,
        }),
      })
    );
  });
});
