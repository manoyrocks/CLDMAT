// Evidence & Education Hub (REQ-M8-01, REQ-M8-02, REQ-M8-03, REQ-M8-04), red-flag checker (REQ-M8-02), choosing a therapist (REQ-M9-01).
import { useState } from 'react';
import {
  CREDENTIAL_BODIES, EDUCATION, RED_FLAG_QUESTIONS, THERAPIST_QUESTIONS, educationById, evaluateRedFlags, type RedFlagAnswer,
} from '@harmony/content';
import { Icon } from '../components/Icon';
import { Disclaimer, Screen, Segmented, TierChip } from '../components/ui';
import { t } from '../lib/i18n';
import { useStore } from '../lib/store';

export function LearnHub() {
  const { go } = useStore();
  const group = (cat: string) => EDUCATION.filter((e) => e.category === cat);
  const Section = ({ cat, title }: { cat: string; title: string }) => (
    <section>
      <h2>{title}</h2>
      <ul className="list">
        {group(cat).map((e) => (
          <li key={e.id}><button className="card" onClick={() => go(`learn/${e.id}`)}><strong>{e.title}</strong> <TierChip tier={e.tier} /></button></li>
        ))}
      </ul>
    </section>
  );
  return (
    <Screen title={t('learn.title')}>
      <Disclaimer />
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn primary" onClick={() => go('learn/check')}><Icon name="target" /> {t('learn.checker')}</button>
        <button className="btn" onClick={() => go('learn/therapist')}>{t('learn.therapist')}</button>
        <button className="btn" onClick={() => go('coach')}><Icon name="chat" /> {t('today.coach')}</button>
      </div>
      <Section cat="about" title={t('learn.about')} />
      <Section cat="tiers" title={t('learn.tiers')} />
      <Section cat="interventions" title={t('learn.interventions')} />
      <Section cat="unverified" title={t('learn.unverified')} />
    </Screen>
  );
}

export function LearnEntry({ id }: { id: string }) {
  const { go } = useStore();
  const e = educationById(id);
  if (!e) return <Screen title={t('common.notFound')}><p /></Screen>;
  return (
    <Screen title={e.title} onBack={() => go('learn')}>
      <p><TierChip tier={e.tier} /> <span className="small muted">{t('activities.source', { s: e.sections.join(', ') })}</span></p>
      {e.deliveredBy && <p className="small">{t('learn.deliveredBy', { who: e.deliveredBy })}</p>}
      {e.body.map((p) => <p key={p}>{p}</p>)}
      {e.category === 'unverified' && <p className="notice">{t('learn.notOffered')}</p>}
      {e.id === 'edu-choose-therapist' && <button className="btn" onClick={() => go('learn/therapist')}>{t('learn.therapist')}</button>}
    </Screen>
  );
}

export function RedFlagChecker() {
  const { go } = useStore();
  const [answers, setAnswers] = useState<Record<string, RedFlagAnswer>>({});
  const [show, setShow] = useState(false);
  const verdict = evaluateRedFlags(answers);
  return (
    <Screen title={t('learn.checker')} onBack={() => go('learn')}>
      <p>{t('redflags.intro')}</p>
      {RED_FLAG_QUESTIONS.map((q) => (
        <Segmented key={q.id} legend={q.text} options={['yes', 'no', 'unsure'] as const} value={answers[q.id] ?? null}
          onChange={(v) => { setAnswers((a) => ({ ...a, [q.id]: v })); setShow(false); }} labels={(v) => t(`common.${v}`)} />
      ))}
      <button className="btn primary block" onClick={() => setShow(true)}>{t('redflags.check')}</button>
      {show && (
        <div className="card" role="status" style={{ marginTop: 12 }}>
          <h2 style={{ marginTop: 0 }}>{t(`redflags.level.${verdict.level}`)}</h2>
          <p>{t('redflags.counts', { flags: verdict.flags, unsure: verdict.unsure })}</p>
          <p>{verdict.message}</p>
          <ul>{verdict.learnIds.map((id) => <li key={id}><button className="btn quiet" onClick={() => go(`learn/${id}`)}>{educationById(id)!.title}</button></li>)}</ul>
        </div>
      )}
    </Screen>
  );
}

export function TherapistGuide() {
  const { go } = useStore();
  const e = educationById('edu-choose-therapist')!;
  return (
    <Screen title={t('learn.therapist')} onBack={() => go('learn')}>
      {e.body.map((p) => <p key={p}>{p}</p>)}
      <h2>{t('therapist.questions')}</h2>
      <ol>{THERAPIST_QUESTIONS.map((q) => <li key={q}>{q}</li>)}</ol>
      <p className="notice">{educationById('edu-red-flags')!.body[2]}</p>
      <h2>{t('therapist.bodies')}</h2>
      <p className="small muted">{t('therapist.noRankings')}</p>
      <ul className="list">
        {CREDENTIAL_BODIES.map((b) => (
          <li key={b.region} className="card"><strong>{b.region}</strong><br />{b.url ? <ExternalLink href={b.url} label={b.name} /> : b.name}</li>
        ))}
      </ul>
    </Screen>
  );
}

/** External links are adult-only, open in a new tab, and are never reachable from Child Mode (T-17). */
function ExternalLink({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{label} <span className="sr-only">{t('common.opensNewTab')}</span></a>;
}
