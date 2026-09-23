// Structural validation of governed content (REQ-NFR-05). Evidence-level checks such as banned
// claims live in the Content Compliance Checker (packages/ai/src/compliance.ts).
import { claimById } from './claims';
import type { AudioExample, EvidenceMeta } from './types';

/** Fields that would enable an excluded therapy (ADR-0002). Rejected anywhere in content. */
export const FORBIDDEN_AUDIO_FIELDS = ['tuningHz', 'binaural', 'filter', 'modulation', 'carrierHz', 'beatHz'] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SEMVER = /^\d+\.\d+\.\d+$/;

export function metaErrors(item: EvidenceMeta & { id?: string }): string[] {
  const errs: string[] = [];
  if (!SEMVER.test(item.version ?? '')) errs.push('version missing or not semver');
  if (!item.sections?.length) errs.push('source section missing');
  if (!item.claimIds?.length) errs.push('no claim IDs');
  for (const c of item.claimIds ?? []) if (!claimById(c)) errs.push(`unknown claim ${c}`);
  if (!['Verified', 'Emerging', 'Unverified'].includes(item.tier)) errs.push('tier missing');
  if (!item.reviewer) errs.push('reviewer missing');
  if (!ISO_DATE.test(item.reviewedAt ?? '')) errs.push('review date missing');
  return errs;
}

export function audioErrors(a: AudioExample): string[] {
  const errs: string[] = [];
  for (const f of FORBIDDEN_AUDIO_FIELDS) if (f in (a as object)) errs.push(`forbidden audio field ${f}`);
  if (!(a.bpm >= 30 && a.bpm <= 140)) errs.push('bpm out of range 30–140');
  if (a.kind === 'melody') {
    if (!a.notes.length) errs.push('empty melody');
    for (const [m, b] of a.notes) {
      if (!(m === 0 || (m >= 36 && m <= 96))) errs.push(`note ${m} out of range`);
      if (!(b > 0 && b <= 8)) errs.push(`duration ${b} out of range`);
    }
  } else if (!a.pattern.length) errs.push('empty drum pattern');
  return errs;
}

/** Deep scan for forbidden keys (e.g. content JSON imported from elsewhere). */
export function containsForbiddenField(value: unknown): string | null {
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if ((FORBIDDEN_AUDIO_FIELDS as readonly string[]).includes(k)) return k;
      const inner = containsForbiddenField(v);
      if (inner) return inner;
    }
  }
  return null;
}
