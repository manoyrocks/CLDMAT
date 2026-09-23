import { describe, expect, it } from 'vitest';
import { EXPOSURE, createPlan, verifyChain } from '@harmony/core';
import { ConsentRequiredError, Repo, STORAGE_KEY, memoryStore } from './repo';

const DAY = 86_400_000;
const session = (at: number) => ({ id: String(at), date: '2026-09-01', at, activityIds: [], minutes: 10, together: true, engagement: 2 });

describe('local repository', () => {
  it('REQ-PRV-01 nothing about the child can be stored before consent', () => {
    const repo = new Repo(memoryStore());
    expect(repo.canStore).toBe(false);
    expect(() => repo.update('profile', { nickname: 'Sam', ageBand: '2-4', communication: 'speaking', liked: [], disliked: [], calmPlaylist: [] })).toThrow(ConsentRequiredError);
    expect(() => repo.push('sessions', session(1))).toThrow(ConsentRequiredError);
    // Settings hold no child data and may be saved.
    repo.updateSettings({ dyslexiaFont: true });
    expect(repo.snapshot.settings.dyslexiaFont).toBe(true);
  });

  it('REQ-PRV-01 consent needs the adult gate and acknowledgement, and is audited', () => {
    const repo = new Repo(memoryStore(), () => 1000);
    expect(repo.giveConsent(false, true)).toBe(false);
    expect(repo.giveConsent(true, true)).toBe(true);
    expect(repo.canStore).toBe(true);
    repo.push('sessions', session(1000));
    expect(repo.snapshot.sessions).toHaveLength(1);
    expect(repo.snapshot.audit[0]!.type).toBe('consent.granted');
    expect(verifyChain(repo.snapshot.audit)).toBe(-1);
  });

  it('REQ-PRV-05 withdrawing consent stops collection', () => {
    const repo = new Repo(memoryStore());
    repo.giveConsent(true, true);
    repo.withdraw();
    expect(repo.canStore).toBe(false);
    expect(() => repo.push('diary', { id: 'd', at: 1, soundType: 'blender', place: 'home', loudness: 2, reaction: 2, predictable: false })).toThrow();
    expect(repo.snapshot.audit.map((a) => a.type)).toEqual(['consent.granted', 'consent.withdrawn']);
  });

  it('REQ-PRV-04 purges records past their retention window', () => {
    let now = 1_800_000_000_000;
    const repo = new Repo(memoryStore(), () => now);
    repo.giveConsent(true, true);
    repo.push('sessions', session(now - 400 * DAY));
    repo.push('sessions', session(now));
    repo.push('diary', { id: 'old', at: now - 100 * DAY, soundType: 'x', place: 'home', loudness: 1, reaction: 0, predictable: true });
    repo.push('goalLogs', { goalId: 'g', date: '2026-01-01', score: 2, at: now });
    repo.push('exposureSessions', { planId: 'p', startedAt: now, endedAt: now, levelDb: -45, distress: [0], outcome: 'completed' });
    expect(repo.purgeExpired()).toBe(2);
    expect(repo.snapshot.sessions).toHaveLength(1);
    expect(repo.snapshot.diary).toHaveLength(0);
    expect(repo.snapshot.audit.at(-1)!.type).toBe('data.purged');
    expect(repo.purgeExpired()).toBe(0);
    // An audit log older than two years is rotated.
    now += 800 * DAY;
    repo.purgeExpired();
    expect(repo.snapshot.audit.every((a) => a.at === now)).toBe(true);
  });

  it('REQ-PRV-08 export contains every entity; REQ-PRV-04 delete-all wipes storage', () => {
    const store = memoryStore();
    const repo = new Repo(store);
    repo.giveConsent(true, true);
    const exported = JSON.parse(repo.exportAll());
    expect(Object.keys(exported.data).sort()).toEqual(['audit', 'consent', 'diary', 'exposureSessions', 'goalLogs', 'goals', 'plans', 'profile', 'recordings', 'sessions', 'settings']);
    repo.deleteAll();
    expect(repo.canStore).toBe(false);
    expect(repo.snapshot.audit.map((a) => a.type)).toEqual(['data.deleted']);
    expect(JSON.parse(store.getItem(STORAGE_KEY)!).consent.status).toBe('none');
  });

  it('REQ-SAF-05 tampered stored exposure levels are clamped on load (T-03)', () => {
    const store = memoryStore();
    const repo = new Repo(store);
    repo.giveConsent(true, true);
    repo.savePlan({ ...createPlan('p', 'hand-dryer'), currentLevelDb: -30 });
    const raw = JSON.parse(store.getItem(STORAGE_KEY)!);
    raw.plans[0].currentLevelDb = 0;
    store.setItem(STORAGE_KEY, JSON.stringify(raw));
    expect(new Repo(store).snapshot.plans[0]!.currentLevelDb).toBe(EXPOSURE.ceilingDb);
    repo.savePlan({ ...createPlan('p', 'hand-dryer'), currentLevelDb: -44 });
    expect(repo.snapshot.plans).toHaveLength(1);
  });

  it('corrupt storage fails safe to defaults with no consent', () => {
    const store = memoryStore();
    store.setItem(STORAGE_KEY, '{not json');
    const repo = new Repo(store);
    expect(repo.canStore).toBe(false);
    expect(repo.snapshot.settings.reducedMotion).toBe(true);
  });
});
