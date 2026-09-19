import { useState } from 'react';
import { ArrowLeftRight, Plus } from 'lucide-react';
import { mockWalletAccounts, walletCurrencyOptions } from '../data/wallets';
import { mockTransactions } from '../data/transactions';
import type { Wallet } from '../types/finance';
import { Button } from '../components/ui/Button';
import { DeleteWalletDialog, WalletDetailModal, WalletFormModal, WalletGrid, WalletSummary, WalletTransferModal, type WalletFormValues } from '../components/wallets';

export function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>(mockWalletAccounts);
  const [detailWallet, setDetailWallet] = useState<Wallet | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingWallet, setDeletingWallet] = useState<Wallet | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const openAdd = () => { setEditingWallet(null); setFormOpen(true); };
  const openEdit = (wallet: Wallet) => { setOpenMenuId(null); setEditingWallet(wallet); setFormOpen(true); };
  const saveWallet = (values: WalletFormValues) => {
    const currency = walletCurrencyOptions.find((option) => option.value === values.currency) ?? walletCurrencyOptions[0];
    if (editingWallet) {
      const updates = { name: values.name.trim(), type: values.type, currency: values.currency, monthlyLimit: Number(values.monthlyLimit), accountMask: values.accountMask.trim() || undefined, status: values.status };
      setWallets((current) => current.map((wallet) => wallet.id === editingWallet.id ? { ...wallet, ...updates } : wallet));
      if (detailWallet?.id === editingWallet.id) setDetailWallet((current) => current ? { ...current, ...updates } : null);
    } else {
      setWallets((current) => [...current, { id: `wallet-${Date.now()}`, name: values.name.trim(), type: values.type, currency: values.currency, symbol: currency.symbol, flag: currency.flag, balance: Number(values.openingBalance || 0), monthlyLimit: Number(values.monthlyLimit), spentThisMonth: 0, accountMask: values.accountMask.trim() || undefined, status: values.status, colorVariant: current.length % 2 ? 'accent' : 'dark' }]);
    }
    setFormOpen(false); setEditingWallet(null);
  };
  const confirmDelete = () => { if (!deletingWallet) return; setWallets((current) => current.filter((wallet) => wallet.id !== deletingWallet.id)); if (detailWallet?.id === deletingWallet.id) setDetailWallet(null); setDeletingWallet(null); };
  const walletTransactions = detailWallet ? mockTransactions.filter((transaction) => transaction.wallet === detailWallet.name) : [];

  return <div className="min-w-0 w-full max-w-[calc(100vw-2rem)] space-y-6 sm:space-y-7 pb-8 animate-in fade-in-50 duration-200">
    <header className="flex min-w-0 flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="min-w-0"><h1 className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">Wallets</h1><p className="text-xs sm:text-sm text-secondary mt-1">Manage your accounts, balances, and payment sources.</p></div><div className="flex items-center gap-2.5 flex-wrap"><Button variant="secondary" size="sm" leftIcon={<ArrowLeftRight className="w-3.5 h-3.5"/>} onClick={()=>setTransferOpen(true)}>Transfer</Button><Button variant="accent" size="sm" leftIcon={<Plus className="w-3.5 h-3.5"/>} onClick={openAdd}>Add Wallet</Button></div></header>
    <WalletSummary wallets={wallets}/>
    <section className="space-y-4"><div className="flex items-center justify-between gap-4"><div><h2 className="text-base font-bold text-primary">Your wallets</h2><p className="mt-0.5 text-xs text-secondary">Accounts and payment sources in this local prototype.</p></div><span className="hidden sm:inline text-xs font-medium text-secondary">{wallets.length} total</span></div><WalletGrid wallets={wallets} openMenuId={openMenuId} onToggleMenu={(id)=>setOpenMenuId(current=>current===id?null:id)} onView={(wallet)=>{setOpenMenuId(null);setDetailWallet(wallet);}} onEdit={openEdit} onSetLimit={openEdit} onDelete={(wallet)=>{setOpenMenuId(null);setDeletingWallet(wallet);}}/></section>
    {formOpen && <WalletFormModal key={editingWallet?.id ?? 'new-wallet'} wallet={editingWallet} onClose={()=>{setFormOpen(false);setEditingWallet(null);}} onSubmit={saveWallet}/>}<WalletDetailModal wallet={detailWallet} transactions={walletTransactions} onClose={()=>setDetailWallet(null)}/><DeleteWalletDialog wallet={deletingWallet} onCancel={()=>setDeletingWallet(null)} onConfirm={confirmDelete}/>{transferOpen && <WalletTransferModal wallets={wallets} onClose={()=>setTransferOpen(false)}/>}
  </div>;
}

export default WalletsPage;
