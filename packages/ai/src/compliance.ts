// Content Compliance Checker (agent A4). Implements REQ-AI-07 and REQ-NFR-05. Deterministic.
import {
  ACTIVITIES, EDUCATION, KNOWLEDGE, RED_FLAG_QUESTIONS, ROUTINES, SONGS, GOAL_TEMPLATES, THERAPIST_QUESTIONS,
  claimById, containsForbiddenField, metaErrors, type EvidenceMeta, type Tier,
} from '@harmony/content';
import { findBannedTerms } from './text';

export const MAX_REVIEW_AGE_DAYS = 365;

export interface ComplianceResult {
  readonly id: string;
  readonly status: 'pass' | 'blocked';
  readonly violations: readonly string[];
  readonly warnings: readonly string[];
}

type Item = EvidenceMeta & { id: string };

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) if (k !== 'termApproval' && k !== 'reviewer') strings(v, out);
  }
  return out;
}

const RANK: Record<Tier, number> = { Unverified: 0, Emerging: 1, Verified: 2 };

export function checkItem(item: Item, kind: 'practice' | 'explainer', now: Date): ComplianceResult {
  const violations = [...metaErrors(item)];
  const warnings: string[] = [];

  const banned = findBannedTerms(strings(item).join('\n'));
  if (banned.length && !item.termApproval) violations.push(`banned claim terms: ${banned.join(', ')}`);
  if (banned.length && item.termApproval) warnings.push(`banned terms allowed by approval (${item.termApproval.by}): ${banned.join(', ')}`);

  const forbidden = containsForbiddenField(item);
  if (forbidden) violations.push(`forbidden field ${forbidden} (excluded therapy, ADR-0002)`);

  const reviewed = Date.parse(item.reviewedAt);
  if (Number.isFinite(reviewed) && (now.getTime() - reviewed) / 86_400_000 > MAX_REVIEW_AGE_DAYS) {
    violations.push('review out of date (older than 365 days)');
  }

  const tiers = item.claimIds.map((c) => claimById(c)?.tier).filter((t): t is Tier => !!t);
  if (tiers.length) {
    // Practices may not claim a higher tier than their weakest evidence; explainers must match a cited tier.
    if (kind === 'practice' && RANK[item.tier] > Math.min(...tiers.map((t) => RANK[t]))) violations.push('tier higher than cited evidence');
    if (kind === 'explainer' && !tiers.includes(item.tier)) violations.push('tier does not match cited claims');
  }
  if (item.clinicalReview !== 'approved') warnings.push('clinical review pending (credentialed music therapist)');

  return { id: item.id, status: violations.length ? 'blocked' : 'pass', violations, warnings };
}

/** Plain UI strings outside the evidence-carrying items (goal templates, checklists). */
export function checkPlainText(id: string, text: string, approvedTerms: readonly string[] = []): ComplianceResult {
  const banned = findBannedTerms(text).filter((t) => !approvedTerms.includes(t));
  return { id, status: banned.length ? 'blocked' : 'pass', violations: banned.map((t) => `banned claim term: ${t}`), warnings: [] };
}

/** Red-flag questions ASK about cure promises, so these terms are approved there only. */
export const RED_FLAG_APPROVED_TERMS: Readonly<Record<string, readonly string[]>> = { 'rf-cure': ['cure', 'recover'], 'rf-retrain': ['retrain hearing'] };

export function checkLibrary(now: Date): ComplianceResult[] {
  return [
    ...[...ACTIVITIES, ...ROUTINES, ...SONGS].map((i) => checkItem(i, 'practice', now)),
    ...[...EDUCATION, ...KNOWLEDGE].map((i) => checkItem(i, 'explainer', now)),
    ...GOAL_TEMPLATES.map((g) => checkPlainText(g.id, `${g.label} ${g.measure}`)),
    ...RED_FLAG_QUESTIONS.map((q) => checkPlainText(q.id, q.text, RED_FLAG_APPROVED_TERMS[q.id])),
    ...THERAPIST_QUESTIONS.map((q, i) => checkPlainText(`therapist-q${i + 1}`, q)),
  ];
}

/** Publication gate: compliance pass AND a recorded Evaluator approval (team prompt §5, §8.5). */
export function canPublish(result: ComplianceResult, evaluatorApproved: boolean): boolean {
  return result.status === 'pass' && evaluatorApproved;
}
