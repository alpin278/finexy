import type { WalletCurrencyCode } from '../../types/finance';

export const formatMoney = (value: number, currency: WalletCurrencyCode) => new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
export const formatCompactMoney = (value: number, currency: WalletCurrencyCode) => new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(value);
