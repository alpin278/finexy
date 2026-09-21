import { useEffect, useMemo, useState } from 'react';
import { AmountInput, Button, Card, Input, Modal, Select, StatusBadge } from '../ui';
import { archiveRecurringRule, createRecurringRule, loadRecurringRules, setRecurringRuleActive, updateRecurringRule, type RecurringRule, type RecurringRuleInput } from '../../lib/recurring-transactions';
import type { TransactionCategoryOption, TransactionWalletOption } from '../../lib/transactions';
import { parseAmountNumber } from '../../lib/amount-format';

type Props = { wallets: TransactionWalletOption[]; categories: TransactionCategoryOption[]; locale: string; numberFormat: string; onChanged: () => Promise<void>; openCreateSignal?: number };
type RecurringFormState = Omit<RecurringRuleInput, 'amount'> & { amount: string };
const today = () => new Date().toISOString().slice(0, 10);
const initial = (): RecurringFormState => ({ type: 'expense', walletId: '', categoryId: '', amount: '', note: '', frequency: 'monthly', startDate: today(), endDate: '', localTime: '09:00' });

function formatAmount(value: number, currency?: string) {
  if (!currency) return Number(value).toLocaleString();
  return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value));
}

export function RecurringTransactions({ wallets, categories, locale, numberFormat, onChanged, openCreateSignal }: Props) {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [form, setForm] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringRule | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => setRules(await loadRecurringRules());
  useEffect(() => {
    void loadRecurringRules().then((items) => queueMicrotask(() => setRules(items))).catch(() => queueMicrotask(() => setError('Could not load recurring transactions.')));
  }, []);

  const eligible = useMemo(() => categories.filter((category) => category.type === form.type), [categories, form.type]);
  const closeForm = () => { setOpen(false); setEditing(null); setForm(initial()); };
  const openCreate = () => { setError(''); setEditing(null); setForm(initial()); setOpen(true); };
  useEffect(() => { if (openCreateSignal) queueMicrotask(openCreate); }, [openCreateSignal]);
  const openEdit = (rule: RecurringRule) => {
    setError('');
    setEditing(rule);
    setForm({ type: rule.type, walletId: rule.wallet_id, categoryId: rule.category_id, amount: String(rule.amount), note: rule.note ?? '', frequency: rule.frequency, startDate: rule.start_date, endDate: rule.end_date ?? '', localTime: rule.local_time.slice(0, 5) });
    setOpen(true);
  };
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const amount = parseAmountNumber(form.amount);
      if (!form.walletId || !form.categoryId || amount === null || amount <= 0) throw new Error('Choose a wallet, matching category, and positive amount.');
      const input: RecurringRuleInput = { ...form, amount };
      if (editing) await updateRecurringRule(editing.id, input);
      else await createRecurringRule(input);
      await refresh();
      await onChanged();
      closeForm();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save recurring transaction.');
    } finally {
      setBusy(false);
    }
  };
  const action = async (id: string, kind: 'toggle' | 'archive', active?: boolean) => {
    setBusy(true);
    setError('');
    try {
      if (kind === 'archive') await archiveRecurringRule(id);
      else await setRecurringRuleActive(id, !active);
      await refresh();
      await onChanged();
    } catch {
      setError('Could not update recurring transaction.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 bg-surface/55 px-5 py-5 sm:px-6">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Automation</p>
          <h2 className="text-base font-semibold text-primary">Recurring Transactions</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-secondary">Scheduled income and expenses are added as completed ledger transactions when due.</p>
        </div>
        <Button variant="secondary" size="sm" leftIcon={<i className="bi bi-arrow-repeat" aria-hidden="true" />} onClick={openCreate}>Add recurring</Button>
      </div>
      <div className="px-5 py-5 sm:px-6">
        {error && <p role="alert" className="mb-4 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">{error}</p>}
        <div className="space-y-2.5">
          {rules.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-center"><i className="bi bi-arrow-repeat text-secondary" aria-hidden="true" /><p className="mt-2 text-sm font-semibold text-primary">No recurring transactions yet.</p><p className="mt-1 text-xs text-secondary">Create a schedule for predictable income or expenses.</p><Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>Add Recurring</Button></div> : rules.map((rule) => (
            <div key={rule.id} className="grid min-w-0 gap-4 rounded-2xl border border-border bg-white p-4 transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-border-hover hover:shadow-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-primary">{rule.note || 'Recurring transaction'} <span className="font-normal text-secondary">·</span> {rule.wallet?.name ?? 'Wallet'}</p>
                  <StatusBadge status={rule.active ? 'active' : 'inactive'} label={rule.active ? 'Active' : 'Paused'} className="px-2 py-0.5 text-[10px]" />
                </div>
                <p className="mt-1.5 text-xs text-secondary">{rule.frequency} <span aria-hidden="true">·</span> {rule.category?.name ?? 'Category'} <span aria-hidden="true">·</span> <span className="money-value">{formatAmount(Number(rule.amount), rule.wallet?.currency)}</span> <span aria-hidden="true">·</span> Next {new Date(rule.next_due_at).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => openEdit(rule)}>Edit</Button>
                <Button variant="outline" size="sm" disabled={busy} onClick={() => void action(rule.id, 'toggle', rule.active)}>{rule.active ? 'Pause' : 'Resume'}</Button>
                <Button variant="destructive" size="sm" disabled={busy} aria-label="Archive recurring transaction" onClick={() => void action(rule.id, 'archive')}>Archive</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal isOpen={open} onClose={closeForm} title={editing ? 'Edit recurring transaction' : 'Add recurring transaction'} description="Future occurrences will create normal completed ledger transactions." footer={<><Button variant="outline" size="sm" onClick={closeForm}>Cancel</Button><Button variant="accent" size="sm" disabled={busy} onClick={() => void save()}>{busy ? 'Saving...' : editing ? 'Save future schedule' : 'Create schedule'}</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="recurring-type" className="mb-1.5 block text-xs font-semibold text-primary">Type</label><Select id="recurring-type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as RecurringRuleInput['type'], categoryId: '' }))} options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} className="h-10 w-full bg-white" /></div>
          <div><label htmlFor="recurring-frequency" className="mb-1.5 block text-xs font-semibold text-primary">Frequency</label><Select id="recurring-frequency" value={form.frequency} onChange={(event) => setForm((current) => ({ ...current, frequency: event.target.value as RecurringRuleInput['frequency'] }))} options={[{ value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]} className="h-10 w-full bg-white" /></div>
          <div><label htmlFor="recurring-wallet" className="mb-1.5 block text-xs font-semibold text-primary">Wallet</label><Select id="recurring-wallet" value={form.walletId} onChange={(event) => setForm((current) => ({ ...current, walletId: event.target.value }))} options={[{ value: '', label: 'Choose wallet' }, ...wallets.map((wallet) => ({ value: wallet.id, label: wallet.name + ' (' + wallet.currency + ')' }))]} className="h-10 w-full bg-white" /></div>
          <div><label htmlFor="recurring-category" className="mb-1.5 block text-xs font-semibold text-primary">Category</label><Select id="recurring-category" value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))} options={[{ value: '', label: 'Choose ' + form.type + ' category' }, ...eligible.map((category) => ({ value: category.id, label: category.name }))]} className="h-10 w-full bg-white" /></div>
          <div><label htmlFor="recurring-amount" className="mb-1.5 block text-xs font-semibold text-primary">Amount</label><AmountInput id="recurring-amount" min="0.0001" value={form.amount} onValueChange={(amount) => setForm((current) => ({ ...current, amount }))} locale={locale} numberFormat={numberFormat} maximumFractionDigits={4} placeholder="0.00" /></div>
          <div><label htmlFor="recurring-note" className="mb-1.5 block text-xs font-semibold text-primary">Note <span className="font-normal text-secondary">(optional)</span></label><Input id="recurring-note" value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="e.g. Rent or salary" /></div>
          <div><label htmlFor="recurring-start" className="mb-1.5 block text-xs font-semibold text-primary">Start date</label><Input id="recurring-start" type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} /></div>
          <div><label htmlFor="recurring-time" className="mb-1.5 block text-xs font-semibold text-primary">Local time</label><Input id="recurring-time" type="time" value={form.localTime} onChange={(event) => setForm((current) => ({ ...current, localTime: event.target.value }))} /></div>
          <div><label htmlFor="recurring-end" className="mb-1.5 block text-xs font-semibold text-primary">End date <span className="font-normal text-secondary">(optional)</span></label><Input id="recurring-end" type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} /></div>
        </div>
      </Modal>
    </Card>
  );
}
