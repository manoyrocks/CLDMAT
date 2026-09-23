// Consent state. Implements REQ-PRV-01 and REQ-PRV-05. Every write in the app goes through canStore().
export const CONSENT_VERSION = '1.0';

export type ConsentStatus = 'none' | 'granted' | 'withdrawn';

export interface ConsentRecord {
  readonly status: ConsentStatus;
  readonly version: string | null;
  readonly grantedAt: number | null;
  readonly withdrawnAt: number | null;
  readonly adultGatePassed: boolean;
}

export const NO_CONSENT: ConsentRecord = Object.freeze({
  status: 'none', version: null, grantedAt: null, withdrawnAt: null, adultGatePassed: false,
});

export type GrantResult = { ok: true; record: ConsentRecord } | { ok: false; reason: 'adult-gate-required' | 'not-acknowledged' };

/** REQ-PRV-01 consent needs a passed adult gate and an explicit acknowledgement. */
export function grantConsent(opts: { adultGatePassed: boolean; acknowledged: boolean; now: number }): GrantResult {
  if (!opts.adultGatePassed) return { ok: false, reason: 'adult-gate-required' };
  if (!opts.acknowledged) return { ok: false, reason: 'not-acknowledged' };
  return {
    ok: true,
    record: { status: 'granted', version: CONSENT_VERSION, grantedAt: opts.now, withdrawnAt: null, adultGatePassed: true },
  };
}

/** REQ-PRV-05 withdrawal stops all collection immediately. */
export function withdrawConsent(record: ConsentRecord, now: number): ConsentRecord {
  return { ...record, status: 'withdrawn', withdrawnAt: now };
}

/** Consent from an older policy version must be renewed. */
export function needsReconsent(record: ConsentRecord): boolean {
  return record.status === 'granted' && record.version !== CONSENT_VERSION;
}

/** REQ-PRV-01 / REQ-PRV-05 the only gate for persisting child-related data. */
export function canStore(record: ConsentRecord | null | undefined): boolean {
  return !!record && record.status === 'granted' && record.adultGatePassed && !needsReconsent(record);
}
