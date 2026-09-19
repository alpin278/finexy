import { useEffect, useState } from 'react';
import { ArrowLeftRight, Plus } from 'lucide-react';
import { mockTransactions } from '../data/transactions';
import { archiveWallet, createWallet, loadWalletsPage, updateWallet, walletErrorMessage } from '../lib/wallets';
import type { Wallet } from '../types/finance';
import { Button } from '../components/ui/Button';
import { DeleteWalletDialog, WalletDetailModal, WalletFormModal, WalletGrid, WalletSummary, WalletTransferModal, type WalletFormValues } from '../components/wallets';

export function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [detailWallet, setDetailWallet] = useState<Wallet | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingWallet, setDeletingWallet] = useState<Wallet | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await loadWalletsPage();
        if (active) { setWallets(data.wallets); setLoadError(''); }
      } catch (error) {
        if (active) setLoadError(walletErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const refresh = async () => {
    const data = await loadWalletsPage();
    setWallets(data.wallets);
    if (detailWallet) setDetailWallet(data.wallets.find((wallet) => wallet.id === detailWallet.id) ?? null);
  };
  const openAdd = () => { setActionError(''); setEditingWallet(null); setFormOpen(true); };
  const openEdit = (wallet: Wallet) => { setActionError(''); setOpenMenuId(null); setEditingWallet(wallet); setFormOpen(true); };
  const saveWallet = async (values: WalletFormValues) => {
    setActionError('');
    try {
      const monthlyLimit = values.monthlyLimit === '' ? null : Number(values.monthlyLimit);
      if (editingWallet) {
        await updateWallet(editingWallet.id, { name: values.name, type: values.type, currency: values.currency, monthlyLimit, accountMask: values.accountMask.trim() || null, status: values.status === 'Active' ? 'active' : 'inactive' });
      } else {
        await createWallet({ name: values.name, type: values.type, currency: values.currency, openingBalance: Number(values.openingBalance || 0), monthlyLimit, accountMask: values.accountMask.trim() || null, status: values.status === 'Active' ? 'active' : 'inactive' });
      }
      await refresh();
      setFormOpen(false); setEditingWallet(null);
    } catch (error) { setActionError(walletErrorMessage(error)); }
  };
  const confirmDelete = async () => {
    if (!deletingWallet) return;
    setActionError('');
    try { await archiveWallet(deletingWallet.id); await refresh(); if (detailWallet?.id === deletingWallet.id) setDetailWallet(null); setDeletingWallet(null); }
    catch (error) { setActionError(walletErrorMessage(error)); }
  };
  const walletTransactions = detailWallet ? mockTransactions.filter((transaction) => transaction.wallet === detailWallet.name) : [];

  return <div className="min-w-0 w-full max-w-[calc(100vw-2rem)] space-y-6 sm:space-y-7 pb-8 animate-in fade-in-50 duration-200">
    <header className="flex min-w-0 flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="min-w-0"><h1 className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">Wallets</h1><p className="text-xs sm:text-sm text-secondary mt-1">Manage your persisted accounts, balances, and payment sources.</p></div><div className="flex items-center gap-2.5 flex-wrap"><Button variant="secondary" size="sm" leftIcon={<ArrowLeftRight className="w-3.5 h-3.5"/>} onClick={()=>setTransferOpen(true)}>Transfer</Button><Button variant="accent" size="sm" leftIcon={<Plus className="w-3.5 h-3.5"/>} onClick={openAdd}>Add Wallet</Button></div></header>
    {actionError && <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{actionError}</div>}
    {loading ? <div className="rounded-2xl border border-border bg-white p-10 text-center text-sm text-secondary" role="status">Loading wallets…</div> : loadError ? <div className="rounded-2xl border border-danger/30 bg-danger/10 p-8 text-center"><p className="text-sm font-semibold text-danger">Could not load wallets</p><p className="mt-1 text-xs text-secondary">{loadError}</p></div> : <><WalletSummary wallets={wallets}/><section className="space-y-4"><div className="flex items-center justify-between gap-4"><div><h2 className="text-base font-bold text-primary">Your wallets</h2><p className="mt-0.5 text-xs text-secondary">Persisted wallets with opening balances; transaction activity is still a prototype bridge.</p></div><span className="hidden sm:inline text-xs font-medium text-secondary">{wallets.length} total</span></div><WalletGrid wallets={wallets} openMenuId={openMenuId} onToggleMenu={(id)=>setOpenMenuId(current=>current===id?null:id)} onView={(wallet)=>{setOpenMenuId(null);setDetailWallet(wallet);}} onEdit={openEdit} onSetLimit={openEdit} onDelete={(wallet)=>{setOpenMenuId(null);setDeletingWallet(wallet);}}/></section></>}
    {formOpen && <WalletFormModal key={editingWallet?.id ?? 'new-wallet'} wallet={editingWallet} onClose={()=>{setFormOpen(false);setEditingWallet(null);}} onSubmit={saveWallet}/>}<WalletDetailModal wallet={detailWallet} transactions={walletTransactions} onClose={()=>setDetailWallet(null)}/><DeleteWalletDialog wallet={deletingWallet} onCancel={()=>setDeletingWallet(null)} onConfirm={()=>void confirmDelete()}/>{transferOpen && <WalletTransferModal wallets={wallets} onClose={()=>setTransferOpen(false)}/>}</div>;
}

export default WalletsPage;
