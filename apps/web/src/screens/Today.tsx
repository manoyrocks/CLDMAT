// Today (REQ-AI-01) and the Guided Session Player (REQ-M2-01, REQ-M2-02, REQ-M2-03).
import { useEffect, useMemo, useState } from 'react';
import { activityById } from '@harmony/content';
import { planNotes, recommend } from '@harmony/ai';
import { engine } from '../audio/engine';
import { Icon } from '../components/Icon';
import { PlayButton, Screen, Segmented, TierChip } from '../components/ui';
import { FEATURES } from '../lib/features';
import { t } from '../lib/i18n';
import { today, uid, useStore } from '../lib/store';

export function usePlan() {
  const { data } = useStore();
  return useMemo(() => {
    const p = data.profile;
    if (!p) return { recs: [], notes: [] as string[] };
    const since = Date.now() - 2 * 86_400_000;
    const recent = data.sessions.filter((s) => s.at >= since).flatMap((s) => s.activityIds);
    const goalIds = data.goals.filter((g) => g.active).map((g) => g.templateId);
    return {
      recs: recommend({ ageBand: p.ageBand, communication: p.communication, goalTemplateIds: goalIds, liked: p.liked, disliked: p.disliked, recent }),
      notes: planNotes(goalIds),
    };
  }, [data.profile, data.sessions, data.goals]);
}

export function Today() {
  const { data, go, enterChildMode } = useStore();
  const { recs, notes } = usePlan();
  const minutes = recs.reduce((s, r) => s + r.minutes, 0);
  const weekAgo = Date.now() - 7 * 86_400_000;
  const thisWeek = data.sessions.filter((s) => s.at >= weekAgo && s.together).length;
  return (
    <Screen title={t('today.title', { name: data.profile?.nickname ?? '' })}>
      <p className="muted">{t('today.together', { n: thisWeek })}</p>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t('today.planTitle', { n: minutes })}</h2>
        <ul className="list">
          {recs.map((r) => {
            const a = activityById(r.activityId)!;
            return (
              <li key={r.activityId}>
                <button className="card" onClick={() => go(`activities/${a.id}`)}>
                  <strong>{a.title}</strong> · {t('common.minutes', { n: a.minutes })} <TierChip tier={a.tier} />
                  <div className="small muted">{t('today.why')} {r.reasons.slice(0, 2).join(' · ')}</div>
                </button>
              </li>
            );
          })}
        </ul>
        {notes.map((n) => (
          <p key={n} className="small">{n} <button className="btn quiet" onClick={() => go('routines')}>{t('nav.routines')}</button></p>
        ))}
        <button className="btn primary block" onClick={() => go('session')} disabled={!recs.length}>{t('today.start')}</button>
      </div>
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn" onClick={() => (data.settings.headphoneNoticeSeen ? enterChildMode() : go('childnotice'))}><Icon name="child" /> {t('today.childMode')}</button>
        {FEATURES.coach && <button className="btn" onClick={() => go('coach')}><Icon name="chat" /> {t('today.coach')}</button>}
        <button className="btn" onClick={() => go('routines')}><Icon name="day" /> {t('nav.routines')}</button>
      </div>
    </Screen>
  );
}

/** Builds the step list: each activity contributes its cue cards and pause prompt. */
function steps(ids: string[]) {
  return ids.flatMap((id) => {
    const a = activityById(id)!;
    return [...a.cueCards.map((c) => ({ id, text: c, pause: /pause|wait|freeze/i.test(c) })), { id, text: a.pauseCue, pause: true }];
  });
}

export function SessionPlayer() {
  const { repo, refresh, go } = useStore();
  const { recs } = usePlan();
  const ids = useMemo(() => recs.map((r) => r.activityId), [recs]);
  const [plan] = useState(ids);
  const list = useMemo(() => steps(plan), [plan]);
  const [i, setI] = useState(0);
  const [startedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [together, setTogether] = useState<'yes' | 'no' | null>(null);
  const [engagement, setEngagement] = useState<number | null>(null);
  const [played, setPlayed] = useState<string[]>(plan);

  useEffect(() => {
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);
  useEffect(() => () => engine.stopAll('session-end'), []);

  if (!plan.length) return <Screen title={t('session.title')}><p>{t('session.noPlan')}</p></Screen>;

  if (done) {
    // REQ-M2-03 participation log in 30 seconds or less.
    return (
      <Screen title={t('session.logTitle')}>
        <p className="muted">{t('session.logBody')}</p>
        <Segmented legend={t('session.together')} options={['yes', 'no'] as const} value={together} onChange={setTogether} labels={(v) => t(`common.${v}`)} />
        <fieldset>
          <legend>{t('session.which')}</legend>
          {plan.map((id) => (
            <label key={id} className="check"><input type="checkbox" checked={played.includes(id)} onChange={(e) => setPlayed((c) => (e.target.checked ? [...c, id] : c.filter((x) => x !== id)))} /> {activityById(id)!.title}</label>
          ))}
        </fieldset>
        <Segmented legend={t('session.engagement')} options={[0, 1, 2, 3] as const} value={engagement as 0 | null} onChange={setEngagement} labels={(v) => t(`session.eng${v}`)} />
        <button className="btn primary block" disabled={together === null || engagement === null} onClick={() => {
          const minutes = Math.max(1, Math.round(elapsed / 60));
          repo.push('sessions', { id: uid(), date: today(), at: Date.now(), activityIds: played, minutes, together: together === 'yes', engagement: engagement! });
          repo.audit('session.logged', { minutes, activities: played.length });
          refresh();
          go('today');
        }}>{t('common.save')}</button>
        <p className="small muted" style={{ marginTop: 12 }}>{t('session.anyDay')}</p>
      </Screen>
    );
  }

  const step = list[i]!;
  const a = activityById(step.id)!;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return (
    <Screen title={a.title}>
      <p className="muted">{t('session.step', { i: i + 1, n: list.length })} · <span aria-label={t('session.elapsed')}>{mm}:{ss}</span></p>
      <div className={`card ${step.pause ? 'calm' : ''}`} aria-live="polite">
        <p className="cue">{step.text}</p>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <PlayButton audio={a.example} />
      </div>
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>{t('common.back')}</button>
        {i < list.length - 1
          ? <button className="btn primary" onClick={() => setI(i + 1)}>{t('common.next')}</button>
          : <button className="btn primary" onClick={() => { engine.stopAll('session-end'); setDone(true); }}>{t('session.finish')}</button>}
      </div>
      <p style={{ marginTop: 16 }}><button className="btn quiet" onClick={() => { engine.stopAll('session-end'); setDone(true); }}>{t('session.end')}</button></p>
    </Screen>
  );
}
