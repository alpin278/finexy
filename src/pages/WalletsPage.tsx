import { useEffect, useState } from 'react';
import { useCallback } from 'react';
import { archiveWallet, createWallet, loadWalletsPage, updateWallet, walletErrorMessage } from '../lib/wallets';
import { loadTransactionsPage } from '../lib/transactions';
import { createWalletTransfer, type CreateWalletTransferInput } from '../lib/transfers';
import type { Wallet } from '../types/finance';
import type { UserDisplayPreferences } from '../lib/user-display-preferences';
import { parseAmountNumber } from '../lib/amount-format';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { DeleteWalletDialog, WalletDetailModal, WalletFormModal, WalletGrid, WalletSummary, WalletTransferModal, type WalletFormValues } from '../components/wallets';
import { useLocation, useNavigate } from 'react-router-dom';
import { isFinexyActionState } from '../lib/interaction-actions';
import { useDataInvalidation, useDataRevalidation } from '../context/DataRevalidationContext';

export function WalletsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<import('../types/finance').Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [transferFeedback, setTransferFeedback] = useState('');
  const [detailWallet, setDetailWallet] = useState<Wallet | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingWallet, setDeletingWallet] = useState<Wallet | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [displayPreferences, setDisplayPreferences] = useState<UserDisplayPreferences>({ reportingCurrency: 'USD', locale: 'en-US', numberFormat: '1,234.56', timeZone: 'Asia/Jakarta' });
  const [templateInitialValues, setTemplateInitialValues] = useState<Partial<WalletFormValues> | undefined>(undefined);
  const invalidate = useDataInvalidation();

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const transactionData = await loadTransactionsPage();
        const walletData = await loadWalletsPage();
        if (active) { setWallets(walletData.wallets); setDisplayPreferences(walletData.displayPreferences); setWalletTransactions(transactionData.transactions); setLoadError(''); }
      } catch (error) {
        if (active) setLoadError(walletErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const refresh = useCallback(async () => {
    const transactionData = await loadTransactionsPage();
    const data = await loadWalletsPage();
    setWalletTransactions(transactionData.transactions);
    setWallets(data.wallets);
    setDisplayPreferences(data.displayPreferences);
    setDetailWallet((current) => current ? data.wallets.find((wallet) => wallet.id === current.id) ?? null : null);
  }, []);
  useDataRevalidation(['transactions', 'wallets', 'settings'], refresh);
  const openAdd = () => { setActionError(''); setTransferFeedback(''); setEditingWallet(null); setTemplateInitialValues(undefined); setFormOpen(true); };
  const handleUseTemplate = (template: Partial<WalletFormValues>) => {
    setActionError('');
    setTransferFeedback('');
    setEditingWallet(null);
    setTemplateInitialValues(template);
    setFormOpen(true);
  };
  useEffect(() => {
    if (loading || !isFinexyActionState(location.state)) return;
    const action = location.state.finexyAction;
    queueMicrotask(() => { if (action === 'transfer') setTransferOpen(true); else if (action === 'add-wallet') openAdd(); });
    if (action === 'transfer' || action === 'add-wallet') navigate(location.pathname, { replace: true, state: null });
  }, [loading, location.pathname, location.state, navigate]);
  const openEdit = (wallet: Wallet) => { setActionError(''); setTransferFeedback(''); setOpenMenuId(null); setEditingWallet(wallet); setTemplateInitialValues(undefined); setFormOpen(true); };
  const saveWallet = async (values: WalletFormValues) => {
    setActionError('');
    try {
      const monthlyLimit = values.monthlyLimit === '' ? null : parseAmountNumber(values.monthlyLimit);
      const openingBalance = values.openingBalance === '' ? 0 : parseAmountNumber(values.openingBalance);
      if ((monthlyLimit === null && values.monthlyLimit !== '') || openingBalance === null) throw new Error('Enter valid wallet amounts.');
      if (editingWallet) {
        await updateWallet(editingWallet.id, { name: values.name, type: values.type, currency: values.currency, monthlyLimit, accountMask: values.accountMask.trim() || null, status: values.status === 'Active' ? 'active' : 'inactive' });
      } else {
        await createWallet({ name: values.name, type: values.type, currency: values.currency, openingBalance, monthlyLimit, accountMask: values.accountMask.trim() || null, status: values.status === 'Active' ? 'active' : 'inactive' });
      }
      await invalidate(['wallets', 'transactions', 'overview', 'recurring']);
      setFormOpen(false); setEditingWallet(null); setTemplateInitialValues(undefined);
    } catch (error) { setActionError(walletErrorMessage(error)); }
  };
  const confirmDelete = async () => {
    if (!deletingWallet) return;
    setActionError('');
    try { await archiveWallet(deletingWallet.id); await invalidate(['wallets', 'transactions', 'overview', 'recurring']); setDetailWallet((current) => current?.id === deletingWallet.id ? null : current); setDeletingWallet(null); }
    catch (error) { setActionError(walletErrorMessage(error)); }
  };
  const handleTransfer = async (input: CreateWalletTransferInput) => {
    setActionError('');
    await createWalletTransfer(input);
    await invalidate(['transactions', 'wallets', 'overview', 'reports']);
    setTransferFeedback('Transfer completed. Wallet balances and ledger entries are now updated.');
  };
  const detailTransactions = detailWallet ? walletTransactions.filter((transaction) => transaction.wallet === detailWallet.name) : [];

  return <div className="min-w-0 w-full max-w-[calc(100vw-2rem)] space-y-6 sm:space-y-7 pb-8">
    <header className="flex min-w-0 flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="min-w-0"><h1 className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">Wallets</h1><p className="text-xs sm:text-sm text-secondary mt-1">Manage your persisted accounts, balances, and payment sources.</p></div><div className="flex items-center gap-2.5 flex-wrap"><Button variant="secondary" size="sm" leftIcon={<Icon name="arrow-left-right"/>} onClick={()=>setTransferOpen(true)}>Transfer</Button><Button variant="accent" size="sm" leftIcon={<Icon name="plus-lg"/>} onClick={openAdd}>Add Wallet</Button></div></header>
    {actionError && <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{actionError}</div>}{transferFeedback && <div role="status" className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{transferFeedback}</div>}
    {loading ? <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-secondary" role="status">Loading wallets…</div> : loadError ? <div className="rounded-2xl border border-danger/30 bg-danger/10 p-8 text-center"><p className="text-sm font-semibold text-danger">Could not load wallets</p><p className="mt-1 text-xs text-secondary">{loadError}</p></div> : <><WalletSummary wallets={wallets}/><section className="space-y-4"><div className="flex items-center justify-between gap-4"><div><h2 className="text-base font-bold text-primary">Your wallets</h2><p className="mt-0.5 text-xs text-secondary">Persisted wallets with balances derived from opening positions and completed transactions.</p></div><span className="hidden sm:inline text-xs font-medium text-secondary">{wallets.length} total</span></div><WalletGrid wallets={wallets} defaultCurrency={displayPreferences.reportingCurrency} openMenuId={openMenuId} onToggleMenu={(id)=>setOpenMenuId(current=>current===id?null:id)} onView={(wallet)=>{setOpenMenuId(null);setDetailWallet(wallet);}} onEdit={openEdit} onSetLimit={openEdit} onDelete={(wallet)=>{setOpenMenuId(null);setDeletingWallet(wallet);}} onUseTemplate={handleUseTemplate}/></section></>}
    {formOpen && <WalletFormModal key={editingWallet?.id ?? (templateInitialValues ? 'template-wallet' : 'new-wallet')} wallet={editingWallet} initialTemplateValues={templateInitialValues} locale={displayPreferences.locale} numberFormat={displayPreferences.numberFormat} onClose={()=>{setFormOpen(false);setEditingWallet(null);setTemplateInitialValues(undefined);}} onSubmit={saveWallet}/>}<WalletDetailModal wallet={detailWallet} transactions={detailTransactions} onClose={()=>setDetailWallet(null)}/><DeleteWalletDialog wallet={deletingWallet} onCancel={()=>setDeletingWallet(null)} onConfirm={()=>void confirmDelete()}/>{transferOpen && <WalletTransferModal wallets={wallets} locale={displayPreferences.locale} numberFormat={displayPreferences.numberFormat} onClose={()=>setTransferOpen(false)} onSubmit={handleTransfer}/>}</div>;

}

export default WalletsPage;
