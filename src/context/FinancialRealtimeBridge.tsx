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

/** Realtime carries no financial data into UI state: it only coalesces canonical reloads. */
export function FinancialRealtimeBridge() {
  const { user } = useAuth();
  const invalidate = useDataInvalidation();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return undefined;
    const queued = new Set<FinancialDataDomain>();
    const flush = () => { timer.current = null; void invalidate([...queued]); queued.clear(); };
    const queue = (domains: FinancialDataDomain[]) => {
      domains.forEach((domain) => queued.add(domain));
      if (timer.current === null) timer.current = window.setTimeout(flush, 150);
    };
    const channel: RealtimeChannel = supabase.channel('financial-revalidation:' + user.id);
    realtimeTables.forEach(([table, domains]) => channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: 'user_id=eq.' + user.id }, () => queue(domains)));
    channel.subscribe();
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
      queued.clear();
      void supabase.removeChannel(channel);
    };
  }, [invalidate, user]);
  return null;
}
