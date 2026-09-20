import { Tabs, type TabItem } from '../ui/Tabs';

export type TransactionTab = 'all' | 'income' | 'expense';

export interface TransactionTabsProps {
  activeTab: TransactionTab;
  onChange: (tab: TransactionTab) => void;
  counts: { all: number; income: number; expense: number };
}

export function TransactionTabs({ activeTab, onChange, counts }: TransactionTabsProps) {
  const tabs: TabItem[] = [
    { id: 'all', label: 'All Transactions', count: counts.all },
    { id: 'income', label: 'Income', count: counts.income },
    { id: 'expense', label: 'Expenses', count: counts.expense },
  ];
  return (
    <Tabs
      tabs={tabs}
      activeTab={activeTab}
      onChange={(tab) => onChange(tab as TransactionTab)}
      size="sm"
      className="w-full sm:w-auto overflow-x-auto"
    />
  );
}

export default TransactionTabs;
