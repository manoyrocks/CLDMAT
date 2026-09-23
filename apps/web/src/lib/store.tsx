// App state: the repository plus a tiny hash router. In Child Mode the router is escape-resistant:
// Back or a hash change to a parent route is sent straight back to Child Mode (REQ-SAF-08).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CHILD_POLICY, PARENT_POLICY } from '@harmony/core';
import { engine } from '../audio/engine';
import { Repo, browserStore } from './repo';
import type { AppData } from './types';

export interface Store {
  data: AppData;
  repo: Repo;
  route: string[];
  go: (path: string) => void;
  refresh: () => void;
  enterChildMode: () => void;
  exitChildMode: () => void;
}

const Ctx = createContext<Store | null>(null);

export const repo = new Repo(browserStore());

function parse(hash: string): string[] {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  return parts.length ? parts : ['today'];
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(repo.snapshot);
  const [route, setRoute] = useState<string[]>(() => parse(location.hash));
  const refresh = useCallback(() => setData(repo.snapshot), []);

  // Retention purge on start (REQ-PRV-04). Audio "stop" events are audited without personal data.
  useEffect(() => {
    if (repo.canStore) repo.purgeExpired();
    engine.onStop = (r) => {
      try { repo.audit('audio.stop', { source: r.source.slice(0, 32), latencyMs: r.rampMs }); } catch { /* never block Stop */ }
    };
    refresh();
  }, [refresh]);

  // Child Mode trap: any navigation outside child/* is reversed.
  useEffect(() => {
    const onHash = () => {
      const next = parse(location.hash);
      if (repo.snapshot.settings.childModeActive && next[0] !== 'child') {
        location.replace('#/child/home');
        setRoute(['child', 'home']);
        return;
      }
      setRoute(next);
    };
    window.addEventListener('hashchange', onHash);
    onHash();
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Audio policy follows the mode (REQ-SAF-01).
  useEffect(() => {
    const child = data.settings.childModeActive;
    engine.setMode(child ? 'child' : 'parent', child ? data.settings.childVolumeDb : data.settings.parentVolumeDb);
  }, [data.settings.childModeActive, data.settings.childVolumeDb, data.settings.parentVolumeDb]);

  const go = useCallback((path: string) => {
    const target = `#/${path}`;
    if (location.hash === target) setRoute(parse(target));
    else location.hash = target;
    window.scrollTo(0, 0);
  }, []);

  const enterChildMode = useCallback(() => {
    engine.stopAll('mode-change');
    repo.updateSettings({ childModeActive: true });
    try { repo.audit('childmode.entered'); } catch { /* audit is best-effort */ }
    refresh();
    location.hash = '#/child/home';
  }, [refresh]);

  const exitChildMode = useCallback(() => {
    engine.stopAll('mode-change');
    repo.updateSettings({ childModeActive: false });
    try { repo.audit('childmode.exited'); } catch { /* best-effort */ }
    refresh();
    location.hash = '#/today';
  }, [refresh]);

  const value = useMemo(() => ({ data, repo, route, go, refresh, enterChildMode, exitChildMode }), [data, route, go, refresh, enterChildMode, exitChildMode]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
}

export const POLICIES = { child: CHILD_POLICY, parent: PARENT_POLICY };

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
