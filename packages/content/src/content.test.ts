import { describe, expect, it } from 'vitest';
import {
  ACTIVITIES, CLAIMS, CREDENTIAL_BODIES, EDUCATION, GOAL_TEMPLATES, KNOWLEDGE, RED_FLAG_QUESTIONS, ROUTINES, SONGS,
  SOUND_TYPES, THERAPIST_QUESTIONS, activityById, audioErrors, claimById, containsForbiddenField, crisisLinesFor,
  educationById, evaluateRedFlags, metaErrors, passageById, DISCLAIMER,
} from './index';

const GOALS = ['joint-attention', 'anticipation', 'early-words', 'instructions', 'motor', 'regulation', 'social-play'];

describe('activity library', () => {
  it('REQ-M1-01 covers every goal area from sub-study §7.1', () => {
    for (const g of GOALS) expect(ACTIVITIES.some((a) => a.goal === g), g).toBe(true);
    // Transitions are served by routine songs (M3).
    expect(ROUTINES.length).toBeGreaterThanOrEqual(4);
  });

  it('REQ-M1-02 every activity has steps, a pause-and-wait prompt, cue cards and tips', () => {
    for (const a of ACTIVITIES) {
      expect(a.steps.length, a.id).toBeGreaterThanOrEqual(3);
      expect(a.pauseCue, a.id).toMatch(/pause|wait|freeze|stop|hold|leave/i);
      expect(a.cueCards.length, a.id).toBeGreaterThan(0);
      expect(a.tips.length, a.id).toBeGreaterThan(0);
    }
  });

  it('REQ-M1-03 every activity has a valid model audio example', () => {
    for (const a of ACTIVITIES) expect(audioErrors(a.example), a.id).toEqual([]);
    for (const r of ROUTINES) expect(audioErrors(r.song), r.id).toEqual([]);
    for (const s of SONGS) expect(audioErrors(s.audio), s.id).toEqual([]);
  });

  it('REQ-M1-04 every activity links to an existing Education Hub entry and has a tier', () => {
    for (const a of ACTIVITIES) {
      expect(educationById(a.learnId), a.learnId).toBeDefined();
      expect(a.tier).toBe('Emerging');
    }
    expect(activityById('act-drum-conversation')?.title).toBe('Drum conversation');
    expect(activityById('nope')).toBeUndefined();
  });

  it('REQ-M2-01 the library can fill a 10–15 minute session', () => {
    const total = ACTIVITIES.reduce((s, a) => s + a.minutes, 0);
    expect(total).toBeGreaterThan(15);
    for (const a of ACTIVITIES) expect(a.minutes).toBeLessThanOrEqual(5);
  });

  it('REQ-NFR-05 every item has version, source, claims, tier, reviewer and review date', () => {
    for (const item of [...ACTIVITIES, ...ROUTINES, ...SONGS, ...EDUCATION, ...KNOWLEDGE]) {
      expect(metaErrors(item), item.id).toEqual([]);
    }
  });

  it('REQ-NFR-05 metaErrors reports each missing field', () => {
    const bad = { version: '1', sections: [], claimIds: ['C-999'], tier: 'Maybe', reviewer: '', reviewedAt: 'soon' } as never;
    expect(metaErrors(bad)).toEqual([
      'version missing or not semver', 'source section missing', 'unknown claim C-999', 'tier missing', 'reviewer missing', 'review date missing',
    ]);
    expect(metaErrors({ ...ACTIVITIES[0]!, claimIds: [] })).toContain('no claim IDs');
    expect(metaErrors({} as never)).toContain('no claim IDs');
  });
});

describe('excluded therapies (ADR-0002)', () => {
  it('REQ-M8-03 no content item contains filter, modulation, binaural or tuning fields', () => {
    expect(containsForbiddenField([ACTIVITIES, ROUTINES, SONGS])).toBeNull();
    expect(containsForbiddenField({ a: [{ audio: { tuningHz: 432 } }] })).toBe('tuningHz');
    expect(containsForbiddenField(null)).toBeNull();
  });

  it('REQ-M8-03 audio validation rejects excluded or unsafe audio specs', () => {
    expect(audioErrors({ kind: 'melody', bpm: 60, notes: [[60, 1]], timbre: 'soft', binaural: true } as never)).toContain('forbidden audio field binaural');
    expect(audioErrors({ kind: 'melody', bpm: 300, notes: [], timbre: 'soft' })).toEqual(['bpm out of range 30–140', 'empty melody']);
    expect(audioErrors({ kind: 'melody', bpm: 60, notes: [[120, 1], [60, 0]], timbre: 'soft' })).toEqual(['note 120 out of range', 'duration 0 out of range']);
    expect(audioErrors({ kind: 'drum', bpm: 60, pattern: [] })).toEqual(['empty drum pattern']);
  });

  it('REQ-M8-03 the hub explains each unverified programme', () => {
    const unverified = EDUCATION.filter((e) => e.category === 'unverified');
    const titles = unverified.map((e) => e.title).join(' ');
    for (const name of ['Auditory Integration', 'Tomatis', 'Samonas', 'Safe and Sound', 'Binaural', 'Sound baths']) expect(titles).toContain(name);
    for (const e of unverified) expect(e.tier).toBe('Unverified');
  });
});

describe('education and claims', () => {
  it('REQ-M8-01 explains all three tiers', () => {
    expect(EDUCATION.filter((e) => e.category === 'tiers').map((e) => e.title)).toEqual(['Verified', 'Emerging', 'Unverified']);
  });

  it('REQ-M8-04 the disclaimer matches claim D-001 exactly', () => {
    expect(DISCLAIMER.replace(/’/g, "'")).toBe(claimById('D-001')!.text.replace(/’/g, "'"));
    expect(educationById('edu-disclaimer')!.body[0]).toBe(DISCLAIMER);
  });

  it('every claim ID is unique and every passage ID is unique', () => {
    expect(new Set(CLAIMS.map((c) => c.id)).size).toBe(CLAIMS.length);
    expect(new Set(KNOWLEDGE.map((k) => k.id)).size).toBe(KNOWLEDGE.length);
    expect(passageById('K-01')?.title).toBeDefined();
    expect(passageById('K-999')).toBeUndefined();
  });

  it('item tiers match the tiers of the claims they cite', () => {
    const rank = { Unverified: 0, Emerging: 1, Verified: 2 } as const;
    for (const item of [...ACTIVITIES, ...ROUTINES, ...SONGS]) {
      const min = Math.min(...item.claimIds.map((c) => rank[claimById(c)!.tier]));
      expect(rank[item.tier], item.id).toBeLessThanOrEqual(min);
    }
    for (const item of [...EDUCATION, ...KNOWLEDGE]) {
      expect(item.claimIds.map((c) => claimById(c)!.tier), item.id).toContain(item.tier);
    }
  });
});

describe('goals, red flags and therapist checklist', () => {
  it('REQ-M6-01 goal templates exist and none target stimming or normalising', () => {
    expect(GOAL_TEMPLATES.length).toBeGreaterThanOrEqual(6);
    for (const g of GOAL_TEMPLATES) {
      expect(g.label).not.toMatch(/stim|flap|rock|normal|reduce autism|eye contact/i);
      for (const c of g.claimIds) expect(claimById(c), g.id).toBeDefined();
    }
  });

  it('REQ-M8-02 red-flag checker verdicts', () => {
    const none = Object.fromEntries(RED_FLAG_QUESTIONS.map((q) => [q.id, 'no' as const]));
    expect(evaluateRedFlags(none)).toMatchObject({ level: 'none', flags: 0 });
    expect(evaluateRedFlags({ ...none, 'rf-cost': 'yes' })).toMatchObject({ level: 'caution', flags: 1 });
    expect(evaluateRedFlags({ ...none, 'rf-goals': 'unsure' })).toMatchObject({ level: 'caution', unsure: 1 });
    expect(evaluateRedFlags({ ...none, 'rf-cure': 'yes' }).level).toBe('unverified');
    const three = evaluateRedFlags({ ...none, 'rf-cost': 'yes', 'rf-testimonials': 'yes', 'rf-goals': 'yes' });
    expect(three.level).toBe('unverified');
    const retrain = evaluateRedFlags({ ...none, 'rf-retrain': 'yes' });
    expect(retrain.learnIds).toContain('edu-ait');
    expect(evaluateRedFlags({}).unsure).toBe(RED_FLAG_QUESTIONS.length);
    for (const id of retrain.learnIds) expect(educationById(id), id).toBeDefined();
  });

  it('REQ-M9-01 five therapist questions and credential bodies without paid rankings', () => {
    expect(THERAPIST_QUESTIONS).toHaveLength(5);
    expect(CREDENTIAL_BODIES.map((c) => c.region)).toEqual(['Singapore', 'Philippines', 'United States', 'United Kingdom', 'Australia']);
  });

  it('REQ-AI-04 crisis lines exist for each launch region, with a fallback', () => {
    for (const r of ['SG', 'PH', 'US', 'UK', 'AU']) expect(crisisLinesFor(r).region).toBe(r);
    expect(crisisLinesFor('ZZ').region).toBe('SG');
  });

  it('REQ-M5-05 built-in practice sounds exist', () => {
    expect(SOUND_TYPES.filter((s) => s.synth).length).toBeGreaterThanOrEqual(4);
  });
});
