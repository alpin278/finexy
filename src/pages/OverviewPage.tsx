import { useState } from 'react';
import { Calendar, Download, ChevronDown, Check } from 'lucide-react';
import {
  totalBalanceData,
  mockWallets,
  mockMetrics,
  mockProfitLossData,
  mockSpendingLimit,
  mockPaymentCards as initialCards,
  mockRecentActivities,
} from '../data/overview';
import {
  BalanceCard,
  WalletList,
  MetricCard,
  ProfitLossChart,
  SpendingLimitCard,
  PaymentCards,
  RecentActivityTable,
  TransferModal,
  AddCardModal,
} from '../components/dashboard';
import type { PaymentCardData } from '../types/finance';
import { cn } from '../lib/utils';

export function OverviewPage() {
  const [dateRange, setDateRange] = useState('12 Apr, 2026 - 18 Apr, 2026');
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferMode, setTransferMode] = useState<'transfer' | 'request'>('transfer');
  const [addCardModalOpen, setAddCardModalOpen] = useState(false);
  const [cards, setCards] = useState<PaymentCardData[]>(initialCards);
  const [exportFeedback, setExportFeedback] = useState(false);

  const dateRangeOptions = [
    'Today',
    '12 Apr, 2026 - 18 Apr, 2026',
    'This Month (Apr 2026)',
    'Last 30 Days',
    'Q1 2026',
  ];

  const handleExport = () => {
    setExportFeedback(true);
    setTimeout(() => setExportFeedback(false), 2000);
  };

  const handleAddNewCard = (newCard: { number: string; expiry: string; cvv: string; holder: string }) => {
    const cardEntry: PaymentCardData = {
      id: `card-${Date.now()}`,
      variant: cards.length % 2 === 0 ? 'dark' : 'orange',
      status: 'Active',
      last4: newCard.number.slice(-4) || '8888',
      expiry: newCard.expiry || '12/30',
      cvv: newCard.cvv || '999',
      cardHolder: newCard.holder.toUpperCase() || 'SAJIBUR RAHMAN',
      type: 'mastercard',
    };
    setCards((prev) => [...prev, cardEntry]);
  };

  return (
    <div className="space-y-6 sm:space-y-7 pb-8 animate-in fade-in-50 duration-200">
      {/* 1. Overview Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] lg:text-[32px] font-bold text-primary tracking-tight font-sans">
            Good morning, Sajibur
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Stay on top of your tasks, monitor progress, and track status.
          </p>
        </div>

        {/* Header Controls: Date range picker & Export button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date range picker pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-white hover:bg-surface text-xs font-semibold text-primary shadow-2xs transition-colors cursor-pointer"
              aria-label="Select date range"
              aria-expanded={isDateRangeOpen}
            >
              <Calendar className="w-3.5 h-3.5 text-secondary" />
              <span>{dateRange}</span>
              <ChevronDown className={cn('w-3 h-3 text-secondary transition-transform', isDateRangeOpen && 'rotate-180')} />
            </button>

            {isDateRangeOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-2xl shadow-lg py-1.5 z-40 animate-in fade-in-80 duration-150">
                {dateRangeOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setDateRange(opt);
                      setIsDateRangeOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer',
                      opt === dateRange
                        ? 'bg-surface text-primary font-semibold'
                        : 'text-secondary hover:bg-surface hover:text-primary'
                    )}
                  >
                    <span>{opt}</span>
                    {opt === dateRange && <Check className="w-3.5 h-3.5 text-accent" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-white hover:bg-surface text-xs font-semibold text-primary shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-secondary" />
            <span>{exportFeedback ? 'Exported!' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* 2. Upper Dashboard Grid Region */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Column 1: Total Balance + Wallets List */}
        <div className="md:col-span-1 xl:col-span-4 flex flex-col gap-5 sm:gap-6 justify-between">
          <BalanceCard
            amount={totalBalanceData.amount}
            currency={totalBalanceData.currency}
            changePercentage={totalBalanceData.changePercentage}
            period={totalBalanceData.period}
            onTransfer={() => {
              setTransferMode('transfer');
              setTransferModalOpen(true);
            }}
            onRequest={() => {
              setTransferMode('request');
              setTransferModalOpen(true);
            }}
            className="h-full"
          />

          <WalletList
            wallets={mockWallets}
            totalWalletsCount={6}
            onAddWallet={() => {
              setTransferMode('transfer');
              setTransferModalOpen(true);
            }}
            className="h-full"
          />
        </div>

        {/* Column 2: 4 Financial Metric Cards in 2x2 Grid */}
        <div className="md:col-span-1 xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} className="h-full" />
          ))}
        </div>

        {/* Column 3: Total Income (Profit & Loss) Stacked Bar Chart */}
        <div className="md:col-span-2 xl:col-span-4 h-full">
          <ProfitLossChart data={mockProfitLossData} className="h-full min-h-[340px]" />
        </div>
      </div>

      {/* 3. Lower Dashboard Grid Region */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Column 1: Monthly Spending Limit + My Cards */}
        <div className="xl:col-span-4 flex flex-col gap-5 sm:gap-6 justify-between">
          <SpendingLimitCard data={mockSpendingLimit} />
          <PaymentCards
            cards={cards}
            onAddCard={() => setAddCardModalOpen(true)}
          />
        </div>

        {/* Column 2: Recent Activities Table */}
        <div className="xl:col-span-8">
          <RecentActivityTable
            activities={mockRecentActivities}
            className="h-full"
          />
        </div>
      </div>

      {/* Interactive Modals */}
      <TransferModal
        isOpen={transferModalOpen}
        mode={transferMode}
        onClose={() => setTransferModalOpen(false)}
      />

      <AddCardModal
        isOpen={addCardModalOpen}
        onClose={() => setAddCardModalOpen(false)}
        onAddCard={handleAddNewCard}
      />
    </div>
  );
}

export default OverviewPage;
