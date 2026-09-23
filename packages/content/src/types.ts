// Governed content types. Every item carries evidence metadata (REQ-NFR-05).
export type Tier = 'Verified' | 'Emerging' | 'Unverified';

export interface EvidenceMeta {
  readonly version: string;
  /** Sub-study sections, e.g. "§7.1". */
  readonly sections: readonly string[];
  /** Claim IDs from evidence/claims_register.json. */
  readonly claimIds: readonly string[];
  readonly tier: Tier;
  readonly reviewer: string;
  /** ISO date (YYYY-MM-DD). */
  readonly reviewedAt: string;
  /** Human clinical review (music therapist / audiologist). 'pending' until Gate 4 prerequisites close. */
  readonly clinicalReview: 'pending' | 'approved';
  /** Evaluator approval to use an otherwise banned term in an approved negation or question. */
  readonly termApproval?: { readonly by: string; readonly reason: string };
}

export type GoalArea =
  | 'joint-attention' | 'anticipation' | 'early-words' | 'instructions'
  | 'motor' | 'regulation' | 'transitions' | 'social-play';

export type AgeBand = '2-4' | '5-7' | '8-12';
export type Communication = 'speaking' | 'some-words' | 'minimally-verbal';

/** Note: [midi, beats]. Midi 0 = rest. A4 = 440 Hz is fixed; no alternative tunings exist (ADR-0002). */
export type Note = readonly [number, number];

export type AudioExample =
  | { readonly kind: 'melody'; readonly bpm: number; readonly notes: readonly Note[]; readonly timbre: 'soft' | 'bell' }
  | { readonly kind: 'drum'; readonly bpm: number; readonly pattern: readonly (0 | 1)[] };

export interface Activity extends EvidenceMeta {
  readonly id: string;
  readonly title: string;
  readonly goal: GoalArea;
  readonly summary: string;
  readonly ageBands: readonly AgeBand[];
  readonly communication: readonly Communication[];
  readonly minutes: number;
  readonly energy: 'calm' | 'active';
  readonly steps: readonly string[];
  /** 'Pause and wait' prompt (REQ-M1-02). */
  readonly pauseCue: string;
  readonly cueCards: readonly string[];
  readonly tips: readonly string[];
  readonly example: AudioExample;
  readonly learnId: string;
}

export interface ScheduleStep { readonly icon: string; readonly label: string }

export interface Routine extends EvidenceMeta {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly lyrics: readonly string[];
  readonly tune: string;
  readonly song: AudioExample;
  readonly schedule: readonly ScheduleStep[];
}

export interface Song extends EvidenceMeta {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly audio: AudioExample;
  readonly calm: boolean;
}

export interface EducationEntry extends EvidenceMeta {
  readonly id: string;
  readonly category: 'tiers' | 'interventions' | 'unverified' | 'therapist' | 'about';
  readonly title: string;
  readonly body: readonly string[];
  readonly deliveredBy?: string;
}

export interface KnowledgePassage extends EvidenceMeta {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly keywords: readonly string[];
}

export interface GoalTemplate {
  readonly id: string;
  readonly area: GoalArea;
  readonly label: string;
  readonly measure: string;
  readonly claimIds: readonly string[];
}

export interface RedFlagQuestion {
  readonly id: string;
  readonly text: string;
  readonly claimIds: readonly string[];
  /** A "yes" to a critical question alone makes the verdict Unverified. */
  readonly critical: boolean;
}

export interface SoundType { readonly id: string; readonly label: string; readonly icon: string; readonly synth?: 'hum' | 'whirr' | 'beep' | 'bell' }

export interface CrisisLines {
  readonly region: string;
  readonly emergency: string;
  readonly lines: readonly { readonly name: string; readonly number: string }[];
}
