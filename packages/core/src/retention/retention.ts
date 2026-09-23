// Retention and purge rules. Implements REQ-PRV-04. Pure; the clock is injected.
export type RecordKind = 'sessionLog' | 'goalLog' | 'soundDiary' | 'exposureSession' | 'audit' | 'archivedGoal';

export const RETENTION_DAYS: Readonly<Record<RecordKind, number>> = Object.freeze({
  sessionLog: 365,
  goalLog: 365,
  soundDiary: 90,
  exposureSession: 365,
  audit: 730,
  archivedGoal: 365,
});

const DAY = 86_400_000;

export function isExpired(kind: RecordKind, timestamp: number, now: number): boolean {
  if (!Number.isFinite(timestamp)) return true; // unknown age: fail towards deletion
  return now - timestamp > RETENTION_DAYS[kind] * DAY;
}

/** Returns the records to keep and the number purged. */
export function purge<T>(kind: RecordKind, records: readonly T[], timestampOf: (r: T) => number, now: number) {
  const kept = records.filter((r) => !isExpired(kind, timestampOf(r), now));
  return { kept, purged: records.length - kept.length };
}
