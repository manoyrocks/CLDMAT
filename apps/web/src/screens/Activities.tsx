// Activity library (REQ-M1-01, REQ-M1-02, REQ-M1-03, REQ-M1-04) and routine songs (REQ-M3-01, REQ-M3-02, REQ-M3-03).
import { useEffect, useState } from 'react';
import { ACTIVITIES, GOAL_AREA_LABELS, ROUTINES, activityById, educationById } from '@harmony/content';
import { engine } from '../audio/engine';
import { canRecord, loadRecording, record, saveRecording } from '../audio/recordings';
import { Icon } from '../components/Icon';
import { PlayButton, Screen, TierChip } from '../components/ui';
import { t } from '../lib/i18n';
import { useStore } from '../lib/store';

export function ActivityList() {
  const { go } = useStore();
  const areas = Object.keys(GOAL_AREA_LABELS).filter((g) => ACTIVITIES.some((a) => a.goal === g)) as (keyof typeof GOAL_AREA_LABELS)[];
  return (
    <Screen title={t('activities.title')}>
      <p className="muted">{t('activities.intro')}</p>
      <button className="card warm" onClick={() => go('routines')}><Icon name="day" /> <strong>{t('nav.routines')}</strong><div className="small">{t('routines.intro')}</div></button>
      {areas.map((g) => (
        <section key={g}>
          <h2>{GOAL_AREA_LABELS[g]}</h2>
          <ul className="list">
            {ACTIVITIES.filter((a) => a.goal === g).map((a) => (
              <li key={a.id}>
                <button className="card" onClick={() => go(`activities/${a.id}`)}>
                  <strong>{a.title}</strong> · {t('common.minutes', { n: a.minutes })}
                  <div className="small muted">{a.summary}</div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Screen>
  );
}

export function ActivityDetail({ id }: { id: string }) {
  const { go, data, repo, refresh } = useStore();
  const a = activityById(id);
  if (!a) return <Screen title={t('common.notFound')}><p /></Screen>;
  const learn = educationById(a.learnId);
  const profile = data.profile;
  const liked = profile?.liked.includes(a.id);
  const toggleLike = () => {
    if (!profile) return;
    repo.update('profile', { ...profile, liked: liked ? profile.liked.filter((x) => x !== a.id) : [...profile.liked, a.id], disliked: profile.disliked.filter((x) => x !== a.id) });
    refresh();
  };
  return (
    <Screen title={a.title} onBack={() => go('activities')}>
      <p><TierChip tier={a.tier} /> <span className="small muted">{t('activities.lowRisk')} · {t('activities.source', { s: a.sections.join(', ') })}</span></p>
      <p>{a.summary}</p>
      <p className="small muted">{t('activities.goal')}: {GOAL_AREA_LABELS[a.goal]} · {t('common.minutes', { n: a.minutes })}</p>
      <h2>{t('activities.steps')}</h2>
      <ol>{a.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      <div className="card calm"><strong>{t('activities.pause')}</strong> {a.pauseCue}</div>
      <h2>{t('activities.tips')}</h2>
      <ul>{a.tips.map((s) => <li key={s}>{s}</li>)}</ul>
      <PlayButton audio={a.example} />
      <div className="row" style={{ marginTop: 16 }}>
        {learn && <button className="btn quiet" onClick={() => go(`learn/${learn.id}`)}>{t('activities.why')}: {learn.title}</button>}
        {profile && <button className="btn quiet" aria-pressed={!!liked} onClick={toggleLike}>{liked ? t('activities.liked') : t('activities.like')}</button>}
      </div>
    </Screen>
  );
}

export function RoutineList() {
  const { go } = useStore();
  return (
    <Screen title={t('nav.routines')} onBack={() => go('activities')}>
      <p>{t('routines.intro')}</p>
      <ul className="list">
        {ROUTINES.map((r) => (
          <li key={r.id}><button className="card warm" onClick={() => go(`routines/${r.id}`)}><Icon name={r.icon} /> <strong>{r.title}</strong> <span className="small muted">· {t('routines.tune', { tune: r.tune })}</span></button></li>
        ))}
      </ul>
    </Screen>
  );
}

export function RoutineDetail({ id }: { id: string }) {
  const { go, data, repo, refresh } = useStore();
  const r = ROUTINES.find((x) => x.id === id);
  const [hasRec, setHasRec] = useState(false);
  const [recording, setRecording] = useState<AbortController | null>(null);
  const [msg, setMsg] = useState('');
  useEffect(() => { loadRecording(id).then((b) => setHasRec(!!b)).catch(() => setHasRec(false)); }, [id]);
  if (!r) return <Screen title={t('common.notFound')}><p /></Screen>;

  const startRec = async () => {
    if (!repo.canStore) { setMsg(t('routines.needConsent')); return; }
    engine.stopAll('recording');
    const ctrl = new AbortController();
    setRecording(ctrl);
    setMsg(t('routines.recordingNow'));
    try {
      const blob = await record(20_000, ctrl.signal);
      await saveRecording(r.id, blob);
      repo.update('recordings', [...data.recordings.filter((x) => x.routineId !== r.id), { routineId: r.id, peak: 0, savedAt: Date.now() }]);
      refresh();
      setHasRec(true);
      setMsg(t('routines.saved'));
    } catch {
      setMsg(t('routines.micError'));
    } finally {
      setRecording(null);
    }
  };

  return (
    <Screen title={r.title} onBack={() => go('routines')}>
      <p><TierChip tier={r.tier} /> <span className="small muted">{t('routines.sameSong')}</span></p>
      <h2>{t('routines.schedule')}</h2>
      <ol className="row" style={{ listStyle: 'none', padding: 0 }}>
        {r.schedule.map((s, i) => (
          <li key={s.label} className="card" style={{ textAlign: 'center', minWidth: 96 }}>
            <Icon name={s.icon} size={40} /><div className="small">{i + 1}. {s.label}</div>
          </li>
        ))}
      </ol>
      <h2>{t('routines.song')}</h2>
      <p className="small muted">{t('routines.tune', { tune: r.tune })}</p>
      <div className="card warm">{r.lyrics.map((l) => <div key={l}>{l}</div>)}</div>
      <div style={{ marginTop: 12 }}><PlayButton audio={r.song} label={t('routines.playTune')} /></div>
      <h2>{t('routines.myVoice')}</h2>
      <p className="small muted">{t('routines.myVoiceBody')}</p>
      <div className="row">
        {canRecord() && !recording && <button className="btn" onClick={startRec}>{hasRec ? t('routines.reRecord') : t('routines.record')}</button>}
        {recording && <button className="btn danger" onClick={() => recording.abort()}>{t('routines.stopRecording')}</button>}
        {hasRec && !recording && <button className="btn" onClick={async () => { const b = await loadRecording(r.id); if (b) await engine.playRecording(b); }}><Icon name="play" /> {t('routines.playMine')}</button>}
      </div>
      <p role="status" className="small">{msg}</p>
    </Screen>
  );
}
