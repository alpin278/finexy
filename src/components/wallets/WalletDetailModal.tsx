import { useNavigate } from 'react-router-dom';
import type { Transaction, Wallet } from '../../types/finance';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ProgressBar } from '../ui/ProgressBar';
import { StatusBadge } from '../ui/StatusBadge';

const formatDate = (date: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
export function WalletDetailModal({ wallet, transactions, onClose }: { wallet?: Wallet | null; transactions: Transaction[]; onClose: () => void }) {
  const navigate = useNavigate();
  if (!wallet) return null;
  const spent = wallet.spentThisMonth ?? 0;
  const remaining = Math.max(0, wallet.monthlyLimit - spent);
  return <Modal isOpen onClose={onClose} title={wallet.name} description="Local wallet details and recent activity." maxWidth="lg" footer={<Button variant="outline" size="sm" onClick={onClose}>Close</Button>}>
    <div className="space-y-5"><div className="rounded-2xl border border-border bg-surface p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">Current balance</p><p className="mt-1 text-3xl font-bold tracking-tight text-primary">{wallet.symbol}{wallet.balance.toLocaleString(undefined,{minimumFractionDigits:2})}</p><div className="mt-4 flex items-center justify-between"><span className="text-xs text-secondary">{wallet.currency} · {wallet.type ?? 'bank'}{wallet.accountMask ? ` · ${wallet.accountMask}` : ''}</span><StatusBadge status={wallet.status === 'Active' ? 'active' : 'inactive'} label={wallet.status}/></div></div>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4"><div><dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Type</dt><dd className="mt-1 text-xs font-medium text-primary capitalize">{wallet.type ?? 'bank'}</dd></div><div><dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Institution</dt><dd className="mt-1 text-xs font-medium text-primary">{wallet.institution ?? 'Personal wallet'}</dd></div><div><dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Remaining limit</dt><dd className="mt-1 text-xs font-medium text-primary">{wallet.symbol}{remaining.toLocaleString()}</dd></div></dl>
      <div className="rounded-2xl border border-border p-4"><div className="flex justify-between gap-3 text-xs"><span className="font-semibold text-primary">Monthly spending</span><span className="text-secondary">{wallet.symbol}{spent.toLocaleString()} of {wallet.symbol}{wallet.monthlyLimit.toLocaleString()}</span></div><ProgressBar value={spent} max={wallet.monthlyLimit || 1} height="sm" className="mt-3" aria-label={`${wallet.name}: ${spent} spent of ${wallet.monthlyLimit} monthly limit`}/></div>
      <section className="border-t border-border pt-5"><div className="flex items-center justify-between gap-4"><h4 className="text-sm font-bold text-primary">Recent Transactions</h4><button type="button" className="text-xs font-semibold text-accent hover:text-accent-hover" onClick={()=>navigate('/transactions')}>View all transactions</button></div><div className="mt-3 divide-y divide-border">{transactions.length ? transactions.slice(0,5).map(txn=><div key={txn.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-primary">{txn.description}</p><p className="mt-0.5 text-[11px] text-secondary">{formatDate(txn.date)} · {txn.status.replace('_',' ')}</p></div><span className={txn.type==='income'?'text-xs font-bold text-success':'text-xs font-bold text-primary'}>{txn.type==='income'?'+':'-'}{wallet.symbol}{txn.amount.toLocaleString()}</span></div>) : <p className="py-4 text-xs text-secondary">No recent transactions for this wallet.</p>}</div></section>
    </div>
  </Modal>;
}
