export type NavigationTab =
  | 'overview'
  | 'transactions'
  | 'wallets'
  | 'budgets'
  | 'reports'
  | 'categories'
  | 'settings';

export interface NavItem {
  id: NavigationTab;
  label: string;
  path: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  tab?: NavigationTab;
  iconName: string;
  bottom?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

export function getActiveTabFromPath(pathname: string): NavigationTab | null {
  if (pathname === '/' || pathname === '/overview' || pathname.startsWith('/overview/')) return 'overview';
  if (pathname === '/transactions' || pathname.startsWith('/transactions/')) return 'transactions';
  if (pathname === '/wallets' || pathname.startsWith('/wallets/')) return 'wallets';
  if (pathname === '/budgets' || pathname.startsWith('/budgets/')) return 'budgets';
  if (pathname === '/categories' || pathname.startsWith('/categories/')) return 'categories';
  if (pathname === '/reports' || pathname.startsWith('/reports/')) return 'reports';
  if (pathname === '/settings' || pathname.startsWith('/settings/')) return 'settings';
  return null;
}

