import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import type { NavigationTab } from './types/navigation';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');

  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <AppShell currentTab={currentTab} onNavigate={setCurrentTab}>
      {renderCurrentPage()}
    </AppShell>
  );
}

export default App;
