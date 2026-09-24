import { useState } from 'react';
import { parseAmountNumber } from '../../lib/amount-format';
import type { CreateWalletTransferInput } from '../../lib/transfers';
import { transferErrorMessage } from '../../lib/transfers';
import type { Wallet } from '../../types/finance';
import { AmountInput } from '../ui/AmountInput';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';

function newIdempotencyKey() { return `web-transfer-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`; }

export function WalletTransferModal({ wallets, locale, numberFormat, onClose, onSubmit }: { wallets: Wallet[]; locale: string; numberFormat: string; onClose: () => void; onSubmit: (input: CreateWalletTransferInput) => Promise<void> }) {
  const [from, setFrom] = useState(wallets[0]?.id ?? '');
  const [to, setTo] = useState(wallets[1]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey] = useState(newIdempotencyKey);
  const source = wallets.find((wallet) => wallet.id === from);
  const destination = wallets.find((wallet) => wallet.id === to);
  const options = wallets.map((wallet) => ({ value: wallet.id, label: `${wallet.name} (${wallet.currency})` }));
  const submit = async () => {
    const numericAmount = parseAmountNumber(amount);
    if (!source || !destination) return setError('Choose both source and destination wallets.');
    if (source.id === destination.id) return setError('Choose different source and destination wallets.');
    if (source.currency !== destination.currency) return setError('Cross-currency transfers are not supported yet.');
    if (numericAmount === null || numericAmount <= 0) return setError('Enter an amount greater than 0.');
    if (numericAmount > source.balance) return setError('Transfer amount exceeds the settled source balance.');
    setError(''); setSubmitting(true);
    try { await onSubmit({ sourceWalletId: source.id, destinationWalletId: destination.id, amount: numericAmount, note, idempotencyKey }); onClose(); }
    catch (submitError) { setError(transferErrorMessage(submitError)); }
    finally { setSubmitting(false); }
  };
  return <Modal isOpen onClose={onClose} title="Transfer Funds" description="Move settled funds atomically between two same-currency wallets." maxWidth="md" footer={<><Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>Cancel</Button><Button variant="primary" size="sm" onClick={() => void submit()} disabled={submitting}>{submitting ? 'Transferring…' : 'Transfer Funds'}</Button></>}>
    <div className="space-y-4">{error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger">{error}</p>}<div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label htmlFor="transfer-from" className="mb-1.5 block text-xs font-semibold text-primary">From Wallet</label><Select id="transfer-from" className="h-10 w-full rounded-[12px] bg-card" value={from} onChange={(event) => { setFrom(event.target.value); setError(''); }} options={options} /></div><div><label htmlFor="transfer-to" className="mb-1.5 block text-xs font-semibold text-primary">To Wallet</label><Select id="transfer-to" className="h-10 w-full rounded-[12px] bg-card" value={to} onChange={(event) => { setTo(event.target.value); setError(''); }} options={options} /></div></div><div><label htmlFor="transfer-amount" className="mb-1.5 block text-xs font-semibold text-primary">Amount{source ? ` (${source.currency})` : ''}</label><AmountInput id="transfer-amount" min="0.01" value={amount} onValueChange={(value) => { setAmount(value); setError(''); }} locale={locale} numberFormat={numberFormat} maximumFractionDigits={2} placeholder="0.00" /></div><div><label htmlFor="transfer-note" className="mb-1.5 block text-xs font-semibold text-primary">Note <span className="font-normal text-secondary">(optional)</span></label><Input id="transfer-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Move funds to savings" /></div></div>
  </Modal>;
}
