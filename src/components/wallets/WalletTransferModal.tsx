import { useState } from 'react';
import type { CreateWalletTransferInput } from '../../lib/transfers';
import { transferErrorMessage } from '../../lib/transfers';
import type { Wallet } from '../../types/finance';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';

function newIdempotencyKey() {
  return `web-transfer-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

export function WalletTransferModal({ wallets, onClose, onSubmit }: { wallets: Wallet[]; onClose: () => void; onSubmit: (input: CreateWalletTransferInput) => Promise<void> }) {
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
    const numericAmount = Number(amount);
    if (!source || !destination) return setError('Choose both source and destination wallets.');
    if (source.id === destination.id) return setError('Choose different source and destination wallets.');
    if (source.currency !== destination.currency) return setError('Cross-currency transfers are not supported yet.');
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError('Enter an amount greater than 0.');
    if (numericAmount > source.balance) return setError('Transfer amount exceeds the settled source balance.');
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ sourceWalletId: source.id, destinationWalletId: destination.id, amount: numericAmount, note, idempotencyKey });
      onClose();
    } catch (submitError) {
      setError(transferErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return <Modal isOpen onClose={onClose} title="Transfer Funds" description="Move settled funds atomically between two same-currency wallets." maxWidth="md" footer={<><Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>Cancel</Button><Button variant="primary" size="sm" onClick={()=>void submit()} disabled={submitting}>{submitting ? 'Transferring…' : 'Transfer Funds'}</Button></>}><div className="space-y-4">{error&&<p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger">{error}</p>}<div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label htmlFor="transfer-from" className="block text-xs font-semibold text-primary mb-1.5">From Wallet</label><Select id="transfer-from" className="w-full h-10 rounded-[12px] bg-white" value={from} onChange={e=>{setFrom(e.target.value);setError('');}} options={options}/></div><div><label htmlFor="transfer-to" className="block text-xs font-semibold text-primary mb-1.5">To Wallet</label><Select id="transfer-to" className="w-full h-10 rounded-[12px] bg-white" value={to} onChange={e=>{setTo(e.target.value);setError('');}} options={options}/></div></div><div><label htmlFor="transfer-amount" className="block text-xs font-semibold text-primary mb-1.5">Amount{source ? ` (${source.currency})` : ''}</label><Input id="transfer-amount" type="number" min="0.01" step="0.01" value={amount} onChange={e=>{setAmount(e.target.value);setError('');}} placeholder="0.00"/></div><div><label htmlFor="transfer-note" className="block text-xs font-semibold text-primary mb-1.5">Note <span className="font-normal text-secondary">(optional)</span></label><Input id="transfer-note" value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Move funds to savings"/></div></div></Modal>;
}
