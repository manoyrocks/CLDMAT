// Caregiver Coach chat (REQ-AI-02, REQ-AI-03, REQ-AI-04, REQ-AI-05, REQ-AI-08). Offline grounded-extractive mode; LLM mode is opt-in
// and needs the backend proxy (ADR-0005), which the MVP does not ship.
import { useEffect, useRef, useState } from 'react';
import { askOffline, type CoachReply } from '@harmony/ai';
import { crisisLinesFor, passageById } from '@harmony/content';
import { Screen } from '../components/ui';
import { t } from '../lib/i18n';
import { useStore } from '../lib/store';

interface Turn { q: string; r: CoachReply }

export function Coach() {
  const { data, repo, refresh } = useStore();
  const [q, setQ] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [turns]);

  const send = () => {
    const question = q.trim();
    if (!question) return;
    const r = askOffline(question, { region: data.settings.region });
    if (r.kind === 'escalation') repo.audit('coach.escalated', { category: 'crisis' });
    if (r.kind === 'refusal' && r.category) repo.audit('coach.refused', { category: r.category });
    refresh();
    setTurns((cur) => [...cur, { q: question, r }]);
    setQ('');
  };

  return (
    <Screen title={t('coach.title')}>
      <p className="notice">{t('coach.disclosure')}</p>
      {/* Always visible, independent of the classifier: a crisis the lexicon misses still sees where to get help (DEF-010). */}
      <p className="small" data-testid="emergency-line"><strong>{t('coach.emergency', { number: crisisLinesFor(data.settings.region).emergency })}</strong></p>
      <div className="chat" aria-live="polite">
        {turns.map((turn, i) => (
          <div key={i} className="stack">
            <div className="bubble me"><span className="sr-only">{t('coach.you')}: </span>{turn.q}</div>
            <div className={`bubble ai ${turn.r.kind === 'escalation' ? 'notice' : ''}`} data-kind={turn.r.kind}>
              <span className="sr-only">{t('coach.ai')}: </span>
              <div className="small muted">{turn.r.disclosure}</div>
              {turn.r.text}
              {turn.r.citations.length > 0 && (
                <div className="small muted" style={{ marginTop: 8 }}>
                  {t('coach.sources')}: {turn.r.citations.map((c) => `${c} ${passageById(c)?.title ?? ''} (${passageById(c)?.sections.join(', ') ?? ''})`).join('; ')}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <label htmlFor="coach-q">{t('coach.ask')}</label>
      <textarea id="coach-q" style={{ minHeight: 88 }} maxLength={500} value={q} onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
      <button className="btn primary block" style={{ marginTop: 8 }} onClick={send} disabled={!q.trim()}>{t('coach.send')}</button>
      <p className="small muted" style={{ marginTop: 8 }}>{t('coach.offline')}</p>
    </Screen>
  );
}
