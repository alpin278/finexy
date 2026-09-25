import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getBrowserOnline, setBrowserOnline } from '../lib/connectivity';
import { ConnectivityContext, type ConnectivityStatus } from './connectivity-context';

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [browserOnline, setOnlineState] = useState(getBrowserOnline);
  const [hasBootstrapped, setHasBootstrapped] = useState(browserOnline);
  const [status, setStatus] = useState<ConnectivityStatus>(() => browserOnline ? 'online' : 'offline');

  useEffect(() => {
    const handleOffline = () => {
      setBrowserOnline(false);
      setOnlineState(false);
      setStatus('offline');
    };
    const handleOnline = () => {
      setBrowserOnline(true);
      setOnlineState(true);
      setHasBootstrapped(true);
      setStatus('reconnecting');
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const markOnline = useCallback(() => setStatus('online'), []);
  const value = useMemo(() => ({ browserOnline, hasBootstrapped, status, markOnline }), [browserOnline, hasBootstrapped, markOnline, status]);
  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}
