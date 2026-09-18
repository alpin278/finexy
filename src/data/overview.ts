import type {
  Wallet,
  MetricData,
  ProfitLossMonth,
  SpendingLimit,
  PaymentCardData,
  RecentActivity,
} from '../types/finance';

export const totalBalanceData = {
  amount: 689372.0,
  currency: 'USD',
  symbol: '$',
  changePercentage: 5,
  period: 'than last month',
  isPositive: true,
};

export const mockWallets: Wallet[] = [
  {
    id: 'w-usd',
    currency: 'USD',
    symbol: '$',
    flag: '🇺🇸',
    name: 'US Dollar',
    balance: 22678,
    monthlyLimit: 10000,
    status: 'Active',
  },
  {
    id: 'w-eur',
    currency: 'EUR',
    symbol: '€',
    flag: '🇪🇺',
    name: 'Euro',
    balance: 18345,
    monthlyLimit: 8000,
    status: 'Active',
  },
  {
    id: 'w-gbp',
    currency: 'GBP',
    symbol: '£',
    flag: '🇬🇧',
    name: 'British Pound',
    balance: 15000,
    monthlyLimit: 7500,
    status: 'Inactive',
  },
];

export const mockMetrics: MetricData[] = [
  {
    id: 'earnings',
    title: 'Total Earnings',
    amount: 950,
    changePercentage: 7,
    period: 'This month',
    isPositive: true,
    highlighted: true, // Primary orange-coral treatment
  },
  {
    id: 'spending',
    title: 'Total Spending',
    amount: 700,
    changePercentage: -5,
    period: 'This month',
    isPositive: false,
    highlighted: false,
  },
  {
    id: 'income',
    title: 'Total Income',
    amount: 1050,
    changePercentage: 8,
    period: 'This month',
    isPositive: true,
    highlighted: false,
  },
  {
    id: 'revenue',
    title: 'Total Revenue',
    amount: 850,
    changePercentage: 4,
    period: 'This month',
    isPositive: true,
    highlighted: false,
  },
];

export const mockProfitLossData: ProfitLossMonth[] = [
  { month: 'Jan', profit: 3200, loss: 1400 },
  { month: 'Feb', profit: 4100, loss: 1200 },
  { month: 'Mar', profit: 3800, loss: 2100 },
  { month: 'Apr', profit: 5400, loss: 1600 },
  { month: 'May', profit: 4600, loss: 2400 },
  { month: 'Jun', profit: 6200, loss: 1800 },
  { month: 'Jul', profit: 5800, loss: 2200 },
  { month: 'Aug', profit: 6900, loss: 1500 },
];

export const mockSpendingLimit: SpendingLimit = {
  spent: 1400.0,
  totalLimit: 5500.0,
  period: 'Monthly',
};

export const mockPaymentCards: PaymentCardData[] = [
  {
    id: 'card-1',
    variant: 'dark',
    status: 'Active',
    last4: '6782',
    expiry: '09/29',
    cvv: '611',
    cardHolder: 'SAJIBUR RAHMAN',
    type: 'mastercard',
  },
  {
    id: 'card-2',
    variant: 'orange',
    status: 'Active',
    last4: '4356',
    expiry: '11/28',
    cvv: '342',
    cardHolder: 'SAJIBUR RAHMAN',
    type: 'visa',
  },
];

export const mockRecentActivities: RecentActivity[] = [
  {
    id: 'act-1',
    invoiceId: 'INV_000076',
    name: 'Mobile App Purchase',
    category: 'Software & Tools',
    amount: 25500,
    status: 'Completed',
    date: '17 Apr, 2026 03:45 PM',
  },
  {
    id: 'act-2',
    invoiceId: 'INV_000075',
    name: 'Hotel Booking',
    category: 'Travel & Accommodation',
    amount: 32750,
    status: 'Pending',
    date: '15 Apr, 2026 11:30 AM',
  },
  {
    id: 'act-3',
    invoiceId: 'INV_000074',
    name: 'Flight Ticket Booking',
    category: 'Travel & Logistics',
    amount: 40200,
    status: 'Completed',
    date: '15 Apr, 2026 12:00 PM',
  },
  {
    id: 'act-4',
    invoiceId: 'INV_000073',
    name: 'Grocery Purchase',
    category: 'Food & Groceries',
    amount: 50200,
    status: 'In Progress',
    date: '14 Apr, 2026 09:15 PM',
  },
  {
    id: 'act-5',
    invoiceId: 'INV_000072',
    name: 'Software License',
    category: 'Subscriptions',
    amount: 15900,
    status: 'Completed',
    date: '10 Apr, 2026 06:00 AM',
  },
];
