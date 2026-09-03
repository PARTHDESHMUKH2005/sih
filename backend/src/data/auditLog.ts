export interface AuditLogEntry {
  id: string;
  actorEmail: string;
  action: string;
  habitationId: string;
  previousTier: string;
  newTier?: string;
  justification: string;
  timestamp: string;
}

const entries: AuditLogEntry[] = [];
let nextId = 1;

export function recordAuditEntry(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
  const full: AuditLogEntry = { ...entry, id: `audit-${nextId++}`, timestamp: new Date().toISOString() };
  entries.push(full);
  return full;
}

export function listAuditEntries(): AuditLogEntry[] {
  return entries;
}
