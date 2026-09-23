// Sound Sensitivity Toolkit (M5): diary, patterns, countdown, too-loud card, graded exposure, strategies.
// REQ-M5-01, REQ-M5-02, REQ-M5-03, REQ-M5-04, REQ-M5-05, REQ-M5-06, REQ-M5-07. All exposure rules come from @harmony/core (REQ-SAF-05, REQ-SAF-06); this screen only renders them.
import { useEffect, useMemo, useState } from 'react';
import {
  EXPOSURE, acceptStepUp, canStepUp, childStop, completeSession, createPlan, isLocked, playbackLevelDb, recordDistress,
  startSession, type ExposurePlan, type ExposureSession,
} from '@harmony/core';
import { EDUCATION, PLACES, SOUND_TYPES, claimById } from '@harmony/content';
import { engine } from '../audio/engine';
import { canRecord, loadRecording, record, saveRecording } from '../audio/recordings';
import { Icon } from '../components/Icon';
import { Scale04, Screen, Segmented, StopBar, TierChip } from '../components/ui';
import { t } from '../lib/i18n';
import { uid, useStore } from '../lib/store';

export function SoundHub() {
  const { go, data } = useStore();
  const items: [string, string, string][] = [
    ['sound/diary', 'list', t('sound.diary')],
    ['sound/patterns', 'target', t('sound.patterns')],
    ['sound/countdown', 'countdown', t('sound.countdown')],
    ['sound/tooloud', 'stop', t('sound.tooLoud')],
    ['sound/exposure', 'ear', t('sound.exposure')],
    ['sound/strategies', 'learn', t('sound.strategies')],
  ];
  return (
    <Screen title={t('sound.title')}>
      <p>{t('sound.intro')}</p>
      <ul className="list">
        {items.map(([path, icon, label]) => (
          <li key={path}><button className="card" onClick={() => go(path)}><Icon name={icon} /> <strong>{label}</strong></button></li>
        ))}
      </ul>
      <div className="notice" style={{ marginTop: 16 }}>
        <strong>{t('sound.referralTitle')}</strong>
        <p style={{ margin: '4px 0 0' }}>{claimById('C-020')!.text} {claimById('C-022')!.text}</p>
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>{t('sound.diaryCount', { n: data.diary.length })}</p>
    </Screen>
  );
}

export function SoundDiary() {
  const { repo, refresh, go, data } = useStore();
  const [sound, setSound] = useState<string | null>(null);
  const [place, setPlace] = useState<string | null>(null);
  const [loudness, setLoudness] = useState<number | null>(null);
  const [reaction, setReaction] = useState<number | null>(null);
  const [predictable, setPredictable] = useState<'yes' | 'no' | null>(null);
  const [saved, setSaved] = useState(false);
  const ready = sound && place && loudness !== null && reaction !== null && predictable;
  return (
    <Screen title={t('sound.diary')} onBack={() => go('sound')}>
      <p className="muted">{t('diary.intro')}</p>
      <fieldset>
        <legend>{t('diary.what')}</legend>
        <div className="cards">
          {SOUND_TYPES.map((s) => (
            <button key={s.id} type="button" className="picture" style={{ minHeight: 96, fontSize: '0.95rem' }} aria-pressed={sound === s.id} onClick={() => setSound(s.id)}>
              <Icon name={s.icon} size={32} /> {s.label}
            </button>
          ))}
        </div>
      </fieldset>
      <Segmented legend={t('diary.where')} options={PLACES} value={place as (typeof PLACES)[number] | null} onChange={setPlace} labels={(v) => t(`place.${v}`)} />
      <Segmented legend={t('diary.loud')} options={[1, 2, 3] as const} value={loudness as 1 | null} onChange={setLoudness} labels={(v) => t(`diary.loud${v}`)} />
      <Scale04 legend={t('diary.reaction')} value={reaction} onChange={setReaction} words={[t('diary.r0'), t('diary.r1'), t('diary.r2'), t('diary.r3'), t('diary.r4')]} />
      <Segmented legend={t('diary.expected')} options={['yes', 'no'] as const} value={predictable} onChange={setPredictable} labels={(v) => t(`common.${v}`)} />
      <button className="btn primary block" disabled={!ready} onClick={() => {
        repo.push('diary', { id: uid(), at: Date.now(), soundType: sound!, place: place!, loudness: loudness!, reaction: reaction!, predictable: predictable === 'yes' });
        refresh();
        setSound(null); setPlace(null); setLoudness(null); setReaction(null); setPredictable(null); setSaved(true);
      }}>{t('common.save')}</button>
      <p role="status" className="small">{saved ? t('diary.saved', { n: data.diary.length }) : ''}</p>
    </Screen>
  );
}

/** REQ-M5-02 pattern summary with the raw counts shown. */
export function SoundPatterns() {
  const { data, go } = useStore();
  const entries = data.diary;
  const byCount = <K extends string>(key: (e: (typeof entries)[number]) => K) => {
    const m = new Map<K, number>();
    for (const e of entries) m.set(key(e), (m.get(key(e)) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const sounds = byCount((e) => e.soundType);
  const places = byCount((e) => e.place);
  const hard = entries.filter((e) => e.reaction >= 3);
  const unexpectedHard = hard.filter((e) => !e.predictable).length;
  const label = (id: string) => SOUND_TYPES.find((s) => s.id === id)?.label ?? id;
  return (
    <Screen title={t('sound.patterns')} onBack={() => go('sound')}>
      {entries.length < 7 && <p className="notice">{t('patterns.needMore', { n: entries.length })}</p>}
      <h2>{t('patterns.sounds')}</h2>
      <table><thead><tr><th>{t('patterns.sound')}</th><th>{t('patterns.times')}</th><th>{t('patterns.hard')}</th></tr></thead>
        <tbody>{sounds.map(([s, n]) => <tr key={s}><td>{label(s)}</td><td>{n}</td><td>{entries.filter((e) => e.soundType === s && e.reaction >= 3).length}</td></tr>)}</tbody></table>
      <h2>{t('patterns.places')}</h2>
      <table><thead><tr><th>{t('patterns.place')}</th><th>{t('patterns.times')}</th></tr></thead>
        <tbody>{places.map(([p, n]) => <tr key={p}><td>{t(`place.${p}`)}</td><td>{n}</td></tr>)}</tbody></table>
      <h2>{t('patterns.what')}</h2>
      <p>{t('patterns.summary', { hard: hard.length, total: entries.length, unexpected: unexpectedHard })}</p>
      {unexpectedHard > 0 && <p className="card calm">{claimById('C-024')!.text} <button className="btn quiet" onClick={() => go('sound/countdown')}>{t('sound.countdown')}</button></p>}
    </Screen>
  );
}

/** REQ-M5-03 silent visual countdown the child can start. */
export function Countdown({ child }: { child?: boolean }) {
  const { go } = useStore();
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    if (n === null || n === 0) return;
    const id = window.setTimeout(() => setN(n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [n]);
  return (
    <Screen title={t('sound.countdown')} onBack={child ? undefined : () => go('sound')}>
      <p className="muted">{t('countdown.body')}</p>
      <div className="countdown" aria-live="polite" aria-atomic="true">{n === null ? '3' : n === 0 ? t('countdown.now') : n}</div>
      <button className="btn primary block" onClick={() => setN(3)}>{t('countdown.start')}</button>
    </Screen>
  );
}

/** REQ-M5-04 full-screen "too loud" signal card. */
export function TooLoudCard({ onClose }: { onClose: () => void }) {
  useEffect(() => { engine.stopAll('too-loud-card'); }, []);
  return (
    <div className="toolong" role="alertdialog" aria-label={t('tooLoud.aria')}>
      <Icon name="stop" size={96} />
      <div>{t('tooLoud.text')}</div>
      <button className="btn" onClick={onClose}>{t('common.close')}</button>
    </div>
  );
}

export function TooLoudScreen() {
  const { go } = useStore();
  return <TooLoudCard onClose={() => go('sound')} />;
}

export function Strategies() {
  const { go } = useStore();
  const ids = ['C-023', 'C-024', 'C-025', 'C-026', 'C-027', 'C-028', 'C-029', 'C-030', 'C-020', 'C-022', 'C-031'];
  const edu = EDUCATION.find((e) => e.id === 'edu-sound-strategies')!;
  return (
    <Screen title={t('sound.strategies')} onBack={() => go('sound')}>
      <p>{edu.body[0]}</p>
      <ul className="list">
        {ids.map((id) => {
          const c = claimById(id)!;
          return <li key={id} className="card"><TierChip tier={c.tier} consensus={c.tier === 'Verified'} /> <p style={{ margin: '6px 0 0' }}>{c.text}</p><span className="small muted">{t('activities.source', { s: c.sections.join(', ') })}</span></li>;
        })}
      </ul>
    </Screen>
  );
}

// ---- Graded exposure (REQ-M5-05, REQ-SAF-05, REQ-SAF-06) ------------------------------------------------
type Synth = 'hum' | 'whirr' | 'beep' | 'bell';
/** Recording key and plan sound ID for the family's own recording of the difficult sound. */
export const OWN_SOUND = 'own-recording';

export function Exposure() {
  const { data, repo, refresh, go } = useStore();
  const [hasOwn, setHasOwn] = useState(false);
  const [recording, setRecording] = useState<AbortController | null>(null);
  useEffect(() => { loadRecording(OWN_SOUND).then((b) => setHasOwn(!!b)).catch(() => setHasOwn(false)); }, []);
  // Built-in practice sounds, plus the family's own recording of the difficult sound once made (C-026, L-03).
  const practice: { id: string; label: string; synth?: Synth }[] = [
    ...SOUND_TYPES.filter((s) => s.synth).map((s) => ({ id: s.id, label: s.label, synth: s.synth as Synth })),
    ...(hasOwn ? [{ id: OWN_SOUND, label: t('exposure.ownLabel') }] : []),
  ];
  const [soundId, setSoundId] = useState<string>(data.plans[0]?.soundId ?? practice[0]!.id);
  const [present, setPresent] = useState(false);
  const [session, setSession] = useState<ExposureSession | null>(null);
  const [msg, setMsg] = useState('');
  const plan: ExposurePlan = useMemo(() => data.plans.find((p) => p.soundId === soundId) ?? createPlan(`plan-${soundId}`, soundId), [data.plans, soundId]);
  const now = Date.now();
  const locked = isLocked(plan, now);
  const synth = practice.find((s) => s.id === soundId)?.synth;

  // Exposure always runs under the Child Mode policy (mono, lower ceiling); restored on leave.
  useEffect(() => {
    engine.setMode('child', data.settings.childVolumeDb);
    return () => { engine.stopAll('exposure-leave'); engine.setMode('parent', data.settings.parentVolumeDb); };
  }, [data.settings.childVolumeDb, data.settings.parentVolumeDb]);

  const persist = (p: ExposurePlan, s: ExposureSession | null) => {
    repo.savePlan(p);
    if (s?.ended) {
      repo.push('exposureSessions', { planId: p.id, startedAt: s.startedAt, endedAt: Date.now(), levelDb: s.levelDb, distress: [...s.distress], outcome: s.ended });
      if (s.ended !== 'completed') repo.audit('exposure.stopped', { reason: s.ended, levelDb: s.levelDb });
    }
    refresh();
  };

  const start = () => {
    const r = startSession(plan, { caregiverPresent: present, consentGranted: repo.canStore, now: Date.now() });
    if (!r.ok) { setMsg(t(`exposure.refused.${r.reason}`)); return; }
    setSession(r.session);
    setMsg('');
    if (synth) engine.playExposure(synth, playbackLevelDb(r.session));
    else void loadRecording(OWN_SOUND).then((b) => b && engine.playExposureRecording(b, playbackLevelDb(r.session)));
    repo.audit('exposure.started', { levelDb: r.session.levelDb });
    refresh();
  };

  const stopByChild = () => {
    if (!session) return;
    engine.stopAll('exposure-child');
    const r = childStop(plan, session, Date.now());
    persist(r.plan, r.session);
    setSession(null);
    setMsg(t('exposure.stopped'));
  };

  const rate = (v: number) => {
    if (!session) return;
    const r = recordDistress(plan, session, v, Date.now());
    if (r.mustStop) {
      engine.stopAll('exposure-distress');
      persist(r.plan, r.session);
      setSession(null);
      setMsg(t('exposure.stoppedDistress'));
    } else {
      setSession(r.session);
    }
  };

  const finish = (stepUp: boolean) => {
    if (!session) return;
    engine.stopAll('exposure-complete');
    let p = plan, s = session;
    if (stepUp) {
      const up = acceptStepUp(p, s, Date.now());
      p = up.plan; s = up.session;
      if (up.applied) repo.audit('exposure.stepup', { levelDb: p.currentLevelDb });
    }
    const done = completeSession(p, s);
    persist(done.plan, done.session);
    setSession(null);
    setMsg(stepUp ? t('exposure.doneUp') : t('exposure.done'));
  };

  // Sessions end automatically after the maximum length (REQ-SAF-05); the engine also stops the sound itself.
  useEffect(() => {
    if (!session) return;
    const id = window.setTimeout(() => finish(false), Math.max(0, EXPOSURE.maxSessionMs - (Date.now() - session.startedAt)));
    return () => window.clearTimeout(id);
  });

  const recordOwn = async () => {
    if (!repo.canStore) { setMsg(t('routines.needConsent')); return; }
    engine.stopAll('recording');
    const ctrl = new AbortController();
    setRecording(ctrl);
    setMsg(t('routines.recordingNow'));
    try {
      await saveRecording(OWN_SOUND, await record(20_000, ctrl.signal));
      repo.update('recordings', [...data.recordings.filter((x) => x.routineId !== OWN_SOUND), { routineId: OWN_SOUND, peak: 0, savedAt: Date.now() }]);
      refresh();
      setHasOwn(true);
      setSoundId(OWN_SOUND);
      setMsg(t('exposure.ownSaved'));
    } catch {
      setMsg(t('routines.micError'));
    } finally {
      setRecording(null);
    }
  };

  const check = session ? canStepUp(plan, session, Date.now()) : null;
  const step = Math.round((plan.currentLevelDb - EXPOSURE.startDb) / plan.stepDb) + 1;

  return (
    <div>
      {session && <StopBar onStop={stopByChild} />}
      <Screen title={t('sound.exposure')} onBack={session ? undefined : () => go('sound')}>
        <div className="notice"><p style={{ margin: 0 }}>{claimById('C-026')!.text}</p></div>
        <h2>{t('exposure.rules')}</h2>
        <ul className="small">
          <li>{t('exposure.rule1')}</li>
          <li>{t('exposure.rule2', { step: plan.stepDb })}</li>
          <li>{t('exposure.rule3')}</li>
          <li>{t('exposure.rule4')}</li>
        </ul>
        {!session && (
          <>
            <Segmented legend={t('exposure.pick')} options={practice.map((p) => p.id)} value={soundId} onChange={setSoundId} labels={(v) => practice.find((p) => p.id === v)!.label} />
            <details className="card">
              <summary>{t('exposure.ownTitle')}</summary>
              <p className="small">{t('exposure.ownBody')}</p>
              {canRecord() && !recording && <button className="btn" onClick={() => void recordOwn()}>{hasOwn ? t('exposure.ownReRecord') : t('exposure.ownRecord')}</button>}
              {recording && <button className="btn danger" onClick={() => recording.abort()}>{t('routines.stopRecording')}</button>}
            </details>
            <p data-testid="exposure-level">{t('exposure.level', { step: Math.max(1, step), db: plan.currentLevelDb })}</p>
            {locked && <p className="notice" role="alert">{t('exposure.locked')}</p>}
            <label className="check"><input type="checkbox" checked={present} onChange={(e) => setPresent(e.target.checked)} /> {t('exposure.present')}</label>
            <button className="btn primary block" disabled={!present || locked} onClick={start}><Icon name="play" /> {t('exposure.play')}</button>
          </>
        )}
        {session && (
          <div className="card calm">
            <p aria-live="polite"><strong>{t('exposure.playing', { db: session.levelDb })}</strong></p>
            <Scale04 legend={t('exposure.checkin')} value={session.distress.length ? session.distress[session.distress.length - 1]! : null} onChange={rate}
              words={[t('diary.r0'), t('diary.r1'), t('diary.r2'), t('diary.r3'), t('diary.r4')]} />
            <div className="row">
              <button className="btn" onClick={() => finish(false)}>{t('exposure.stayHere')}</button>
              <button className="btn primary" disabled={!check?.allowed} onClick={() => finish(true)}>{t('exposure.stepUp')}</button>
            </div>
            {check && !check.allowed && <p className="small muted">{t(`exposure.why.${check.reason}`)}</p>}
          </div>
        )}
        <p role="status">{msg}</p>
      </Screen>
    </div>
  );
}
