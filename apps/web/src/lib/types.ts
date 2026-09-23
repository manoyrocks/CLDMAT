// Local data model (architecture/data_model.md). Minimised: no names, birth dates, photos or diagnoses (REQ-PRV-03).
import type { AgeBand, Communication } from '@harmony/content';
import type { AuditEvent, ConsentRecord, ExposurePlan } from '@harmony/core';

export interface ChildProfile {
  nickname: string;
  ageBand: AgeBand;
  communication: Communication;
  liked: string[];
  disliked: string[];
  calmPlaylist: string[];
}

export interface Settings {
  reducedMotion: boolean;
  dyslexiaFont: boolean;
  textScale: 100 | 115 | 130;
  parentVolumeDb: number;
  childVolumeDb: number;
  llmCoachEnabled: boolean;
  region: 'SG' | 'PH' | 'US' | 'UK' | 'AU';
  headphoneNoticeSeen: boolean;
  childModeActive: boolean;
  onboarded: boolean;
}

export interface Goal { id: string; templateId: string; label: string; baseline: number; target: number; createdAt: number; active: boolean }
export interface GoalLog { goalId: string; date: string; score: number; note?: string; at: number }
export interface SessionLog { id: string; date: string; at: number; activityIds: string[]; minutes: number; together: boolean; engagement: number }
export interface SoundDiaryEntry { id: string; at: number; soundType: string; place: string; loudness: number; reaction: number; predictable: boolean }
export interface ExposureSessionLog { planId: string; startedAt: number; endedAt: number; levelDb: number; distress: number[]; outcome: string }
export interface RecordingMeta { routineId: string; peak: number; savedAt: number }

export interface AppData {
  consent: ConsentRecord;
  settings: Settings;
  profile: ChildProfile | null;
  goals: Goal[];
  goalLogs: GoalLog[];
  sessions: SessionLog[];
  diary: SoundDiaryEntry[];
  plans: ExposurePlan[];
  exposureSessions: ExposureSessionLog[];
  recordings: RecordingMeta[];
  audit: AuditEvent[];
}
