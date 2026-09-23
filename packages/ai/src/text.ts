// Shared text utilities: banned-claim detection and tokenising for retrieval.
import { BANNED_TERMS } from '@harmony/content';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BANNED_RE = new RegExp(`\\b(${[...BANNED_TERMS].sort((a, b) => b.length - a.length).map(escape).join('|')})\\b`, 'gi');

/** All banned terms found in the text (lower-cased, de-duplicated). REQ-AI-07 */
export function findBannedTerms(text: string): string[] {
  return [...new Set([...text.matchAll(BANNED_RE)].map((m) => m[1]!.toLowerCase()))];
}

const STOP = new Set(('a an the and or but if to of in on for with at by from is are was were be been am do does did ' +
  'i me my we our you your he she they them his her their it its this that these those can could should would will ' +
  'how what when where why which who whom there here about into as so not no yes just very really any some ' +
  'get got have has had make help child kid son daughter toddler boy girl').split(' '));

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map(stem);
}

function stem(t: string): string {
  if (t.length > 5 && t.endsWith('ing')) return t.slice(0, -3);
  if (t.length > 4 && t.endsWith('ies')) return t.slice(0, -3) + 'y';
  if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
  return t;
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Masks emails and long digit strings (phone numbers, IDs) before any text leaves the device. T-09 */
export function scrubPii(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]')
    .replace(/(\+?\d[\d\s-]{6,}\d)/g, '[number]');
}
