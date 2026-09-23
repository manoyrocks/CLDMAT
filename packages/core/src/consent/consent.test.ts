import { describe, expect, it } from 'vitest';
import { CONSENT_VERSION, NO_CONSENT, canStore, grantConsent, needsReconsent, withdrawConsent } from './consent';

describe('consent', () => {
  it('REQ-PRV-01 nothing can be stored before consent', () => {
    expect(canStore(NO_CONSENT)).toBe(false);
    expect(canStore(null)).toBe(false);
    expect(canStore(undefined)).toBe(false);
  });

  it('REQ-PRV-01 consent requires the adult gate and acknowledgement', () => {
    expect(grantConsent({ adultGatePassed: false, acknowledged: true, now: 1 })).toEqual({ ok: false, reason: 'adult-gate-required' });
    expect(grantConsent({ adultGatePassed: true, acknowledged: false, now: 1 })).toEqual({ ok: false, reason: 'not-acknowledged' });
    const r = grantConsent({ adultGatePassed: true, acknowledged: true, now: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.record).toMatchObject({ status: 'granted', version: CONSENT_VERSION, grantedAt: 5 });
      expect(canStore(r.record)).toBe(true);
    }
  });

  it('REQ-PRV-05 withdrawal stops storage', () => {
    const r = grantConsent({ adultGatePassed: true, acknowledged: true, now: 5 });
    if (!r.ok) throw new Error();
    const w = withdrawConsent(r.record, 9);
    expect(w.status).toBe('withdrawn');
    expect(w.withdrawnAt).toBe(9);
    expect(canStore(w)).toBe(false);
  });

  it('REQ-PRV-01 outdated consent versions need renewal', () => {
    const old = { status: 'granted' as const, version: '0.9', grantedAt: 1, withdrawnAt: null, adultGatePassed: true };
    expect(needsReconsent(old)).toBe(true);
    expect(canStore(old)).toBe(false);
    expect(needsReconsent(NO_CONSENT)).toBe(false);
    expect(canStore({ ...old, version: CONSENT_VERSION, adultGatePassed: false })).toBe(false);
  });
});
