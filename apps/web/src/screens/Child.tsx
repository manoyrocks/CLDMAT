// Child Mode (REQ-M7-01, REQ-M7-02, REQ-M4-01, REQ-M4-02, REQ-M4-03, REQ-M3-02, REQ-M5-03, REQ-M5-04, REQ-SAF-04, REQ-SAF-08).
// No reading needed; every screen has the Stop bar; exit only through the parental gate.
import { useEffect, useState } from 'react';
import { ROUTINES, SONGS } from '@harmony/content';
import { engine } from '../audio/engine';
import { loadRecording } from '../audio/recordings';
import { Icon } from '../components/Icon';
import { GateDialog, GrownUpsButton, PictureCard, StopBar, VolumeControl, useEngineState } from '../components/ui';
import { t } from '../lib/i18n';
import { useStore } from '../lib/store';
import { Countdown, TooLoudCard } from './Sound';

export function ChildMode({ view }: { view: string }) {
  const { go, repo, refresh, exitChildMode } = useStore();
  const [quiet, setQuiet] = useState(false);
  const [gate, setGate] = useState(false);

  // Escape does nothing in Child Mode (REQ-SAF-08).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') e.preventDefault(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="child-app">
      <StopBar onStop={() => setQuiet(true)} />
      <main id="main" className="child-main">
        {quiet ? (
          <div style={{ textAlign: 'center' }}>
            <h1 tabIndex={-1}>{t('child.quiet')}</h1>
            <p>{t('child.quietBody')}</p>
            <div className="cards" style={{ gridTemplateColumns: '1fr' }}>
              <PictureCard icon="home" label={t('child.backHome')} onSelect={() => { setQuiet(false); go('child/home'); }} />
            </div>
          </div>
        ) : (
          <ChildView view={view} />
        )}
      </main>
      <GrownUpsButton onHeld={() => { engine.stopAll('gate'); setGate(true); }} />
      {gate && (
        <GateDialog onCancel={() => setGate(false)}
          onFail={(attempt, locked) => { try { repo.audit(locked ? 'gate.locked' : 'gate.failed', locked ? {} : { attempt }); refresh(); } catch { /* best-effort */ } }}
          onPass={() => { setGate(false); exitChildMode(); }} />
      )}
    </div>
  );
}

function ChildView({ view }: { view: string }) {
  const { go } = useStore();
  const home = () => go('child/home');
  const Back = () => (
    <div className="child-back">
      <button className="btn quiet" onClick={home} aria-label={t('child.backHome')}><Icon name="home" size={32} /></button>
    </div>
  );
  switch (view) {
    case 'drum': case 'shaker': case 'bells': return <><Back /><Instrument kind={view} /></>;
    case 'songs': return <><Back /><Songs /></>;
    case 'calm': return <><Back /><Calm /></>;
    case 'day': return <><Back /><MyDay /></>;
    case 'countdown': return <><Back /><Countdown child /></>;
    case 'tooloud': return <TooLoudCard onClose={home} />;
    default: return <ChildHome />;
  }
}

function ChildHome() {
  const { go } = useStore();
  const cards: [string, string, string][] = [
    ['drum', 'drum', t('child.drum')], ['shaker', 'shaker', t('child.shaker')], ['bells', 'bells', t('child.bells')],
    ['songs', 'song', t('child.songs')], ['calm', 'calm', t('child.calm')], ['day', 'day', t('child.day')],
    ['countdown', 'countdown', t('child.countdown')], ['tooloud', 'stop', t('child.tooLoud')],
  ];
  return (
    <>
      <h1 className="sr-only" tabIndex={-1}>{t('child.home')}</h1>
      <div className="cards">
        {cards.map(([v, icon, label]) => <PictureCard key={v} icon={icon} label={label} onSelect={() => go(`child/${v}`)} />)}
      </div>
    </>
  );
}

/** Interactive instrument: sound only on the child's own taps (REQ-SAF-02); first tap fades in (REQ-SAF-03). */
function Instrument({ kind }: { kind: 'drum' | 'shaker' | 'bells' }) {
  const [taps, setTaps] = useState(0);
  return (
    <>
      <h1 className="sr-only" tabIndex={-1}>{t(`child.${kind}`)}</h1>
      <button className="pad" data-testid="pad" onPointerDown={(e) => { e.preventDefault(); engine.hit(kind); setTaps((n) => n + 1); }}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); engine.hit(kind); setTaps((n) => n + 1); } }}
        aria-label={t('child.tapToPlay', { what: t(`child.${kind}`) })}>
        <Icon name={kind} size={120} />
        <span aria-hidden="true">{taps > 0 ? '♪' : ''}</span>
      </button>
    </>
  );
}

/** REQ-M7-01, REQ-M7-02 picture choice of songs; sound only plays on a tap. */
function Songs() {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <>
      <h1 className="sr-only" tabIndex={-1}>{t('child.songs')}</h1>
      <div className="cards">
        {SONGS.filter((s) => !s.calm).map((s) => (
          <PictureCard key={s.id} icon={s.icon} label={s.title} speaker pressed={chosen === s.id}
            onSelect={() => { engine.stopAll('song-change'); setChosen(s.id); window.setTimeout(() => engine.play(s.audio), 80); }} />
        ))}
      </div>
    </>
  );
}

/** REQ-M4-01, REQ-M4-02, REQ-M4-03 Calm corner: child-chosen playlist, slow visual, child volume within the ceiling. */
function Calm() {
  const { data, repo, refresh } = useStore();
  useEngineState();
  const calm = SONGS.filter((s) => s.calm);
  const playlist = data.profile?.calmPlaylist ?? [];
  const toggle = (id: string) => {
    if (!data.profile || !repo.canStore) return;
    const next = playlist.includes(id) ? playlist.filter((x) => x !== id) : [...playlist, id];
    repo.update('profile', { ...data.profile, calmPlaylist: next });
    refresh();
  };
  const play = () => {
    const tracks = calm.filter((s) => playlist.includes(s.id));
    const first = tracks[0] ?? calm[0]!;
    engine.play(first.audio, { loops: 4 });
  };
  return (
    <>
      <h1 className="sr-only" tabIndex={-1}>{t('child.calm')}</h1>
      <div className="cards" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {calm.map((s) => <PictureCard key={s.id} icon={s.icon} label={s.title} pressed={playlist.includes(s.id)} onSelect={() => toggle(s.id)} />)}
      </div>
      <div className={`sway ${engine.playing ? 'moving' : ''}`} aria-hidden="true" />
      <VolumeControl mode="child" valueDb={data.settings.childVolumeDb} onChange={(db) => { repo.updateSettings({ childVolumeDb: db }); refresh(); }} />
      <div className="cards" style={{ gridTemplateColumns: '1fr', marginTop: 16 }}>
        <PictureCard icon="play" label={t('child.play')} speaker onSelect={play} />
      </div>
    </>
  );
}

/** REQ-M3-02 visual schedule with the routine's song (or the caregiver's recording, REQ-M3-03). */
function MyDay() {
  const [id, setId] = useState<string | null>(null);
  const r = ROUTINES.find((x) => x.id === id);
  if (!r) {
    return (
      <>
        <h1 className="sr-only" tabIndex={-1}>{t('child.day')}</h1>
        <div className="cards">{ROUTINES.map((x) => <PictureCard key={x.id} icon={x.icon} label={x.title} onSelect={() => setId(x.id)} />)}</div>
      </>
    );
  }
  const playSong = async () => {
    const rec = await loadRecording(r.id).catch(() => undefined);
    if (rec) await engine.playRecording(rec); else engine.play(r.song);
  };
  return (
    <>
      <h1 tabIndex={-1} style={{ textAlign: 'center' }}>{r.title}</h1>
      <ol className="cards" style={{ listStyle: 'none', padding: 0 }}>
        {r.schedule.map((s, i) => (
          <li key={s.label} className="picture" style={{ cursor: 'default' }}><span aria-hidden="true">{i + 1}</span><Icon name={s.icon} size={56} />{s.label}</li>
        ))}
      </ol>
      <div className="cards" style={{ gridTemplateColumns: '1fr', marginTop: 16 }}>
        <PictureCard icon="song" label={t('child.sing')} speaker onSelect={() => void playSong()} />
      </div>
    </>
  );
}

/** First Child Mode entry: headphone safety notice for the caregiver (REQ-SAF-10). */
export function ChildModeNotice() {
  const { repo, refresh, enterChildMode, go } = useStore();
  return (
    <section>
      <h1 tabIndex={-1}>{t('childNotice.title')}</h1>
      <p className="notice">{t('childNotice.headphones')}</p>
      <ul>
        <li>{t('childNotice.stop')}</li>
        <li>{t('childNotice.exit')}</li>
        <li>{t('childNotice.pin')}</li>
      </ul>
      <div className="row">
        <button className="btn primary" onClick={() => { repo.updateSettings({ headphoneNoticeSeen: true }); refresh(); enterChildMode(); }}>{t('childNotice.start')}</button>
        <button className="btn quiet" onClick={() => go('today')}>{t('common.cancel')}</button>
      </div>
    </section>
  );
}
