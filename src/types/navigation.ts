export type NavigationTab = 'overview' | 'transactions' | 'categories' | 'reports' | 'settings';

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
