// BM25 retrieval over approved knowledge passages only (REQ-AI-02).
import { KNOWLEDGE, type KnowledgePassage } from '@harmony/content';
import { tokenize } from './text';

export interface Hit { readonly passage: KnowledgePassage; readonly score: number; /** IDF-weighted share of the query's terms found in the passage (0–1). */ readonly coverage: number }

const K1 = 1.4, B = 0.75;

interface Doc { passage: KnowledgePassage; tf: Map<string, number>; len: number; phrases: string[] }

function build(passages: readonly KnowledgePassage[]) {
  const docs: Doc[] = passages.map((p) => {
    // Keywords are weighted double.
    const toks = [...tokenize(`${p.title} ${p.text}`), ...tokenize(p.keywords.join(' ')), ...tokenize(p.keywords.join(' '))];
    const tf = new Map<string, number>();
    for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
    return { passage: p, tf, len: toks.length, phrases: p.keywords.filter((k) => k.includes(' ')).map((k) => k.toLowerCase()) };
  });
  const df = new Map<string, number>();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const avg = docs.reduce((s, d) => s + d.len, 0) / docs.length;
  return { docs, df, avg, n: docs.length };
}

const INDEX = build(KNOWLEDGE);

function idfOf(t: string): number {
  const df = INDEX.df.get(t) ?? 0;
  return Math.log(1 + (INDEX.n - df + 0.5) / (df + 0.5));
}

/**
 * Query expansion (retrieval only; never changes answer text):
 * - a small Filipino/Taglish lexicon for the Philippine launch region;
 * - everyday noise sources map to the generic sound-sensitivity vocabulary the passages use.
 */
const LEXICON: Readonly<Record<string, string>> = {
  tunog: 'sound', ingay: 'noise loud', takot: 'scared fear', natatakot: 'scared fear', anak: 'child', kanta: 'song sing',
  musika: 'music', bahay: 'home', tulog: 'sleep bedtime', iyak: 'upset', magwala: 'meltdown upset', laro: 'play',
};
const NOISE_SOURCES = /\b(dryers?|blenders?|vacuums?|vaccum|clippers?|drill\w*|renovation|fireworks?|balloons?|popping|sirens?|alarms?|announcements?|beep\w*|horns?|aircon|traffic|trolleys?|crowds?|crowded|mrt|toilets?|flush\w*|band|party|parties|wedding|supermarket|mall|shopping|scraping)\b/;

export function expandQuery(query: string): string {
  const lower = query.toLowerCase();
  const extra = lower.split(/[^a-z-]+/).map((w) => LEXICON[w]).filter(Boolean);
  if (NOISE_SOURCES.test(lower)) extra.push('sound noise loud sensitive');
  return extra.length ? `${query} ${extra.join(' ')}` : query;
}

export function retrieve(query: string, limit = 3): Hit[] {
  query = expandQuery(query);
  const q = [...new Set(tokenize(query))];
  const lower = query.toLowerCase();
  // Terms unknown to the corpus get the maximum IDF, so off-topic words weigh heavily against coverage.
  const qWeight = q.reduce((s, t) => s + idfOf(t), 0);
  const hits = INDEX.docs.map((d) => {
    let score = 0, matched = 0;
    for (const t of q) {
      const f = d.tf.get(t);
      if (!f) continue;
      const idf = idfOf(t);
      matched += idf;
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / INDEX.avg)));
    }
    for (const ph of d.phrases) if (lower.includes(ph)) score += 2;
    return { passage: d.passage, score, coverage: qWeight ? matched / qWeight : 0 };
  });
  return hits.filter((h) => h.score > 0).sort((a, b) => b.score - a.score || a.passage.id.localeCompare(b.passage.id)).slice(0, limit);
}
