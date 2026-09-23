// Typed access to the canonical claims register (evidence/claims_register.json).
import register from '../../../evidence/claims_register.json';
import type { Tier } from './types';

export interface Claim {
  readonly id: string;
  readonly text: string;
  readonly tier: Tier;
  readonly sections: readonly string[];
  readonly sources: readonly string[];
  readonly approvedNegation?: boolean;
}

export const CLAIMS: readonly Claim[] = register.claims as Claim[];
export const BANNED_TERMS: readonly string[] = register.bannedClaims.terms;
export const CLAIMS_VERSION: string = register.version;

export function claimById(id: string): Claim | undefined {
  return CLAIMS.find((c) => c.id === id);
}
