// Role-based permissions. Implements REQ-PRV-06. Enforced in the deterministic core, never by AI.
export type Role = 'caregiver' | 'child' | 'therapist' | 'allied' | 'admin';
export type Action =
  | 'profile.read' | 'profile.write'
  | 'logs.read' | 'logs.write'
  | 'goals.write' | 'activities.assign'
  | 'settings.write' | 'childmode.exit'
  | 'data.export' | 'data.deleteAll'
  | 'content.publish' | 'audio.play' | 'audio.stop';

export interface AccessContext {
  /** The caregiver has shared this family's data with the professional. */
  readonly sharedByCaregiver?: boolean;
  /** An evaluator approval is recorded for the content item. */
  readonly evaluatorApproved?: boolean;
}

const MATRIX: Readonly<Record<Role, readonly Action[]>> = Object.freeze({
  caregiver: ['profile.read', 'profile.write', 'logs.read', 'logs.write', 'goals.write', 'settings.write',
    'childmode.exit', 'data.export', 'data.deleteAll', 'audio.play', 'audio.stop'],
  child: ['audio.play', 'audio.stop'],
  therapist: ['profile.read', 'logs.read', 'activities.assign', 'goals.write'],
  allied: ['profile.read', 'logs.read'],
  admin: ['content.publish'],
});

const NEEDS_SHARE: ReadonlySet<Role> = new Set<Role>(['therapist', 'allied']);

export function can(role: Role, action: Action, ctx: AccessContext = {}): boolean {
  // Anyone may stop sound at any time (REQ-SAF-04).
  if (action === 'audio.stop') return true;
  if (!MATRIX[role].includes(action)) return false;
  if (NEEDS_SHARE.has(role) && !ctx.sharedByCaregiver) return false;
  if (action === 'content.publish' && !ctx.evaluatorApproved) return false;
  return true;
}
