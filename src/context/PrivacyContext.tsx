import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { PrivacyContext } from './privacy-context';

const storageKey = 'finexy:privacy-mode';

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [privacyMode, setPrivacyMode] = useState(() => {
    try { return window.localStorage.getItem(storageKey) === 'true'; }
    catch { return false; }
  });

  const togglePrivacyMode = useCallback(() => {
    setPrivacyMode((current) => {
      const next = !current;
      try { window.localStorage.setItem(storageKey, String(next)); } catch { /* Device storage can be unavailable. */ }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ privacyMode, togglePrivacyMode }), [privacyMode, togglePrivacyMode]);
  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}
