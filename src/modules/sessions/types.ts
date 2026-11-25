import type { TableSession } from '../../db/schema/table-sessions';
import type { Device } from '../../db/schema/devices';
import type { Table } from '../../db/schema/tables';
import type { Venue } from '../../db/schema/venues';

export interface ClaimTableInput {
  tableCode: string;
  accessCode: string;
}

export interface ClaimTableQrInput {
  qrToken: string;
}

export interface ClaimTableResult {
  ok: true;
  session: {
    table: string;
    status: 'active';
    expiresAt: string;
  };
  next: string;
  rawDeviceToken: string;
}

export interface ResolvedSession {
  device: Device;
  session: TableSession;
  table: Table;
  venue: Venue;
}
