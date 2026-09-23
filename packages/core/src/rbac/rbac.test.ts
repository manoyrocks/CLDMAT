import { describe, expect, it } from 'vitest';
import { can } from './rbac';

describe('rbac', () => {
  it('REQ-PRV-06 caregiver controls the family data', () => {
    expect(can('caregiver', 'logs.write')).toBe(true);
    expect(can('caregiver', 'data.deleteAll')).toBe(true);
    expect(can('caregiver', 'content.publish')).toBe(false);
  });

  it('REQ-PRV-06 child can play and stop sound but cannot leave Child Mode or change settings', () => {
    expect(can('child', 'audio.play')).toBe(true);
    expect(can('child', 'childmode.exit')).toBe(false);
    expect(can('child', 'settings.write')).toBe(false);
  });

  it('REQ-SAF-04 anyone can stop audio', () => {
    for (const r of ['caregiver', 'child', 'therapist', 'allied', 'admin'] as const) expect(can(r, 'audio.stop')).toBe(true);
  });

  it('REQ-PRV-06 allied professionals are read-only and need a caregiver share', () => {
    expect(can('allied', 'logs.read')).toBe(false);
    expect(can('allied', 'logs.read', { sharedByCaregiver: true })).toBe(true);
    expect(can('allied', 'logs.write', { sharedByCaregiver: true })).toBe(false);
    expect(can('allied', 'goals.write', { sharedByCaregiver: true })).toBe(false);
  });

  it('REQ-PRV-06 therapists need a share to read or assign', () => {
    expect(can('therapist', 'activities.assign')).toBe(false);
    expect(can('therapist', 'activities.assign', { sharedByCaregiver: true })).toBe(true);
    expect(can('therapist', 'data.deleteAll', { sharedByCaregiver: true })).toBe(false);
  });

  it('REQ-AI-07 content publication needs an evaluator approval', () => {
    expect(can('admin', 'content.publish')).toBe(false);
    expect(can('admin', 'content.publish', { evaluatorApproved: true })).toBe(true);
  });
});
