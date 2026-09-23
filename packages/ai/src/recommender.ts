// Activity Recommender (agent A1). Implements REQ-AI-01. Deterministic scoring over the curated library only.
import { ACTIVITIES, GOAL_TEMPLATES, GOAL_AREA_LABELS, type Activity, type AgeBand, type Communication } from '@harmony/content';

export interface RecommendInput {
  readonly ageBand: AgeBand;
  readonly communication: Communication;
  readonly goalTemplateIds: readonly string[];
  readonly liked?: readonly string[];
  readonly disliked?: readonly string[];
  /** Activity IDs done in the last two days. */
  readonly recent?: readonly string[];
  readonly minutes?: number;
}

export interface Recommendation { readonly activityId: string; readonly reasons: readonly string[]; readonly minutes: number }

/** Goal areas served by another module rather than by library activities. */
export const GOALS_SERVED_ELSEWHERE: Readonly<Record<string, string>> = { transitions: 'Routine songs' };

/** Plain-language notes for goals that the activity library does not cover (shown next to the plan). */
export function planNotes(goalTemplateIds: readonly string[]): string[] {
  return goalTemplateIds
    .map((id) => GOAL_TEMPLATES.find((g) => g.id === id)?.area)
    .flatMap((area) => (area && GOALS_SERVED_ELSEWHERE[area] ? [`For your ${GOAL_AREA_LABELS[area].toLowerCase()} goal, use ${GOALS_SERVED_ELSEWHERE[area]}.`] : []));
}

export function recommend(input: RecommendInput, library: readonly Activity[] = ACTIVITIES): Recommendation[] {
  const budget = Math.min(15, Math.max(10, input.minutes ?? 12));
  const goalAreas = new Set(input.goalTemplateIds.map((id) => GOAL_TEMPLATES.find((g) => g.id === id)?.area).filter(Boolean));
  const scored = library
    .filter((a) => a.ageBands.includes(input.ageBand))
    .map((a) => {
      let score = 0;
      const reasons: string[] = [];
      if (goalAreas.has(a.goal)) { score += 3; reasons.push(`Matches your goal: ${GOAL_AREA_LABELS[a.goal].toLowerCase()}`); }
      score += 2; reasons.push(`Suits ages ${input.ageBand}`);
      if (a.communication.includes(input.communication)) { score += 1; reasons.push('Works for how your child communicates'); }
      if (input.liked?.includes(a.id)) { score += 2; reasons.push('Your child enjoyed this before'); }
      if (input.disliked?.includes(a.id)) score -= 5;
      if (input.recent?.includes(a.id)) score -= 1; else reasons.push('Adds variety');
      return { a, score, reasons };
    })
    .sort((x, y) => y.score - x.score || x.a.id.localeCompare(y.a.id));

  // Fill the time budget with 2–4 activities, ending on a calm one when possible.
  const picked: typeof scored = [];
  let total = 0;
  for (const s of scored) {
    if (picked.length >= 4) break;
    if (s.score < 0) continue;
    if (total + s.a.minutes > budget) continue;
    picked.push(s);
    total += s.a.minutes;
  }
  const calm = picked.findIndex((p) => p.a.energy === 'calm');
  if (calm >= 0 && calm !== picked.length - 1) picked.push(picked.splice(calm, 1)[0]!);
  return picked.map((p) => ({ activityId: p.a.id, reasons: p.reasons, minutes: p.a.minutes }));
}
