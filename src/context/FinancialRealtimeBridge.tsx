import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from './useAuth';
import { useDataInvalidation, type FinancialDataDomain } from './DataRevalidationContext';
import { supabase } from '../lib/supabase';

const realtimeTables: Array<[string, FinancialDataDomain[]]> = [
  ['transactions', ['transactions', 'wallets', 'budgets', 'overview', 'reports', 'categories']],
  ['wallet_transfers', ['transactions', 'wallets', 'overview', 'reports']],
  ['wallets', ['wallets', 'overview']],
  ['budgets', ['budgets', 'overview']],
  ['categories', ['categories', 'budgets', 'transactions', 'overview']],
  ['category_rules', ['categories', 'budgets']],
  ['recurring_transaction_rules', ['recurring']],
  ['user_settings', ['overview', 'transactions', 'reports', 'settings']],
];

const realtimeDiagnostics = import.meta.env.DEV;

function diagnostic(message: string, details: Record<string, unknown>) {
  if (realtimeDiagnostics) console.info(`[financial-realtime] ${message}`, { ...details, timestamp: new Date().toISOString() });
}

/** Realtime carries no financial data into UI state: it only coalesces canonical reloads. */
export function FinancialRealtimeBridge() {
  const { user } = useAuth();
  const invalidate = useDataInvalidation();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return undefined;
    const queued = new Set<FinancialDataDomain>();
    const flush = () => {
      timer.current = null;
      const domains = [...queued];
      queued.clear();
      diagnostic('invalidating domains', { domains });
      void invalidate(domains);
    };
    const queue = (domains: FinancialDataDomain[]) => {
      domains.forEach((domain) => queued.add(domain));
      if (timer.current === null) timer.current = window.setTimeout(flush, 150);
    };
    const channel: RealtimeChannel = supabase.channel('financial-revalidation:' + user.id);
    realtimeTables.forEach(([table, domains]) => channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: 'user_id=eq.' + user.id }, (payload) => {
      diagnostic('received database event', { table, eventType: payload.eventType, domains });
      queue(domains);
    }));
    channel.subscribe((status) => diagnostic('channel status', { status }));
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
      queued.clear();
      void supabase.removeChannel(channel);
    };
  }, [invalidate, user]);
  return null;
}
