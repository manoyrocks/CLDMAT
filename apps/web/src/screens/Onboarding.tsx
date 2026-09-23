// J1 first run: disclaimer (REQ-M8-04) → adult check → consent (REQ-PRV-01) → minimal profile (REQ-PRV-03) → goals (REQ-M6-01).
import { useState } from 'react';
import { GOAL_TEMPLATES, type AgeBand, type Communication } from '@harmony/content';
import { Disclaimer, GateDialog, Screen, Segmented } from '../components/ui';
import { t } from '../lib/i18n';
import { uid, useStore } from '../lib/store';

type Step = 'welcome' | 'consent' | 'profile' | 'goals';

export function Onboarding() {
  const { repo, refresh, go } = useStore();
  const [step, setStep] = useState<Step>('welcome');
  const [gate, setGate] = useState(false);
  const [adultPassed, setAdultPassed] = useState(false);
  const [ack, setAck] = useState(false);
  const [nickname, setNickname] = useState('');
  const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
  const [comm, setComm] = useState<Communication | null>(null);
  const [goals, setGoals] = useState<string[]>([]);

  if (step === 'welcome') {
    return (
      <Screen title={t('onboarding.welcomeTitle')}>
        <p>{t('onboarding.welcomeBody')}</p>
        <ul>
          <li>{t('onboarding.is1')}</li>
          <li>{t('onboarding.is2')}</li>
          <li>{t('onboarding.is3')}</li>
        </ul>
        <Disclaimer />
        <p style={{ marginTop: 16 }}><button className="btn primary block" onClick={() => setStep('consent')}>{t('common.continue')}</button></p>
      </Screen>
    );
  }

  if (step === 'consent') {
    return (
      <Screen title={t('consent.title')}>
        <h2>{t('consent.storedTitle')}</h2>
        <ul>
          <li>{t('consent.stored1')}</li>
          <li>{t('consent.stored2')}</li>
          <li>{t('consent.stored3')}</li>
        </ul>
        <h2>{t('consent.neverTitle')}</h2>
        <ul>
          <li>{t('consent.never1')}</li>
          <li>{t('consent.never2')}</li>
          <li>{t('consent.never3')}</li>
        </ul>
        <p>{t('consent.control')}</p>
        {!adultPassed ? (
          <button className="btn primary block" onClick={() => setGate(true)}>{t('consent.adultCheck')}</button>
        ) : (
          <>
            <p className="notice">{t('consent.adultOk')}</p>
            <label className="check"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /> {t('consent.ack')}</label>
            <button className="btn primary block" disabled={!ack} onClick={() => {
              if (repo.giveConsent(adultPassed, ack)) { refresh(); setStep('profile'); }
            }}>{t('consent.agree')}</button>
          </>
        )}
        {gate && <GateDialog onPass={() => { setAdultPassed(true); setGate(false); }} onCancel={() => setGate(false)} />}
      </Screen>
    );
  }

  if (step === 'profile') {
    return (
      <Screen title={t('profile.title')}>
        <p className="muted">{t('profile.minimal')}</p>
        <label htmlFor="nickname">{t('profile.nickname')}</label>
        <input id="nickname" type="text" maxLength={20} value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="off" />
        <Segmented legend={t('profile.age')} options={['2-4', '5-7', '8-12'] as const} value={ageBand} onChange={setAgeBand} labels={(v) => t(`age.${v}`)} />
        <Segmented legend={t('profile.communication')} options={['speaking', 'some-words', 'minimally-verbal'] as const} value={comm} onChange={setComm} labels={(v) => t(`comm.${v}`)} />
        <button className="btn primary block" disabled={!ageBand || !comm} onClick={() => {
          repo.update('profile', { nickname: nickname.trim().slice(0, 20) || t('profile.defaultName'), ageBand: ageBand!, communication: comm!, liked: [], disliked: [], calmPlaylist: ['calm-waves'] });
          refresh();
          setStep('goals');
        }}>{t('common.continue')}</button>
      </Screen>
    );
  }

  return (
    <Screen title={t('goals.pickTitle')}>
      <p>{t('goals.pickBody')}</p>
      {GOAL_TEMPLATES.map((g) => (
        <label key={g.id} className="check">
          <input type="checkbox" checked={goals.includes(g.id)} disabled={!goals.includes(g.id) && goals.length >= 3}
            onChange={(e) => setGoals((cur) => (e.target.checked ? [...cur, g.id] : cur.filter((x) => x !== g.id)))} />
          {g.label}
        </label>
      ))}
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn primary" onClick={() => {
          repo.update('goals', goals.map((id) => ({ id: uid(), templateId: id, label: GOAL_TEMPLATES.find((g) => g.id === id)!.label, baseline: 1, target: 3, createdAt: Date.now(), active: true })));
          repo.updateSettings({ onboarded: true });
          refresh();
          go('today');
        }}>{goals.length ? t('goals.saveGoals') : t('goals.later')}</button>
      </div>
    </Screen>
  );
}
