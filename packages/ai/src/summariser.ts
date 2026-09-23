// Progress Summariser (agent A3). Implements REQ-AI-06 and REQ-M6-03. Deterministic templates; never causal.
import { DISCLAIMER, GOAL_TEMPLATES, SCALE_0_4 } from '@harmony/content';

export interface GoalRef { readonly id: string; readonly templateId: string; readonly label: string; readonly baseline: number; readonly target: number }
export interface GoalLogRef { readonly goalId: string; readonly date: string; readonly score: number }
export interface SessionLogRef { readonly date: string; readonly minutes: number; readonly together: boolean }

export interface GoalStats {
  readonly goalId: string; readonly label: string; readonly logs: number;
  readonly firstMean: number | null; readonly lastMean: number | null; readonly firstN: number; readonly lastN: number;
  readonly trend: 'higher' | 'lower' | 'about the same' | 'not enough logs';
}
export interface Review {
  readonly weeks: number; readonly daysWithSession: number; readonly sessions: number; readonly totalMinutes: number;
  readonly goals: readonly GoalStats[]; readonly text: string; readonly rawTable: string; readonly inWindow: boolean;
}

const DAY = 86_400_000;
const MIN_LOGS = 6;
const round1 = (n: number) => Math.round(n * 10) / 10;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function goalStats(goal: GoalRef, logs: readonly GoalLogRef[], start: number, end: number): GoalStats {
  const mine = logs.filter((l) => l.goalId === goal.id).map((l) => ({ t: Date.parse(l.date), s: l.score })).filter((l) => l.t >= start && l.t <= end);
  const first = mine.filter((l) => l.t < start + 14 * DAY).map((l) => l.s);
  const last = mine.filter((l) => l.t > end - 14 * DAY).map((l) => l.s);
  const f = mean(first), l = mean(last);
  let trend: GoalStats['trend'] = 'not enough logs';
  if (first.length >= MIN_LOGS && last.length >= MIN_LOGS && f !== null && l !== null) {
    trend = l - f >= 0.5 ? 'higher' : l - f <= -0.5 ? 'lower' : 'about the same';
  }
  return { goalId: goal.id, label: goal.label, logs: mine.length, firstMean: f === null ? null : round1(f), lastMean: l === null ? null : round1(l), firstN: first.length, lastN: last.length, trend };
}

export function summarise(goals: readonly GoalRef[], logs: readonly GoalLogRef[], sessions: readonly SessionLogRef[], startIso: string, endIso: string): Review {
  const start = Date.parse(startIso), end = Date.parse(endIso);
  const weeks = Math.max(0, Math.round((end - start) / (7 * DAY)));
  const inRange = sessions.filter((s) => { const t = Date.parse(s.date); return t >= start && t <= end; });
  const days = new Set(inRange.map((s) => s.date.slice(0, 10))).size;
  const minutes = inRange.reduce((a, s) => a + s.minutes, 0);
  const stats = goals.map((g) => goalStats(g, logs, start, end));

  const lines: string[] = [
    `Over ${weeks} weeks, you logged ${inRange.length} music sessions on ${days} days (${minutes} minutes in total).`,
  ];
  for (const s of stats) {
    if (s.trend === 'not enough logs') {
      lines.push(`${s.label}: there are not enough logs yet to compare the start and the end of this period (${s.logs} logs).`);
    } else {
      lines.push(`${s.label}: your ratings in the last two weeks were ${s.trend} than in the first two weeks (average ${s.firstMean} → ${s.lastMean} on a 0–4 scale, where 4 means "${SCALE_0_4[4]}").`);
    }
  }
  lines.push('These are your own ratings. Many things affect day-to-day change, so share them with your child’s therapist to talk about next steps.');
  lines.push(DISCLAIMER);

  const header = '| Goal | Logs | First 2 weeks (n, avg) | Last 2 weeks (n, avg) |\n| --- | --- | --- | --- |';
  const rows = stats.map((s) => `| ${s.label} | ${s.logs} | ${s.firstN}, ${s.firstMean ?? '—'} | ${s.lastN}, ${s.lastMean ?? '—'} |`);
  const rawTable = [`Sessions: ${inRange.length} · Days with a session: ${days} · Minutes: ${minutes}`, header, ...rows].join('\n');
  return { weeks, daysWithSession: days, sessions: inRange.length, totalMinutes: minutes, goals: stats, text: lines.join('\n\n'), rawTable, inWindow: weeks >= 8 && weeks <= 12 };
}

export function templateLabel(templateId: string): string {
  return GOAL_TEMPLATES.find((g) => g.id === templateId)?.label ?? templateId;
}
