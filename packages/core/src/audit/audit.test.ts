import { describe, expect, it } from 'vitest';
import { AuditSchemaError, GENESIS, append, verifyChain } from './audit';
import { sha256Hex } from './sha256';

describe('sha256', () => {
  it('matches FIPS test vectors', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'))
      .toBe('248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  });
});

describe('audit log', () => {
  it('REQ-PRV-07 appends a hash chain that verifies', () => {
    let log = append([], 'consent.granted', { version: '1.0' }, 1);
    log = append(log, 'audio.stop', { source: 'child', latencyMs: 12 }, 2);
    log = append(log, 'data.deleted', {}, 3);
    expect(log[0]!.prevHash).toBe(GENESIS);
    expect(log[1]!.prevHash).toBe(log[0]!.hash);
    expect(log.map((e) => e.seq)).toEqual([0, 1, 2]);
    expect(verifyChain(log)).toBe(-1);
    expect(verifyChain([])).toBe(-1);
  });

  it('REQ-PRV-07 detects tampering, reordering and deletion', () => {
    let log = append([], 'childmode.entered', {}, 1);
    log = append(log, 'gate.failed', { attempt: 1 }, 2);
    log = append(log, 'childmode.exited', {}, 3);
    const edited = log.map((e, i) => (i === 1 ? { ...e, data: { attempt: 9 } } : e));
    expect(verifyChain(edited)).toBe(1);
    expect(verifyChain([log[0]!, log[2]!])).toBe(1);
    expect(verifyChain([{ ...log[0]!, prevHash: 'x' }])).toBe(0);
  });

  it('REQ-PRV-07 rejects personal data: unknown keys, free text, non-scalars and unknown types', () => {
    expect(() => append([], 'session.logged', { nickname: 'Sam' } as never, 1)).toThrow(AuditSchemaError);
    expect(() => append([], 'exposure.stopped', { reason: 'x'.repeat(40) }, 1)).toThrow(/too long/);
    expect(() => append([], 'data.exported', { entities: { a: 1 } as never }, 1)).toThrow(/scalar/);
    expect(() => append([], 'not.a.type' as never, {}, 1)).toThrow(/Unknown/);
  });

  it('does not mutate the input log', () => {
    const log = append([], 'gate.locked', {}, 1);
    const next = append(log, 'gate.locked', {}, 2);
    expect(log).toHaveLength(1);
    expect(next).toHaveLength(2);
  });
});
