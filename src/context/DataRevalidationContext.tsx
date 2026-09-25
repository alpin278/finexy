import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useConnectivity } from './connectivity-context';
import { getBrowserOnline, isConnectivityError } from '../lib/connectivity';
import { supabase } from '../lib/supabase';

export type FinancialDataDomain = 'transactions' | 'wallets' | 'budgets' | 'overview' | 'reports' | 'categories' | 'recurring' | 'settings' | 'fx';

const financialDomains: FinancialDataDomain[] = ['transactions', 'wallets', 'budgets', 'overview', 'reports', 'categories', 'recurring', 'settings', 'fx'];
type Revalidator = () => Promise<void> | void;

interface DataRevalidationContextValue {
  invalidate: (domains: FinancialDataDomain[]) => Promise<boolean>;
  register: (domains: FinancialDataDomain[], revalidate: Revalidator) => () => void;
}

const DataRevalidationContext = createContext<DataRevalidationContextValue | null>(null);
const focusFreshnessMs = 30_000;

export function DataRevalidationProvider({ children }: { children: ReactNode }) {
  const registrations = useRef(new Map<symbol, { domains: FinancialDataDomain[]; revalidate: Revalidator; inFlight: Promise<void> | null; refreshQueued: boolean }>());
  const lastFocusRevalidation = useRef(0);

  const register = useCallback((domains: FinancialDataDomain[], revalidate: Revalidator) => {
    const id = Symbol('financial-revalidator');
    registrations.current.set(id, { domains, revalidate, inFlight: null, refreshQueued: false });
    return () => { registrations.current.delete(id); };
  }, []);

  const invalidate = useCallback(async (domains: FinancialDataDomain[]) => {
    const requested = new Set(domains);
    const refreshes: Promise<void>[] = [];
    registrations.current.forEach((registration) => {
      if (!registration.domains.some((domain) => requested.has(domain))) return;
      if (registration.inFlight) registration.refreshQueued = true;
      else {
        const run = async () => {
          do {
            registration.refreshQueued = false;
            await registration.revalidate();
          } while (registration.refreshQueued);
        };
        registration.inFlight = run().finally(() => { registration.inFlight = null; });
      }
      refreshes.push(registration.inFlight);
    });
    const results = await Promise.allSettled(refreshes);
    return results.every((result) => result.status === 'fulfilled');
  }, []);

  const { status, markOnline } = useConnectivity();
  const reconnectInFlight = useRef(false);

  useEffect(() => {
    if (status !== 'reconnecting' || reconnectInFlight.current) return;
    reconnectInFlight.current = true;
    void (async () => {
      await invalidate(financialDomains);
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (getBrowserOnline() && !isConnectivityError(error)) markOnline();
      } catch (error) {
        if (getBrowserOnline() && !isConnectivityError(error)) markOnline();
      } finally {
        reconnectInFlight.current = false;
      }
    })();
  }, [invalidate, markOnline, status]);

  useEffect(() => {
    const revalidateOnFocus = () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastFocusRevalidation.current < focusFreshnessMs) return;
      lastFocusRevalidation.current = Date.now();
      void invalidate(financialDomains);
    };
    window.addEventListener('focus', revalidateOnFocus);
    document.addEventListener('visibilitychange', revalidateOnFocus);
    return () => { window.removeEventListener('focus', revalidateOnFocus); document.removeEventListener('visibilitychange', revalidateOnFocus); };
  }, [invalidate]);

  const value = useMemo(() => ({ invalidate, register }), [invalidate, register]);
  return <DataRevalidationContext.Provider value={value}>{children}</DataRevalidationContext.Provider>;
}

export function useDataInvalidation() {
  const context = useContext(DataRevalidationContext);
  if (!context) throw new Error('useDataInvalidation must be used within DataRevalidationProvider.');
  return context.invalidate;
}

/** Registers an existing page loader without changing its data or calculation ownership. */
export function useDataRevalidation(domains: FinancialDataDomain[], revalidate: Revalidator) {
  const context = useContext(DataRevalidationContext);
  const latestRevalidate = useRef(revalidate);
  latestRevalidate.current = revalidate;
  const domainKey = domains.join('|');
  useEffect(() => {
    if (!context) return undefined;
    return context.register(domains, () => latestRevalidate.current());
  // domainKey deliberately keeps registration stable for equivalent domain lists.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, domainKey]);
}
