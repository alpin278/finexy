import { Tabs, type TabItem } from '../ui/Tabs';

export type TransactionTab = 'all' | 'income' | 'expense';

export interface TransactionTabsProps {
  activeTab: TransactionTab;
  onChange: (tab: TransactionTab) => void;
}

const tabs: TabItem[] = [
  { id: 'all', label: 'All Transactions', count: 1248 },
  { id: 'income', label: 'Income', count: 412 },
  { id: 'expense', label: 'Expenses', count: 836 },
];

export function TransactionTabs({ activeTab, onChange }: TransactionTabsProps) {
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
