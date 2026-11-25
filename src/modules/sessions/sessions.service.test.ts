import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as tablesService from '../tables/tables.service';
import * as sessionsRepo from '../../db/repositories/table-sessions.repository';
import * as auditRepo from '../../db/repositories/audit-events.repository';
import {
  claimTableSession,
  claimTableSessionByQr,
  resolveSessionFromCookie,
} from './sessions.service';
import { resetRateLimiter } from './rate-limiter';
import {
  TableAlreadyInUseError,
  TableCooldownError,
  TableDisabledError,
  InvalidAccessCodeError,
} from '../tables/errors';
import { DeviceHasActiveSessionError, TooManyAttemptsError } from './errors';
import { getCurrentVenueAccessCode } from '../../lib/security/access-codes';
import { hashToken } from '../../lib/security/tokens';
import type { Database } from '../../db/client';
import type { TableSession } from '../../db/schema/table-sessions';
import type { Device } from '../../db/schema/devices';
import type { AuditEvent } from '../../db/schema/audit-events';

describe('sessions.service - claimTableSession y resolveSessionFromCookie', () => {
  const secret = 'super-secret-key-of-at-least-32-chars-long';
  const origSecret = process.env.ACCESS_CODE_SECRET;

  const mockVenue = {
    id: 'venue-1',
    name: 'Punto Burger Esperanza',
    slug: 'esperanza-central',
    timezone: 'America/Argentina/Cordoba',
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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

  beforeEach(() => {
    process.env.ACCESS_CODE_SECRET = secret;
    resetRateLimiter();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.ACCESS_CODE_SECRET = origSecret;
  });

  it('reclama una mesa disponible exitosamente con código válido', async () => {
    const now = new Date('2026-11-25T12:00:00Z');
    const validCode = getCurrentVenueAccessCode(mockVenue.id, secret, now.getTime()).code;

    vi.spyOn(tablesService, 'resolveTableState').mockResolvedValue({
      table: mockTable,
      venue: mockVenue,
      activeSession: null,
      effectiveStatus: 'available',
    });

    let insertedSession: TableSession | null = null;
    let insertedDevice: Device | null = null;
    let tableStatusSet = '';

    const mockTx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockTable]),
          }),
        }),
      }),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((val) => {
          if (val.tableId) {
            insertedSession = { id: 'sess-123', ...val };
            return { returning: vi.fn().mockResolvedValue([insertedSession]) };
          }
          if (val.tableSessionId) {
            insertedDevice = { id: 'dev-456', ...val };
            return { returning: vi.fn().mockResolvedValue([insertedDevice]) };
          }
          return { returning: vi.fn().mockResolvedValue([val]) };
        }),
      })),
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation((data) => ({
          where: vi.fn().mockImplementation(() => {
            if (data.status === 'in_use') {
              tableStatusSet = 'in_use';
            }
            return { returning: vi.fn().mockResolvedValue([data]) };
          }),
        })),
      })),
    };

    const mockDb = {
      transaction: vi.fn().mockImplementation(async (callback) => callback(mockTx)),
    } as unknown as Database;

    const result = await claimTableSession(
      mockDb,
      { tableCode: 'mesa-01', accessCode: validCode },
      undefined,
      '127.0.0.1',
      now
    );

    expect(result.ok).toBe(true);
    expect(result.session.table).toBe('Mesa 01');
    expect(result.session.status).toBe('active');
    expect(result.next).toBe('/play/setup');
    expect(typeof result.rawDeviceToken).toBe('string');
    expect(result.rawDeviceToken.length).toBe(64);

    // Token se persiste únicamente como hash
    expect((insertedDevice as Device | null)?.tokenHash).toBe(hashToken(result.rawDeviceToken));
    expect((insertedSession as TableSession | null)?.tableId).toBe(mockTable.id);
    expect(tableStatusSet).toBe('in_use');
  });

  it('rechaza código temporal incorrecto y registra intento fallido', async () => {
    const now = new Date('2026-11-25T12:00:00Z');

    vi.spyOn(tablesService, 'resolveTableState').mockResolvedValue({
      table: mockTable,
      venue: mockVenue,
      activeSession: null,
      effectiveStatus: 'available',
    });

    const auditSpy = vi
      .spyOn(auditRepo, 'createAuditEvent')
      .mockResolvedValue({} as unknown as AuditEvent);

    const mockDb = {} as Database;

    await expect(
      claimTableSession(
        mockDb,
        { tableCode: 'mesa-01', accessCode: 'XXXXX' },
        undefined,
        '127.0.0.1',
        now
      )
    ).rejects.toThrow(InvalidAccessCodeError);

    expect(auditSpy).toHaveBeenCalled();
  });

  it('acepta código anterior dentro de los 45 segundos de gracia', async () => {
    const prevTime = 290_000;
    const nowTime = 320_000; // a 20s de la rotación
    const prevCode = getCurrentVenueAccessCode(mockVenue.id, secret, prevTime).code;

    vi.spyOn(tablesService, 'resolveTableState').mockResolvedValue({
      table: mockTable,
      venue: mockVenue,
      activeSession: null,
      effectiveStatus: 'available',
    });

    const mockTx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockTable]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: '1', expiresAt: new Date() }]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    };

    const mockDb = {
      transaction: vi.fn().mockImplementation(async (cb) => cb(mockTx)),
    } as unknown as Database;

    const result = await claimTableSession(
      mockDb,
      { tableCode: 'mesa-01', accessCode: prevCode },
      undefined,
      '127.0.0.1',
      new Date(nowTime)
    );

    expect(result.ok).toBe(true);
  });

  it('rechaza código anterior una vez transcurridos los 45 segundos de gracia', async () => {
    const prevTime = 290_000;
    const expiredGraceTime = 350_000; // a 50s de la rotación
    const prevCode = getCurrentVenueAccessCode(mockVenue.id, secret, prevTime).code;

    vi.spyOn(tablesService, 'resolveTableState').mockResolvedValue({
      table: mockTable,
      venue: mockVenue,
      activeSession: null,
      effectiveStatus: 'available',
    });
    vi.spyOn(auditRepo, 'createAuditEvent').mockResolvedValue({} as unknown as AuditEvent);

    const mockDb = {} as Database;

    await expect(
      claimTableSession(
        mockDb,
        { tableCode: 'mesa-01', accessCode: prevCode },
        undefined,
        '127.0.0.1',
        new Date(expiredGraceTime)
      )
    ).rejects.toThrow(InvalidAccessCodeError);
  });

  it('es idempotente si el mismo navegador con cookie válida vuelve a reclamar la misma mesa', async () => {
    const rawToken = 'existing-token-abc-123';
    const tokenHash = hashToken(rawToken);

    const activeSession = {
      id: 'sess-active',
      venueId: 'venue-1',
      tableId: 'table-1',
      status: 'active' as const,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
      closedAt: null,
      cooldownUntil: null,
      activeDeviceId: 'dev-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const activeDevice = {
      id: 'dev-1',
      tableSessionId: 'sess-active',
      tokenHash,
      status: 'active' as const,
      claimedAt: new Date(),
      revokedAt: null,
      lastSeenAt: new Date(),
      createdAt: new Date(),
    };

    vi.spyOn(sessionsRepo, 'getSessionWithDetailsByTokenHash').mockResolvedValue({
      device: activeDevice,
      session: activeSession,
      table: mockTable,
      venue: mockVenue,
    });

    const mockDb = {} as Database;

    const result = await claimTableSession(
      mockDb,
      { tableCode: 'mesa-01', accessCode: 'IGNOR' },
      rawToken,
      '127.0.0.1'
    );

    expect(result.ok).toBe(true);
    expect(result.session.table).toBe('Mesa 01');
    expect(result.rawDeviceToken).toBe(rawToken);
  });

  it('rechaza con DeviceHasActiveSessionError si el dispositivo tiene sesión activa en otra mesa', async () => {
    const rawToken = 'existing-token-other-table';
    const otherTable = { ...mockTable, id: 'table-2', code: 'mesa-02', displayName: 'Mesa 02' };

    vi.spyOn(sessionsRepo, 'getSessionWithDetailsByTokenHash').mockResolvedValue({
      device: {
        id: 'dev-2',
        tableSessionId: 'sess-2',
        tokenHash: 'h',
        status: 'active',
        claimedAt: new Date(),
        revokedAt: null,
        lastSeenAt: new Date(),
        createdAt: new Date(),
      },
      session: {
        id: 'sess-2',
        venueId: 'venue-1',
        tableId: 'table-2',
        status: 'active',
        activeDeviceId: 'dev-2',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        closedAt: null,
        cooldownUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      table: otherTable,
      venue: mockVenue,
    });

    const mockDb = {} as Database;

    await expect(
      claimTableSession(
        mockDb,
        { tableCode: 'mesa-01', accessCode: 'ABCDE' },
        rawToken,
        '127.0.0.1'
      )
    ).rejects.toThrow(DeviceHasActiveSessionError);
  });

  it('rechaza con TableAlreadyInUseError si otro dispositivo ya ocupa la mesa', async () => {
    vi.spyOn(tablesService, 'resolveTableState').mockResolvedValue({
      table: { ...mockTable, status: 'in_use' },
      venue: mockVenue,
      activeSession: null,
      effectiveStatus: 'in_use',
    });

    const mockDb = {} as Database;

    await expect(
      claimTableSession(
        mockDb,
        { tableCode: 'mesa-01', accessCode: 'ABCDE' },
        undefined,
        '127.0.0.1'
      )
    ).rejects.toThrow(TableAlreadyInUseError);
  });

  it('rechaza con TableCooldownError si la mesa está en período de preparación', async () => {
    vi.spyOn(tablesService, 'resolveTableState').mockResolvedValue({
      table: { ...mockTable, status: 'cooldown' },
      venue: mockVenue,
      activeSession: null,
      effectiveStatus: 'cooldown',
    });

    const mockDb = {} as Database;

    await expect(
      claimTableSession(
        mockDb,
        { tableCode: 'mesa-01', accessCode: 'ABCDE' },
        undefined,
        '127.0.0.1'
      )
    ).rejects.toThrow(TableCooldownError);
  });

  it('rechaza con TableDisabledError si la mesa está deshabilitada', async () => {
    vi.spyOn(tablesService, 'resolveTableState').mockResolvedValue({
      table: { ...mockTable, status: 'disabled' },
      venue: mockVenue,
      activeSession: null,
      effectiveStatus: 'disabled',
    });

    const mockDb = {} as Database;

    await expect(
      claimTableSession(
        mockDb,
        { tableCode: 'mesa-01', accessCode: 'ABCDE' },
        undefined,
        '127.0.0.1'
      )
    ).rejects.toThrow(TableDisabledError);
  });

  it('bloquea intentos con TooManyAttemptsError al alcanzar 5 intentos fallidos consecutivos', async () => {
    vi.spyOn(tablesService, 'resolveTableState').mockResolvedValue({
      table: mockTable,
      venue: mockVenue,
      activeSession: null,
      effectiveStatus: 'available',
    });
    vi.spyOn(auditRepo, 'createAuditEvent').mockResolvedValue({} as unknown as AuditEvent);

    const mockDb = {} as Database;

    for (let i = 0; i < 5; i++) {
      await expect(
        claimTableSession(
          mockDb,
          { tableCode: 'mesa-01', accessCode: 'WRONG' },
          undefined,
          '10.0.0.1'
        )
      ).rejects.toThrow(InvalidAccessCodeError);
    }

    // 6to intento queda bloqueado por rate limit antes de validar código
    await expect(
      claimTableSession(
        mockDb,
        { tableCode: 'mesa-01', accessCode: 'WRONG' },
        undefined,
        '10.0.0.1'
      )
    ).rejects.toThrow(TooManyAttemptsError);
  });

  it('soporta concurrencia: si dos transacciones compiten, la segunda recibe TableAlreadyInUseError por índice único', async () => {
    const now = new Date('2026-11-25T12:00:00Z');
    const validCode = getCurrentVenueAccessCode(mockVenue.id, secret, now.getTime()).code;

    vi.spyOn(tablesService, 'resolveTableState').mockResolvedValue({
      table: mockTable,
      venue: mockVenue,
      activeSession: null,
      effectiveStatus: 'available',
    });

    const mockTx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockTable]),
          }),
        }),
      }),
      insert: vi.fn().mockImplementation(() => {
        const error = new Error(
          'duplicate key value violates unique constraint "table_sessions_active_table_idx"'
        ) as Error & { code?: string };
        error.code = '23505';
        throw error;
      }),
    };

    const mockDb = {
      transaction: vi.fn().mockImplementation(async (cb) => cb(mockTx)),
    } as unknown as Database;

    await expect(
      claimTableSession(
        mockDb,
        { tableCode: 'mesa-01', accessCode: validCode },
        undefined,
        '127.0.0.1',
        now
      )
    ).rejects.toThrow(TableAlreadyInUseError);
  });

  it('resolveSessionFromCookie retorna null si no se proporciona cookie', async () => {
    const mockDb = {} as Database;
    const result = await resolveSessionFromCookie(mockDb, undefined);
    expect(result).toBeNull();
  });

  it('resolveSessionFromCookie recupera la sesión activa asociada al token', async () => {
    const rawToken = 'my-valid-cookie-token';
    const mockDb = {} as Database;

    vi.spyOn(sessionsRepo, 'getSessionWithDetailsByTokenHash').mockResolvedValue({
      device: {
        id: 'dev-1',
        tableSessionId: 'sess-1',
        tokenHash: 'h',
        status: 'active',
        claimedAt: new Date(),
        revokedAt: null,
        lastSeenAt: new Date(),
        createdAt: new Date(),
      },
      session: {
        id: 'sess-1',
        venueId: 'venue-1',
        tableId: 'table-1',
        status: 'active',
        activeDeviceId: 'dev-1',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        closedAt: null,
        cooldownUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      table: mockTable,
      venue: mockVenue,
    });

    const result = await resolveSessionFromCookie(mockDb, rawToken);
    expect(result).not.toBeNull();
    expect(result?.table.code).toBe('mesa-01');
    expect(result?.device.id).toBe('dev-1');
  });

  describe('claimTableSessionByQr', () => {
    it('reclama una mesa disponible exitosamente usando qrToken sin requerir accessCode', async () => {
      const now = new Date('2026-11-25T12:00:00Z');

      vi.spyOn(tablesService, 'resolveTableStateByQrToken').mockResolvedValue({
        table: mockTable,
        venue: mockVenue,
        activeSession: null,
        effectiveStatus: 'available',
      });

      let insertedSession: TableSession | null = null;
      let insertedDevice: Device | null = null;
      let tableStatusSet = '';
      let auditMetadata: Record<string, unknown> = {};

      const mockTx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockTable]),
            }),
          }),
        }),
        insert: vi.fn().mockImplementation(() => ({
          values: vi.fn().mockImplementation((val) => {
            if (val.tableId) {
              insertedSession = { id: 'sess-qr-1', ...val };
              return { returning: vi.fn().mockResolvedValue([insertedSession]) };
            }
            if (val.tableSessionId) {
              insertedDevice = { id: 'dev-qr-1', ...val };
              return { returning: vi.fn().mockResolvedValue([insertedDevice]) };
            }
            if (val.eventType === 'session_created') {
              auditMetadata = val.metadata;
            }
            return { returning: vi.fn().mockResolvedValue([val]) };
          }),
        })),
        update: vi.fn().mockImplementation(() => ({
          set: vi.fn().mockImplementation((data) => ({
            where: vi.fn().mockImplementation(() => {
              if (data.status === 'in_use') {
                tableStatusSet = 'in_use';
              }
              return { returning: vi.fn().mockResolvedValue([data]) };
            }),
          })),
        })),
      };

      const mockDb = {
        transaction: vi.fn().mockImplementation(async (cb) => cb(mockTx)),
      } as unknown as Database;

      const result = await claimTableSessionByQr(
        mockDb,
        { qrToken: 'qr-123' },
        undefined,
        '192.168.1.50',
        now
      );

      expect(result.ok).toBe(true);
      expect(result.session.table).toBe('Mesa 01');
      expect(result.session.status).toBe('active');
      expect(result.next).toBe('/play/setup');
      expect(result.rawDeviceToken).toBeDefined();
      expect(tableStatusSet).toBe('in_use');
      expect(auditMetadata.claimMethod).toBe('qr');
      // Asegurar que el qrToken NUNCA se guarde en los metadatos de auditoría
      expect(auditMetadata.qrToken).toBeUndefined();
    });

    it('rechaza el reclamo por QR si la mesa está en cooldown', async () => {
      vi.spyOn(tablesService, 'resolveTableStateByQrToken').mockResolvedValue({
        table: { ...mockTable, status: 'cooldown' },
        venue: mockVenue,
        activeSession: null,
        effectiveStatus: 'cooldown',
        cooldownRemainingSeconds: 90,
      });

      const mockDb = {} as Database;

      await expect(
        claimTableSessionByQr(mockDb, { qrToken: 'qr-123' }, undefined, '127.0.0.1')
      ).rejects.toThrow(TableCooldownError);
    });

    it('retorna la sesión existente si el mismo dispositivo re-escanea el QR (idempotencia)', async () => {
      const existingCookieToken = 'existing-cookie-123';
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      } as unknown as Database;

      vi.spyOn(tablesService, 'resolveTableStateByQrToken').mockResolvedValue({
        table: mockTable,
        venue: mockVenue,
        activeSession: null,
        effectiveStatus: 'in_use',
      });

      vi.spyOn(sessionsRepo, 'getSessionWithDetailsByTokenHash').mockResolvedValue({
        device: {
          id: 'dev-1',
          tableSessionId: 'sess-1',
          tokenHash: 'h',
          status: 'active',
          claimedAt: new Date(),
          revokedAt: null,
          lastSeenAt: new Date(),
          createdAt: new Date(),
        },
        session: {
          id: 'sess-1',
          venueId: 'venue-1',
          tableId: 'table-1',
          status: 'active',
          activeDeviceId: 'dev-1',
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 60000),
          closedAt: null,
          cooldownUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        table: mockTable,
        venue: mockVenue,
      });

      const result = await claimTableSessionByQr(
        mockDb,
        { qrToken: 'qr-123' },
        existingCookieToken
      );

      expect(result.ok).toBe(true);
      expect(result.session.table).toBe('Mesa 01');
      expect(result.next).toBe('/play/setup');
      expect(result.rawDeviceToken).toBe(existingCookieToken);
    });
  });
});
