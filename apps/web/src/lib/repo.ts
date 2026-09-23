// Local repository. Every write of child-related data passes consent.canStore() (REQ-PRV-01, REQ-PRV-05).
// Implements REQ-PRV-02 (local only), REQ-PRV-04 (retention), REQ-PRV-07 (audit), REQ-PRV-08 (export).
import {
  CHILD_POLICY, NO_CONSENT, PARENT_POLICY, append, canStore, grantConsent, purge, sanitisePlan, withdrawConsent,
  type AuditType, type AuditValue, type ExposurePlan,
} from '@harmony/core';
import type { AppData, Settings } from './types';

export const STORAGE_KEY = 'harmony.v1';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DEFAULT_SETTINGS: Settings = {
  reducedMotion: true,
  dyslexiaFont: false,
  textScale: 100,
  parentVolumeDb: PARENT_POLICY.defaultDb,
  childVolumeDb: CHILD_POLICY.defaultDb,
  llmCoachEnabled: false,
  region: 'SG',
  headphoneNoticeSeen: false,
  childModeActive: false,
  onboarded: false,
};

export function emptyData(): AppData {
  return {
    consent: NO_CONSENT, settings: { ...DEFAULT_SETTINGS }, profile: null, goals: [], goalLogs: [], sessions: [],
    diary: [], plans: [], exposureSessions: [], recordings: [], audit: [],
  };
}

export class ConsentRequiredError extends Error {
  constructor() { super('Consent is required before storing child data'); }
}

/** Keys that may be written without consent: they hold no child data. */
const NO_CONSENT_KEYS = new Set<keyof AppData>(['consent', 'settings', 'audit']);

export class Repo {
  private data: AppData;

  constructor(private readonly store: KeyValueStore, private readonly now: () => number = Date.now) {
    this.data = this.read();
  }

  private read(): AppData {
    try {
      const raw = this.store.getItem(STORAGE_KEY);
      if (!raw) return emptyData();
      const parsed = JSON.parse(raw) as Partial<AppData>;
      const base = emptyData();
      const merged: AppData = { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings } };
      merged.plans = merged.plans.map(sanitisePlan); // T-03: never trust stored exposure levels
      return merged;
    } catch {
      return emptyData(); // corrupt storage fails safe (no consent, defaults)
    }
  }

  private persist(): void {
    this.store.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  get snapshot(): AppData { return this.data; }
  get canStore(): boolean { return canStore(this.data.consent); }

  /** Generic guarded update. Child data needs consent; settings, consent and audit do not. */
  update<K extends keyof AppData>(key: K, value: AppData[K]): void {
    if (!NO_CONSENT_KEYS.has(key) && !this.canStore) throw new ConsentRequiredError();
    this.data = { ...this.data, [key]: value };
    this.persist();
  }

  updateSettings(patch: Partial<Settings>): void {
    this.update('settings', { ...this.data.settings, ...patch });
  }

  audit(type: AuditType, data: Record<string, AuditValue> = {}): void {
    this.update('audit', append(this.data.audit, type, data, this.now()));
  }

  giveConsent(adultGatePassed: boolean, acknowledged: boolean): boolean {
    const r = grantConsent({ adultGatePassed, acknowledged, now: this.now() });
    if (!r.ok) return false;
    this.update('consent', r.record);
    this.audit('consent.granted', { version: r.record.version! });
    return true;
  }

  /** REQ-PRV-05 stops collection at once; data stays until the caregiver chooses deletion. */
  withdraw(): void {
    this.update('consent', withdrawConsent(this.data.consent, this.now()));
    this.audit('consent.withdrawn', { version: this.data.consent.version ?? 'none' });
  }

  push<K extends 'goalLogs' | 'sessions' | 'diary' | 'exposureSessions' | 'recordings'>(key: K, item: AppData[K][number]): void {
    this.update(key, [...(this.data[key] as AppData[K][number][]), item] as AppData[K]);
  }

  savePlan(plan: ExposurePlan): void {
    this.update('plans', [...this.data.plans.filter((p) => p.id !== plan.id), sanitisePlan(plan)]);
  }

  /** REQ-PRV-04 removes records older than their retention window. Returns the number removed. */
  purgeExpired(): number {
    const now = this.now();
    const s = purge('sessionLog', this.data.sessions, (r) => r.at, now);
    const g = purge('goalLog', this.data.goalLogs, (r) => r.at, now);
    const d = purge('soundDiary', this.data.diary, (r) => r.at, now);
    const e = purge('exposureSession', this.data.exposureSessions, (r) => r.startedAt, now);
    const a = purge('audit', this.data.audit, (r) => r.at, now);
    const total = s.purged + g.purged + d.purged + e.purged;
    if (total + a.purged === 0) return 0;
    this.data = { ...this.data, sessions: s.kept, goalLogs: g.kept, diary: d.kept, exposureSessions: e.kept, audit: a.purged ? [] : this.data.audit };
    this.persist();
    if (total) this.audit('data.purged', { kind: 'records', count: total });
    return total;
  }

  /** REQ-PRV-08 a machine-readable copy of everything stored. */
  exportAll(): string {
    this.audit('data.exported', { entities: Object.keys(this.data).length });
    return JSON.stringify({ exportedAt: new Date(this.now()).toISOString(), format: 'harmonypath-export-v1', data: this.data }, null, 2);
  }

  /** REQ-PRV-04 deletes everything at once and starts a fresh audit log. */
  deleteAll(): void {
    this.store.removeItem(STORAGE_KEY);
    this.data = emptyData();
    this.audit('data.deleted');
  }
}

/** localStorage when available, in-memory otherwise (private mode, tests). */
export function browserStore(): KeyValueStore {
  try {
    const t = '__harmony_probe__';
    window.localStorage.setItem(t, t);
    window.localStorage.removeItem(t);
    return window.localStorage;
  } catch {
    return memoryStore();
  }
}

export function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}
