import { useMemo, useState } from 'react';
import { Card, Select } from '../ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import type { OverviewRecentTransaction } from '../../lib/overview';
import { formatWalletAmount } from '../../lib/overview';
import { cn } from '../../lib/utils';

export interface RecentActivityTableProps {
  activities: OverviewRecentTransaction[];
  className?: string;
}

const statusLabel = (status: OverviewRecentTransaction['status']) => status === 'completed' ? 'Completed' : status === 'pending' ? 'Pending' : 'Canceled';

export function RecentActivityTable({ activities, className }: RecentActivityTableProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | OverviewRecentTransaction['type']>('all');
  const shown = useMemo(
    () => activities.filter((item) => (filter === 'all' || item.type === filter) && [item.name, item.reference, item.category].join(' ').toLowerCase().includes(search.toLowerCase())),
    [activities, filter, search],
  );

  return (
    <Card className={cn('flex min-w-0 flex-col overflow-hidden p-5 sm:p-6', className)}>
      <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-primary sm:text-base">Recent Transactions</h3>
          <p className="mt-0.5 text-xs text-secondary">Recent income, expenses, and wallet transfers</p>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <label className="relative min-w-0 flex-1 sm:flex-none">
            <span className="sr-only">Search transactions</span>
            <i className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-secondary" aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transactions..." className="h-9 w-full rounded-full border border-border bg-surface pl-8 pr-3 text-xs text-primary outline-none transition-[background-color,border-color,box-shadow] duration-150 focus:bg-card focus:border-accent focus:ring-2 focus:ring-accent/15 sm:w-52" />
          </label>
          <Select
            value={filter}
            onChange={(event) => setFilter(event.target.value as typeof filter)}
            aria-label="Filter transactions"
            options={[{ value: 'all', label: 'All' }, { value: 'income', label: 'Income' }, { value: 'expense', label: 'Expenses' }, { value: 'transfer', label: 'Transfers' }]}
            className="h-9 w-[106px] rounded-full bg-surface px-3 pr-8"
          />
        </div>
      </div>
      <div className="mt-2 w-full overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Reference</TableHead>
              <TableHead>Transaction / Merchant</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Date &amp; Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length ? shown.map((item) => (
              <TableRow key={item.id} className="transition-colors hover:bg-surface/60">
                <TableCell className="font-mono text-xs font-semibold text-primary">{item.reference}</TableCell>
                <TableCell>
                  <p className="text-xs font-semibold text-primary sm:text-sm"><i className={cn('bi', item.type === 'transfer' ? 'bi-arrow-left-right' : item.type === 'income' ? 'bi-arrow-down-left' : 'bi-arrow-up-right', 'mr-1.5 text-secondary')} aria-hidden="true" />{item.name}</p>
                  <p className="text-[11px] text-secondary">{item.category}</p>
                </TableCell>
                <TableCell className="money-value whitespace-nowrap text-xs font-semibold text-primary sm:text-sm">{formatWalletAmount(item.amount, item.currency)}</TableCell>
                <TableCell><span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold', item.type === 'transfer' ? 'bg-surface text-secondary' : item.status === 'completed' ? 'bg-success/15 text-success' : item.status === 'pending' ? 'bg-warning/20 text-primary' : 'bg-danger/15 text-danger')}>{item.type === 'transfer' ? 'Transfer' : statusLabel(item.status)}</span></TableCell>
                <TableCell className="whitespace-nowrap text-right text-xs text-secondary">{item.occurredAt}</TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-secondary">No matching transactions found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-secondary">
        <span>Showing {shown.length} of {activities.length} recent entries</span>
        <a href="/transactions" className="inline-flex items-center gap-1 font-semibold text-accent transition-colors hover:text-accent-hover">View all <i className="bi bi-arrow-right" aria-hidden="true" /></a>
      </div>
    </Card>
  );
}

export default RecentActivityTable;
