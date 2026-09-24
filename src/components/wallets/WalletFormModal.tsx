import { useState } from 'react';
import type { Wallet, WalletCurrencyCode, WalletStatus, WalletType } from '../../types/finance';
import { walletCurrencyOptions } from '../../data/wallets';
import { parseAmountNumber } from '../../lib/amount-format';
import { AmountInput } from '../ui/AmountInput';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';

export interface WalletFormValues { name: string; type: WalletType; currency: WalletCurrencyCode; openingBalance: string; monthlyLimit: string; accountMask: string; status: WalletStatus; }
const walletTypes: { value: WalletType; label: string }[] = [{ value: 'bank', label: 'Bank Account' }, { value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }, { value: 'savings', label: 'Savings' }, { value: 'travel', label: 'Travel' }];
const initial = (wallet?: Wallet | null, template?: Partial<WalletFormValues>): WalletFormValues => ({
  name: wallet?.name ?? template?.name ?? '',
  type: wallet?.type ?? template?.type ?? 'bank',
  currency: wallet?.currency ?? template?.currency ?? 'USD',
  openingBalance: wallet ? String(wallet.balance) : (template?.openingBalance ?? ''),
  monthlyLimit: wallet?.monthlyLimit === null ? '' : String(wallet?.monthlyLimit ?? template?.monthlyLimit ?? ''),
  accountMask: wallet?.accountMask ?? template?.accountMask ?? '',
  status: wallet?.status ?? template?.status ?? 'Active',
});

export function WalletFormModal({ wallet, initialTemplateValues, locale, numberFormat, onClose, onSubmit }: { wallet?: Wallet | null; initialTemplateValues?: Partial<WalletFormValues>; locale: string; numberFormat: string; onClose: () => void; onSubmit: (values: WalletFormValues) => void }) {
  const [values, setValues] = useState(() => initial(wallet, initialTemplateValues));
  const [errors, setErrors] = useState<Partial<Record<keyof WalletFormValues, string>>>({});
  const update = <K extends keyof WalletFormValues>(key: K, value: WalletFormValues[K]) => { setValues((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })); };
  const save = () => {
    const next: typeof errors = {};
    const openingBalance = values.openingBalance ? parseAmountNumber(values.openingBalance) : 0;
    const monthlyLimit = values.monthlyLimit === '' ? 0 : parseAmountNumber(values.monthlyLimit);
    if (!values.name.trim()) next.name = 'Wallet name is required.';
    if (!values.type) next.type = 'Choose a wallet type.';
    if (!values.currency) next.currency = 'Choose a currency.';
    if (openingBalance === null || openingBalance < 0) next.openingBalance = 'Opening balance cannot be negative.';
    if (monthlyLimit === null || monthlyLimit < 0) next.monthlyLimit = 'Monthly limit must be 0 or more.';
    setErrors(next);
    if (!Object.keys(next).length) onSubmit(values);
  };
  return <Modal isOpen onClose={onClose} title={wallet ? 'Edit Wallet' : 'Add Wallet'} description={wallet ? 'Update persisted wallet details. Current balance is derived from its ledger.' : 'Add a persisted account or payment source. Opening balance is the starting ledger position.'} maxWidth="lg" footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button variant="accent" size="sm" onClick={save}>{wallet ? 'Save Changes' : 'Add Wallet'}</Button></>}>
    <form onSubmit={(event) => { event.preventDefault(); save(); }} className="space-y-4">
      <div><label htmlFor="wallet-name" className="mb-1.5 block text-xs font-semibold text-primary">Wallet Name</label><Input id="wallet-name" value={values.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. USD Main Account" error={errors.name} /></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label htmlFor="wallet-type" className="mb-1.5 block text-xs font-semibold text-primary">Wallet Type</label><Select id="wallet-type" value={values.type} onChange={(event) => update('type', event.target.value as WalletType)} options={walletTypes} className="h-10 w-full rounded-[12px] bg-card" aria-invalid={Boolean(errors.type)} />{errors.type && <p className="mt-1 text-xs text-danger">{errors.type}</p>}</div><div><label htmlFor="wallet-currency" className="mb-1.5 block text-xs font-semibold text-primary">Currency</label><Select id="wallet-currency" value={values.currency} onChange={(event) => update('currency', event.target.value as WalletCurrencyCode)} options={walletCurrencyOptions.map(({ value, label }) => ({ value, label }))} className="h-10 w-full rounded-[12px] bg-card" aria-invalid={Boolean(errors.currency)} />{errors.currency && <p className="mt-1 text-xs text-danger">{errors.currency}</p>}</div></div>
      {!wallet && <div><label htmlFor="wallet-opening-balance" className="mb-1.5 block text-xs font-semibold text-primary">Opening Balance</label><AmountInput id="wallet-opening-balance" min="0" value={values.openingBalance} onValueChange={(value) => update('openingBalance', value)} locale={locale} numberFormat={numberFormat} maximumFractionDigits={2} placeholder="0.00" error={errors.openingBalance} /></div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label htmlFor="wallet-limit" className="mb-1.5 block text-xs font-semibold text-primary">Monthly Limit <span className="font-normal text-secondary">(optional)</span></label><AmountInput id="wallet-limit" min="0" value={values.monthlyLimit} onValueChange={(value) => update('monthlyLimit', value)} locale={locale} numberFormat={numberFormat} maximumFractionDigits={2} placeholder="No limit" error={errors.monthlyLimit} /></div><div><label htmlFor="wallet-label" className="mb-1.5 block text-xs font-semibold text-primary">Account / Card Label <span className="font-normal text-secondary">(optional)</span></label><Input id="wallet-label" value={values.accountMask} onChange={(event) => update('accountMask', event.target.value)} placeholder="e.g. •••• 2481" /></div></div>
      <div><label htmlFor="wallet-status" className="mb-1.5 block text-xs font-semibold text-primary">Status</label><Select id="wallet-status" value={values.status} onChange={(event) => update('status', event.target.value as WalletStatus)} options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} className="h-10 w-full rounded-[12px] bg-card" /></div>
    </form>
  </Modal>;
}
