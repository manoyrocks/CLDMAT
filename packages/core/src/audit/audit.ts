// Append-only, hash-chained audit log with no personal data. Implements REQ-PRV-07.
import { sha256Hex } from './sha256';

/** Allowed event types and the only data keys each may carry (no free text, no names). */
export const AUDIT_SCHEMA = Object.freeze({
  'consent.granted': ['version'],
  'consent.withdrawn': ['version'],
  'data.deleted': [],
  'data.exported': ['entities'],
  'data.purged': ['kind', 'count'],
  'childmode.entered': [],
  'childmode.exited': [],
  'gate.failed': ['attempt'],
  'gate.locked': [],
  'audio.stop': ['source', 'latencyMs'],
  'exposure.started': ['levelDb'],
  'exposure.stopped': ['reason', 'levelDb'],
  'exposure.stepup': ['levelDb'],
  'session.logged': ['minutes', 'activities'],
  'coach.escalated': ['category'],
  'coach.refused': ['category'],
} as const satisfies Record<string, readonly string[]>);

export type AuditType = keyof typeof AUDIT_SCHEMA;
export type AuditValue = string | number | boolean;

export interface AuditEvent {
  readonly seq: number;
  readonly at: number;
  readonly type: AuditType;
  readonly data: Readonly<Record<string, AuditValue>>;
  readonly prevHash: string;
  readonly hash: string;
}

export const GENESIS = '0'.repeat(64);

export class AuditSchemaError extends Error {}

function hashOf(e: Omit<AuditEvent, 'hash'>): string {
  const keys = Object.keys(e.data).sort();
  const data = keys.map((k) => `${k}=${JSON.stringify(e.data[k])}`).join('&');
  return sha256Hex(`${e.seq}|${e.at}|${e.type}|${data}|${e.prevHash}`);
}

function validate(type: string, data: Record<string, unknown>): void {
  const allowed = (AUDIT_SCHEMA as Record<string, readonly string[]>)[type];
  if (!allowed) throw new AuditSchemaError(`Unknown audit event type: ${type}`);
  for (const [k, v] of Object.entries(data)) {
    if (!allowed.includes(k)) throw new AuditSchemaError(`Key "${k}" not allowed for ${type}`);
    if (typeof v === 'string' && v.length > 32) throw new AuditSchemaError(`Value for "${k}" too long`);
    if (!['string', 'number', 'boolean'].includes(typeof v)) throw new AuditSchemaError(`Value for "${k}" must be scalar`);
  }
}

/** Returns a new log with the event appended; the input is not mutated. */
export function append(log: readonly AuditEvent[], type: AuditType, data: Record<string, AuditValue>, at: number): AuditEvent[] {
  validate(type, data);
  const prev = log[log.length - 1];
  const base = { seq: prev ? prev.seq + 1 : 0, at, type, data: { ...data }, prevHash: prev ? prev.hash : GENESIS };
  return [...log, { ...base, hash: hashOf(base) }];
}

/** Verifies the chain; returns the index of the first bad event, or -1 if intact. */
export function verifyChain(log: readonly AuditEvent[]): number {
  let prevHash = GENESIS;
  for (let i = 0; i < log.length; i++) {
    const e = log[i]!;
    const { hash, ...rest } = e;
    if (e.seq !== i || e.prevHash !== prevHash || hashOf(rest) !== hash) return i;
    prevHash = hash;
  }
  return -1;
}
