import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import en from '../i18n/en.json';
import { findBannedTerms } from '@harmony/ai';
import { setLocale, t } from './i18n';

const src = join(__dirname, '..');
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(p) && !p.endsWith('.test.ts') ? [p] : []; });
}
function flat(o: object, prefix = ''): string[] {
  return Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

describe('i18n', () => {
  it('REQ-NFR-04 every static string key used in the UI exists in en.json', () => {
    const keys = new Set(flat(en));
    const used = new Set<string>();
    for (const f of files(src)) for (const m of readFileSync(f, 'utf8').matchAll(/\bt\('([a-zA-Z0-9_.-]+)'/g)) used.add(m[1]!);
    expect([...used].filter((k) => !keys.has(k))).toEqual([]);
  });

  it('REQ-NFR-04 dynamic key families are complete', () => {
    const dynamic = [
      ...['Verified', 'Emerging', 'Unverified'].map((x) => `tier.${x}`), ...['2-4', '5-7', '8-12'].map((x) => `age.${x}`),
      ...['speaking', 'some-words', 'minimally-verbal'].map((x) => `comm.${x}`), ...['yes', 'no', 'unsure'].map((x) => `common.${x}`),
      ...['home', 'school', 'shop', 'outside', 'car', 'other'].map((x) => `place.${x}`), ...[1, 2, 3].map((x) => `diary.loud${x}`),
      ...[0, 1, 2, 3].map((x) => `session.eng${x}`), ...['caregiver-not-present', 'locked', 'no-consent'].map((x) => `exposure.refused.${x}`),
      ...['needs-checkin', 'distress', 'already-stepped', 'too-soon', 'at-ceiling', 'ended'].map((x) => `exposure.why.${x}`),
      ...['none', 'caution', 'unverified'].map((x) => `redflags.level.${x}`), ...['none', 'granted', 'withdrawn'].map((x) => `settings.consent.${x}`),
      ...['drum', 'shaker', 'bells'].map((x) => `child.${x}`),
    ];
    const keys = new Set(flat(en));
    expect(dynamic.filter((k) => !keys.has(k))).toEqual([]);
  });

  it('REQ-AI-07 UI strings contain no banned claim terms', () => {
    const all = flat(en).map((k) => t(k)).join('\n');
    expect(findBannedTerms(all)).toEqual([]);
  });

  it('interpolates and falls back to the key', () => {
    expect(t('common.minutes', { n: 4 })).toBe('4 min');
    expect(t('common.minutes')).toBe('{n} min');
    expect(t('nope.missing')).toBe('nope.missing');
    expect(t('common')).toBe('common');
    setLocale('xx');
    expect(t('common.save')).toBe('Save');
  });
});
