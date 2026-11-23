import { describe, it, expect, vi } from 'vitest';
import { getVenueBySlug, getVenueById } from './venues.repository';
import { getTableByVenueAndCode, getTableByQrToken } from './tables.repository';
import { getActiveCategories, getCategoryBySlug } from './categories.repository';
import { getApprovedQuestions } from './questions.repository';
import type { Database } from '../client';

describe('Domain Repositories', () => {
  it('calls getVenueBySlug with expected conditions', async () => {
    const mockLimit = vi.fn().mockResolvedValue([{ id: 'v1', slug: 'esperanza-central' }]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    const mockDb = {
      select: mockSelect,
    } as unknown as Database;

    const result = await getVenueBySlug(mockDb, 'esperanza-central');
    expect(result).toEqual({ id: 'v1', slug: 'esperanza-central' });
    expect(mockSelect).toHaveBeenCalled();
    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  it('calls getVenueById returning null if not found', async () => {
    const mockLimit = vi.fn().mockResolvedValue([]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    const mockDb = {
      select: mockSelect,
    } as unknown as Database;

    const result = await getVenueById(mockDb, 'non-existent-id');
    expect(result).toBeNull();
  });

  it('calls getTableByVenueAndCode', async () => {
    const mockLimit = vi.fn().mockResolvedValue([{ id: 't1', code: 'mesa-01' }]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    const mockDb = {
      select: mockSelect,
    } as unknown as Database;

    const result = await getTableByVenueAndCode(mockDb, 'v1', 'mesa-01');
    expect(result).toEqual({ id: 't1', code: 'mesa-01' });
  });

  it('calls getTableByQrToken', async () => {
    const mockLimit = vi.fn().mockResolvedValue([{ id: 't1', qrToken: 'token123' }]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    const mockDb = {
      select: mockSelect,
    } as unknown as Database;

    const result = await getTableByQrToken(mockDb, 'token123');
    expect(result).toEqual({ id: 't1', qrToken: 'token123' });
  });

  it('calls getActiveCategories with ordering', async () => {
    const mockOrderBy = vi.fn().mockResolvedValue([{ id: 'c1', status: 'active' }]);
    const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    const mockDb = {
      select: mockSelect,
    } as unknown as Database;

    const result = await getActiveCategories(mockDb);
    expect(result).toHaveLength(1);
  });

  it('calls getCategoryBySlug', async () => {
    const mockLimit = vi.fn().mockResolvedValue([{ id: 'c1', slug: 'deportes' }]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    const mockDb = {
      select: mockSelect,
    } as unknown as Database;

    const result = await getCategoryBySlug(mockDb, 'deportes');
    expect(result).toEqual({ id: 'c1', slug: 'deportes' });
  });

  it('calls getApprovedQuestions with filters', async () => {
    const mockWhere = vi.fn().mockResolvedValue([{ id: 'q1', status: 'approved' }]);
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    const mockDb = {
      select: mockSelect,
    } as unknown as Database;

    const result = await getApprovedQuestions(mockDb, { difficulty: 'initial' });
    expect(result).toHaveLength(1);
  });
});
