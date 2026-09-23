import { describe, expect, it } from 'vitest';
import { RETENTION_DAYS, isExpired, purge } from './retention';

const DAY = 86_400_000;
const NOW = 1_800_000_000_000;

describe('retention', () => {
  it('REQ-PRV-04 sound diary is kept for 90 days and logs for 365', () => {
    expect(RETENTION_DAYS.soundDiary).toBe(90);
    expect(RETENTION_DAYS.sessionLog).toBe(365);
    expect(isExpired('soundDiary', NOW - 89 * DAY, NOW)).toBe(false);
    expect(isExpired('soundDiary', NOW - 91 * DAY, NOW)).toBe(true);
    expect(isExpired('sessionLog', NOW - 300 * DAY, NOW)).toBe(false);
  });

  it('REQ-PRV-04 records with an unknown date are purged', () => {
    expect(isExpired('goalLog', NaN, NOW)).toBe(true);
  });

  it('REQ-PRV-04 purge keeps fresh records and counts removed ones', () => {
    const recs = [{ at: NOW }, { at: NOW - 100 * DAY }, { at: NOW - 400 * DAY }];
    expect(purge('soundDiary', recs, (r) => r.at, NOW)).toEqual({ kept: [{ at: NOW }], purged: 2 });
    expect(purge('sessionLog', recs, (r) => r.at, NOW).purged).toBe(1);
  });
});
