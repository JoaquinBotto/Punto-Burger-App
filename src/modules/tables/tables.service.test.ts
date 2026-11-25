import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as tablesRepo from '../../db/repositories/tables.repository';
import * as venuesRepo from '../../db/repositories/venues.repository';
import * as sessionsRepo from '../../db/repositories/table-sessions.repository';
import * as auditRepo from '../../db/repositories/audit-events.repository';
import type { AuditEvent } from '../../db/schema/audit-events';
import { resolveTableState } from './tables.service';
import { TableNotFoundError } from './errors';
import type { Database } from '../../db/client';

describe('tables.service - resolveTableState', () => {
  const mockTable = {
    id: 'table-1',
    venueId: 'venue-1',
    code: 'mesa-01',
    displayName: 'Mesa 01',
    status: 'available' as const,
    qrToken: 'qr-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVenue = {
    id: 'venue-1',
    name: 'Punto Burger Esperanza',
    slug: 'esperanza-central',
    timezone: 'America/Argentina/Cordoba',
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const dummyDb = {} as Database;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resuelve una mesa disponible exitosamente', async () => {
    vi.spyOn(tablesRepo, 'getTableByCode').mockResolvedValue(mockTable);
    vi.spyOn(venuesRepo, 'getVenueById').mockResolvedValue(mockVenue);
    vi.spyOn(sessionsRepo, 'getActiveSessionByTableId').mockResolvedValue(null);

    const result = await resolveTableState(dummyDb, 'mesa-01');
    expect(result.table.code).toBe('mesa-01');
    expect(result.effectiveStatus).toBe('available');
    expect(result.activeSession).toBeNull();
  });

  it('lanza TableNotFoundError si la mesa no existe', async () => {
    vi.spyOn(tablesRepo, 'getTableByCode').mockResolvedValue(null);

    await expect(resolveTableState(dummyDb, 'mesa-inexistente')).rejects.toThrow(
      TableNotFoundError
    );
  });

  it('normaliza sesión expirada a cooldown y emite eventos de auditoría', async () => {
    const now = new Date('2026-11-25T12:00:00Z');
    const expiredTable = { ...mockTable, status: 'in_use' as const };
    const expiredSession = {
      id: 'session-1',
      venueId: 'venue-1',
      tableId: 'table-1',
      status: 'active' as const,
      startedAt: new Date('2026-11-25T10:00:00Z'),
      expiresAt: new Date('2026-11-25T11:30:00Z'), // Expiró hace 30 min
      closedAt: null,
      cooldownUntil: null,
      activeDeviceId: 'dev-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(tablesRepo, 'getTableByCode').mockResolvedValue(expiredTable);
    vi.spyOn(venuesRepo, 'getVenueById').mockResolvedValue(mockVenue);
    vi.spyOn(sessionsRepo, 'getActiveSessionByTableId').mockResolvedValue(expiredSession);

    const updateSessionSpy = vi.spyOn(sessionsRepo, 'updateSessionStatus').mockResolvedValue({
      ...expiredSession,
      status: 'expired',
    });
    const updateTableSpy = vi.spyOn(tablesRepo, 'updateTableStatus').mockResolvedValue({
      ...expiredTable,
      status: 'cooldown',
    });
    const auditSpy = vi
      .spyOn(auditRepo, 'createAuditEvent')
      .mockResolvedValue({} as unknown as AuditEvent);

    const result = await resolveTableState(dummyDb, 'mesa-01', now);

    expect(updateSessionSpy).toHaveBeenCalled();
    expect(updateTableSpy).toHaveBeenCalledWith(dummyDb, 'table-1', 'cooldown');
    expect(auditSpy).toHaveBeenCalledTimes(2); // session_expired + table_cooldown_started
    expect(result.effectiveStatus).toBe('cooldown');
    expect(result.activeSession).toBeNull();
    expect(result.cooldownRemainingSeconds).toBe(120); // 2 minutos
  });

  it('libera automáticamente una mesa en cooldown una vez transcurridos los 2 minutos', async () => {
    const now = new Date('2026-11-25T12:05:00Z');
    const cooldownTable = { ...mockTable, status: 'cooldown' as const };
    const endedCooldownSession = {
      id: 'session-1',
      venueId: 'venue-1',
      tableId: 'table-1',
      status: 'expired' as const,
      startedAt: new Date('2026-11-25T10:00:00Z'),
      expiresAt: new Date('2026-11-25T11:30:00Z'),
      closedAt: new Date('2026-11-25T11:30:00Z'),
      cooldownUntil: new Date('2026-11-25T11:32:00Z'), // Finalizó hace 33 min
      activeDeviceId: 'dev-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(tablesRepo, 'getTableByCode').mockResolvedValue(cooldownTable);
    vi.spyOn(venuesRepo, 'getVenueById').mockResolvedValue(mockVenue);
    vi.spyOn(sessionsRepo, 'getActiveSessionByTableId').mockResolvedValue(null);
    vi.spyOn(sessionsRepo, 'getLatestSessionByTableId').mockResolvedValue(endedCooldownSession);
    const updateTableSpy = vi.spyOn(tablesRepo, 'updateTableStatus').mockResolvedValue({
      ...cooldownTable,
      status: 'available',
    });

    const result = await resolveTableState(dummyDb, 'mesa-01', now);

    expect(updateTableSpy).toHaveBeenCalledWith(dummyDb, 'table-1', 'available');
    expect(result.effectiveStatus).toBe('available');
    expect(result.cooldownRemainingSeconds).toBe(0);
  });
});
