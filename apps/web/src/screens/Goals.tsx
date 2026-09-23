// Goals & Progress (REQ-M6-01, REQ-M6-02, REQ-M6-03, REQ-M6-04), with the Progress Summariser (REQ-AI-06).
import { useMemo, useState } from 'react';
import { GOAL_TEMPLATES, SCALE_0_4 } from '@harmony/content';
import { summarise } from '@harmony/ai';
import { Scale04, Screen } from '../components/ui';
import { t } from '../lib/i18n';
import { today, uid, useStore } from '../lib/store';

export function Goals() {
  const { data, repo, refresh, go } = useStore();
  const active = data.goals.filter((g) => g.active);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const loggedToday = data.goalLogs.some((l) => l.date === today());
  const [adding, setAdding] = useState(false);

  return (
    <Screen title={t('goals.title')}>
      {!active.length && <p>{t('goals.none')}</p>}
      {active.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t('goals.logToday')}</h2>
          <p className="small muted">{loggedToday ? t('goals.loggedToday') : t('goals.quick')}</p>
          {active.map((g) => (
            <Scale04 key={g.id} legend={`${g.label}: ${GOAL_TEMPLATES.find((x) => x.id === g.templateId)?.measure ?? ''}`} value={scores[g.id] ?? null} onChange={(v) => setScores((s) => ({ ...s, [g.id]: v }))} />
          ))}
          <label htmlFor="goal-note">{t('goals.note')}</label>
          <input id="goal-note" type="text" maxLength={140} value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn primary block" style={{ marginTop: 12 }} disabled={!Object.keys(scores).length} onClick={() => {
            for (const [goalId, score] of Object.entries(scores)) repo.push('goalLogs', { goalId, date: today(), score, note: note || undefined, at: Date.now() });
            setScores({}); setNote(''); setSaved(true); refresh();
          }}>{t('common.save')}</button>
          <p role="status" className="small">{saved ? t('goals.saved') : ''}</p>
        </div>
      )}
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn" onClick={() => go('goals/review')}>{t('goals.review')}</button>
        {active.length < 3 && <button className="btn quiet" onClick={() => setAdding(true)}>{t('goals.add')}</button>}
      </div>
      {adding && (
        <div className="card" style={{ marginTop: 12 }}>
          <h2 style={{ marginTop: 0 }}>{t('goals.add')}</h2>
          <ul className="list">
            {GOAL_TEMPLATES.filter((g) => !active.some((a) => a.templateId === g.id)).map((g) => (
              <li key={g.id}><button className="card" onClick={() => {
                repo.update('goals', [...data.goals, { id: uid(), templateId: g.id, label: g.label, baseline: 1, target: 3, createdAt: Date.now(), active: true }]);
                refresh(); setAdding(false);
              }}>{g.label}</button></li>
            ))}
          </ul>
        </div>
      )}
      {active.length > 0 && (
        <>
          <h2>{t('goals.yours')}</h2>
          <ul className="list">
            {active.map((g) => (
              <li key={g.id} className="card row" style={{ justifyContent: 'space-between' }}>
                <span>{g.label}<br /><span className="small muted">{t('goals.baseTarget', { b: SCALE_0_4[g.baseline]!, t: SCALE_0_4[g.target]! })}</span></span>
                <button className="btn quiet" onClick={() => { repo.update('goals', data.goals.map((x) => (x.id === g.id ? { ...x, active: false } : x))); refresh(); }}>{t('goals.archive')}</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Screen>
  );
}

/** REQ-M6-03 review with raw counts; REQ-M6-04 caregiver edits before sharing. */
export function Review() {
  const { data, repo, go } = useStore();
  const end = today();
  const first = [...data.goalLogs.map((l) => l.date), ...data.sessions.map((s) => s.date)].sort()[0] ?? end;
  const start = new Date(Math.max(Date.parse(first), Date.parse(end) - 84 * 86_400_000)).toISOString().slice(0, 10);
  const review = useMemo(() => summarise(data.goals.filter((g) => g.active), data.goalLogs, data.sessions, start, end), [data.goals, data.goalLogs, data.sessions, start, end]);
  const [text, setText] = useState(review.text);
  const [copied, setCopied] = useState('');
  const full = `${t('review.heading', { start, end })}\n\n${text}\n\n${review.rawTable}`;
  const download = () => {
    const url = URL.createObjectURL(new Blob([full], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url; a.download = `harmonypath-review-${end}.txt`; a.click();
    URL.revokeObjectURL(url);
    repo.audit('data.exported', { entities: 1 });
  };
  return (
    <Screen title={t('review.title')} onBack={() => go('goals')}>
      <p className="muted">{review.inWindow ? t('review.inWindow') : t('review.early', { w: review.weeks })}</p>
      <label htmlFor="review-text">{t('review.edit')}</label>
      <textarea id="review-text" value={text} onChange={(e) => setText(e.target.value)} />
      <h2>{t('review.raw')}</h2>
      <pre className="card small" style={{ whiteSpace: 'pre-wrap' }} data-testid="raw-counts">{review.rawTable}</pre>
      <div className="row">
        <button className="btn" onClick={async () => { try { await navigator.clipboard.writeText(full); setCopied(t('review.copied')); } catch { setCopied(t('review.copyFailed')); } }}>{t('review.copy')}</button>
        <button className="btn" onClick={() => window.print()}>{t('review.print')}</button>
        <button className="btn primary" onClick={download}>{t('review.download')}</button>
      </div>
      <p role="status" className="small">{copied}</p>
    </Screen>
  );
}
