import { useEffect } from 'react';
import { Icon } from './components/Icon';
import { t } from './lib/i18n';
import { useStore } from './lib/store';
import { ActivityDetail, ActivityList, RoutineDetail, RoutineList } from './screens/Activities';
import { ChildMode, ChildModeNotice } from './screens/Child';
import { Coach } from './screens/Coach';
import { Goals, Review } from './screens/Goals';
import { LearnEntry, LearnHub, RedFlagChecker, TherapistGuide } from './screens/Learn';
import { Onboarding } from './screens/Onboarding';
import { Settings } from './screens/Settings';
import { Countdown, Exposure, SoundDiary, SoundHub, SoundPatterns, Strategies, TooLoudScreen } from './screens/Sound';
import { SessionPlayer, Today } from './screens/Today';

const NAV: [string, string, string][] = [
  ['today', 'home', 'nav.today'], ['activities', 'song', 'nav.activities'], ['sound', 'ear', 'nav.sound'],
  ['goals', 'target', 'nav.goals'], ['learn', 'learn', 'nav.learn'],
];

function ParentScreen({ route }: { route: string[] }) {
  const [a, b] = route;
  switch (a) {
    case 'session': return <SessionPlayer />;
    case 'activities': return b ? <ActivityDetail id={b} /> : <ActivityList />;
    case 'routines': return b ? <RoutineDetail id={b} /> : <RoutineList />;
    case 'sound':
      switch (b) {
        case 'diary': return <SoundDiary />;
        case 'patterns': return <SoundPatterns />;
        case 'countdown': return <Countdown />;
        case 'tooloud': return <TooLoudScreen />;
        case 'exposure': return <Exposure />;
        case 'strategies': return <Strategies />;
        default: return <SoundHub />;
      }
    case 'goals': return b === 'review' ? <Review /> : <Goals />;
    case 'learn':
      if (b === 'check') return <RedFlagChecker />;
      if (b === 'therapist') return <TherapistGuide />;
      return b ? <LearnEntry id={b} /> : <LearnHub />;
    case 'coach': return <Coach />;
    case 'settings': return <Settings />;
    case 'childnotice': return <ChildModeNotice />;
    default: return <Today />;
  }
}

export function App() {
  const { data, route, go } = useStore();
  const s = data.settings;
  const child = s.childModeActive;

  // Accessibility and sensory settings (REQ-NFR-01, REQ-NFR-02).
  useEffect(() => {
    const c = document.body.classList;
    c.toggle('reduced-motion', s.reducedMotion);
    c.toggle('dyslexia', s.dyslexiaFont);
    c.toggle('child', child);
    document.documentElement.style.setProperty('--scale', String(s.textScale / 100));
  }, [s.reducedMotion, s.dyslexiaFont, s.textScale, child]);

  if (child) return <ChildMode view={route[0] === 'child' ? route[1] ?? 'home' : 'home'} />;

  const onboarding = !s.onboarded || !data.profile;
  const section = route[0] === 'routines' || route[0] === 'session' ? 'activities' : route[0];
  return (
    <div className="app">
      <a className="skip" href="#main">{t('common.skip')}</a>
      <header className="topbar">
        <span className="brand"><Icon name="song" /> HarmonyPath</span>
        {!onboarding && <button className="iconbtn" onClick={() => go('settings')} aria-label={t('nav.settings')}><Icon name="gear" /></button>}
      </header>
      <main id="main">{onboarding ? <Onboarding /> : <ParentScreen route={route} />}</main>
      {!onboarding && (
        <nav className="bottomnav" aria-label={t('nav.main')}>
          <div className="bottomnav-inner">
            {NAV.map(([path, icon, key]) => (
              <button key={path} onClick={() => go(path)} aria-current={section === path ? 'page' : undefined}>
                <Icon name={icon} /> {t(key)}
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
