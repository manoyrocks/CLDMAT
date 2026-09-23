import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') && !p.endsWith('.test.ts') ? [p] : [];
  });
}

describe('safety core boundaries', () => {
  it('REQ-SAF-09 core has no network, AI, storage or DOM dependencies', () => {
    for (const f of files(__dirname)) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/from ['"]@harmony\/(ai|content)['"]/);
      expect(src, f).not.toMatch(/\bfetch\(|XMLHttpRequest|localStorage|indexedDB|document\.|window\./);
    }
  });
});
