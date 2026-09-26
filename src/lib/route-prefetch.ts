import { loadBudgetPage, loadCategoryBudgetLayer } from './budgets';
import { loadCategoriesPage } from './categories';
import { loadOverviewPage } from './overview';
import { reportRange } from './date-time';
import { loadReportsData } from './reports';
import { loadTransactionsPage } from './transactions';
import { loadWalletsPage } from './wallets';

export function prefetchRouteData(path: string) {
  const request = path === '/overview'
    ? loadOverviewPage()
    : path === '/transactions'
      ? loadTransactionsPage()
      : path === '/wallets'
        ? Promise.all([loadWalletsPage(), loadTransactionsPage()])
        : path === '/budgets'
          ? loadBudgetPage()
          : path === '/categories'
            ? Promise.all([loadCategoriesPage(), loadCategoryBudgetLayer()])
            : path === '/reports'
              ? loadReportsData(reportRange('this-month'))
              : null;
  void request?.catch(() => undefined);
}
