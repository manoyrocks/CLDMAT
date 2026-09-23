// Settings: privacy (REQ-PRV-04, 05, 08), accessibility (REQ-NFR-01, 02), audio and region.
import { useState } from 'react';
import { verifyChain } from '@harmony/core';
import { deleteAllRecordings } from '../audio/recordings';
import { GateDialog, Screen, Segmented, VolumeControl } from '../components/ui';
import { t } from '../lib/i18n';
import { useStore } from '../lib/store';
import type { Settings as S } from '../lib/types';

export function Settings() {
  const { data, repo, refresh, go } = useStore();
  const s = data.settings;
  const [gateFor, setGateFor] = useState<'delete' | 'withdraw' | null>(null);
  const [msg, setMsg] = useState('');
  const set = (patch: Partial<S>) => { repo.updateSettings(patch); refresh(); };

  const exportData = () => {
    const json = repo.exportAll();
    refresh();
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'harmonypath-data.json'; a.click();
    URL.revokeObjectURL(url);
    setMsg(t('settings.exported'));
  };

  const doDelete = async () => {
    repo.deleteAll();
    await deleteAllRecordings();
    refresh();
    go('today');
  };

  return (
    <Screen title={t('settings.title')}>
      <h2>{t('settings.privacy')}</h2>
      <p data-testid="consent-status">{t(`settings.consent.${data.consent.status}`)}</p>
      <p className="small muted">{t('settings.localOnly')}</p>
      <p className="small muted">{t('settings.retention')}</p>
      <p className="small muted">{t('settings.audit', { n: data.audit.length, ok: verifyChain(data.audit) === -1 ? t('settings.auditOk') : t('settings.auditBad') })}</p>
      <div className="row">
        <button className="btn" onClick={exportData}>{t('settings.export')}</button>
        {data.consent.status === 'granted' && <button className="btn quiet" onClick={() => setGateFor('withdraw')}>{t('settings.withdraw')}</button>}
        <button className="btn danger" onClick={() => setGateFor('delete')}>{t('settings.deleteAll')}</button>
      </div>
      <p role="status" className="small">{msg}</p>

      <h2>{t('settings.access')}</h2>
      <label className="check"><input type="checkbox" checked={s.reducedMotion} onChange={(e) => set({ reducedMotion: e.target.checked })} /> {t('settings.reducedMotion')}</label>
      <label className="check"><input type="checkbox" checked={s.dyslexiaFont} onChange={(e) => set({ dyslexiaFont: e.target.checked })} /> {t('settings.dyslexia')}</label>
      <Segmented legend={t('settings.textSize')} options={[100, 115, 130] as const} value={s.textScale} onChange={(v) => set({ textScale: v })} labels={(v) => `${v}%`} />

      <h2>{t('settings.audio')}</h2>
      <p className="small">{t('settings.parentVolume')}</p>
      <VolumeControl mode="parent" valueDb={s.parentVolumeDb} onChange={(db) => set({ parentVolumeDb: db })} />
      <p className="small muted">{t('settings.headphones')}</p>

      <h2>{t('settings.region')}</h2>
      <Segmented legend={t('settings.regionLegend')} options={['SG', 'PH', 'US', 'UK', 'AU'] as const} value={s.region} onChange={(v) => set({ region: v })} />

      <h2>{t('settings.coach')}</h2>
      <p className="small muted">{t('settings.coachOffline')}</p>

      {gateFor && (
        <GateDialog onCancel={() => setGateFor(null)} onPass={() => {
          const which = gateFor;
          setGateFor(null);
          if (which === 'delete') { if (window.confirm(t('settings.confirmDelete'))) void doDelete(); }
          else { repo.withdraw(); refresh(); setMsg(t('settings.withdrawn')); }
        }} />
      )}
    </Screen>
  );
}
