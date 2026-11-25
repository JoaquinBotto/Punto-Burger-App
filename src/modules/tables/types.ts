import type { Table } from '../../db/schema/tables';
import type { Venue } from '../../db/schema/venues';
import type { TableSession } from '../../db/schema/table-sessions';

export type TableStatus = Table['status'];

export interface ResolvedTableState {
  table: Table;
  venue: Venue;
  activeSession: TableSession | null;
  effectiveStatus: TableStatus;
  cooldownRemainingSeconds?: number;
}
