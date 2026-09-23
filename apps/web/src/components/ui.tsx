// Shared components from the sensory-friendly design system.
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { GATE, INITIAL_GATE, checkAnswer, holdComplete, isGateLocked, levelDots, makeChallenge, policyFor, stepVolume, type GateState } from '@harmony/core';
import { DISCLAIMER, SCALE_0_4, type AudioExample, type Tier } from '@harmony/content';
import { engine } from '../audio/engine';
import { t } from '../lib/i18n';
import { Icon } from './Icon';

/** Screen wrapper: one h1 that receives focus on navigation (WCAG 2.4.3). */
export function Screen({ title, children, back, onBack }: { title: string; children: ReactNode; back?: string; onBack?: () => void }) {
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => { h.current?.focus(); }, [title]);
  return (
    <section>
      {onBack && (
        <button className="btn quiet" onClick={onBack} style={{ marginBottom: 12 }}>
          <Icon name="back" /> {back ?? t('common.back')}
        </button>
      )}
      <h1 ref={h} tabIndex={-1}>{title}</h1>
      {children}
    </section>
  );
}

export function TierChip({ tier, consensus }: { tier: Tier; consensus?: boolean }) {
  const icon = tier === 'Verified' ? '✓' : tier === 'Emerging' ? '◐' : '✕';
  return (
    <span className={`chip tier-${tier}`}>
      <span aria-hidden="true">{icon}</span> {t(`tier.${tier}`)}{consensus ? ` · ${t('tier.consensus')}` : ''}
    </span>
  );
}

export function Segmented<T extends string | number>({ legend, options, value, onChange, labels }: {
  legend: string; options: readonly T[]; value: T | null; onChange: (v: T) => void; labels?: (v: T) => ReactNode;
}) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className="segmented">
        {options.map((o) => (
          <button key={String(o)} type="button" aria-pressed={value === o} onClick={() => onChange(o)}>
            {labels ? labels(o) : String(o)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** 0–4 scale with word anchors (REQ-M6-02). */
export function Scale04({ legend, value, onChange, words = SCALE_0_4 }: { legend: string; value: number | null; onChange: (v: number) => void; words?: readonly string[] }) {
  return (
    <Segmented legend={legend} options={[0, 1, 2, 3, 4] as const} value={value as 0 | null} onChange={onChange}
      labels={(v) => (<><strong>{v}</strong><span className="scale-label">{words[v]}</span></>)} />
  );
}

export function Disclaimer() {
  return <div className="disclaimer" role="note"><strong>{t('common.important')}</strong><p style={{ margin: '4px 0 0' }}>{DISCLAIMER}</p></div>;
}

export function useEngineState() {
  return useSyncExternalStore((fn) => engine.subscribe(fn), () => `${engine.playing}|${engine.volume}|${engine.mode}`);
}

/** Plays governed model audio only on tap (REQ-SAF-02). */
export function PlayButton({ audio, label, loops }: { audio: AudioExample; label?: string; loops?: number }) {
  useEngineState();
  return (
    <div className="row">
      <button className="btn" onClick={() => engine.play(audio, { loops })}><Icon name="play" /> {label ?? t('common.playExample')}</button>
      {engine.playing && <button className="btn danger" onClick={() => engine.stopAll('parent')}><Icon name="stop" /> {t('common.stopSound')}</button>}
    </div>
  );
}

/** REQ-SAF-04 the permanent Stop / Too Loud control. pointerdown fires before click, for the fastest stop. */
export function StopBar({ onStop }: { onStop?: () => void }) {
  const fired = useRef(0);
  const stop = () => {
    const now = performance.now();
    if (now - fired.current < 300) return; // pointerdown + click would otherwise double-fire
    fired.current = now;
    engine.stopAll('child');
    onStop?.();
  };
  return (
    <button className="stopbar" aria-label={t('child.stopAria')} onPointerDown={stop} onClick={stop} data-testid="stopbar">
      <Icon name="stop" size={32} /> {t('child.stop')}
    </button>
  );
}

export function PictureCard({ icon, label, onSelect, pressed, speaker }: { icon: string; label: string; onSelect: () => void; pressed?: boolean; speaker?: boolean }) {
  return (
    <button className="picture" onClick={onSelect} aria-pressed={pressed} aria-label={speaker ? `${label}, ${t('child.playsSound')}` : label}>
      <Icon name={icon} size={56} />
      <span>{label}</span>
      {speaker && <span aria-hidden="true"><Icon name="sound" size={18} /></span>}
      {pressed && <span className="tick" aria-hidden="true"><Icon name="check" size={20} /></span>}
    </button>
  );
}

/** REQ-M4-03 child volume in 3 dB steps, never above the ceiling. */
export function VolumeControl({ mode, valueDb, onChange }: { mode: 'child' | 'parent'; valueDb: number; onChange: (db: number) => void }) {
  const policy = policyFor(mode);
  const dots = levelDots(valueDb, policy);
  const change = (dir: 'up' | 'down') => onChange(engine.setVolume(stepVolume(valueDb, dir, policy)));
  return (
    <div className="row" style={{ justifyContent: 'center' }} role="group" aria-label={t('common.volume')}>
      <button className="btn" onClick={() => change('down')} aria-label={t('common.quieter')}>−</button>
      <div className="dots" aria-label={t('common.volumeLevel', { n: dots })} role="img">
        {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= dots ? 'on' : ''} />)}
      </div>
      <button className="btn" onClick={() => change('up')} aria-label={t('common.louder')}>+</button>
    </div>
  );
}

/** Adult challenge dialog (REQ-SAF-08). Also used as the adult check before consent (REQ-PRV-01). */
export function GateDialog({ onPass, onCancel, onFail }: { onPass: () => void; onCancel: () => void; onFail?: (attempt: number, locked: boolean) => void }) {
  const [challenge, setChallenge] = useState(() => makeChallenge(Math.random));
  const [answer, setAnswer] = useState('');
  const [state, setState] = useState<GateState>(INITIAL_GATE);
  const [msg, setMsg] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);
  const submit = () => {
    const now = Date.now();
    const r = checkAnswer(challenge, answer, state, now);
    setState(r.state);
    setAnswer('');
    if (r.passed) return onPass();
    onFail?.(r.state.failures, r.locked);
    setMsg(r.locked ? t('gate.locked') : t('gate.wrong'));
    setChallenge(makeChallenge(Math.random));
  };
  const locked = isGateLocked(state, Date.now());
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="dialog">
        <h2 id="gate-title" style={{ marginTop: 0 }}>{t('gate.title')}</h2>
        <p>{t('gate.explain')}</p>
        <label htmlFor="gate-answer">{challenge.prompt}</label>
        <input id="gate-answer" ref={input} type="text" inputMode="numeric" autoComplete="off" value={answer}
          onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !locked && submit()} disabled={locked} />
        <p role="alert" className="muted small" style={{ minHeight: '1.5em' }}>{msg}</p>
        <div className="row">
          <button className="btn primary" onClick={submit} disabled={locked}>{t('gate.check')}</button>
          <button className="btn quiet" onClick={onCancel}>{t('common.cancel')}</button>
        </div>
      </div>
    </div>
  );
}

/** Press-and-hold for 2 s (pointer, or Space/Enter held) before the adult challenge appears. */
export function GrownUpsButton({ onHeld }: { onHeld: () => void }) {
  const [start, setStart] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (start === null) return;
    const id = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - start) / GATE.holdMs);
      setProgress(p);
      if (holdComplete(start, performance.now())) { setStart(null); setProgress(0); onHeld(); }
    }, 50);
    return () => window.clearInterval(id);
  }, [start, onHeld]);
  const begin = () => setStart((s) => s ?? performance.now());
  const end = () => { setStart(null); setProgress(0); };
  return (
    <button className="grownups" aria-label={t('child.grownups')} data-testid="grownups"
      onPointerDown={begin} onPointerUp={end} onPointerLeave={end} onPointerCancel={end} onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); begin(); } }}
      onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') end(); }}>
      {t('child.grownupsShort')}
      <span className="ring" style={{ width: `${progress * 100}%` }} />
    </button>
  );
}
