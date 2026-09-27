import { loadBudgetPage, loadCategoryBudgetLayer } from './budgets';
import { loadCategoriesPage } from './categories';
import { loadOverviewPage } from './overview';
import { reportRange } from './date-time';
import { loadReportsData } from './reports';
import { loadTransactionsPage } from './transactions';
import { loadWalletsPage } from './wallets';
import { currentBudgetPeriod } from './budget-utils';
import { isPageDataCacheFresh, isPageDataRequestInFlight } from './page-data-cache';

const primaryRoutePaths = ['/overview', '/transactions', '/wallets', '/budgets', '/categories', '/reports'] as const;
let warming: Promise<void> | null = null;

function routeCacheKeys(path: string) {
  if (path === '/overview') return [`overview:${currentBudgetPeriod()}`];
  if (path === '/transactions') return ['transactions'];
  if (path === '/wallets') return ['wallets', 'transactions'];
  if (path === '/budgets') return ['budgets:default'];
  if (path === '/categories') return ['categories', 'category-budget-layer:default'];
  if (path === '/reports') {
    const range = reportRange('this-month');
    return [`reports:${range.start}:${range.end}`];
  }
  return [];
}

export function prefetchRouteData(path: string): Promise<void> {
  const keys = routeCacheKeys(path);
  if (keys.length && keys.every((key) => isPageDataCacheFresh(key) || isPageDataRequestInFlight(key))) return Promise.resolve();
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
  return request ? Promise.resolve(request).then(() => undefined, () => undefined) : Promise.resolve();
}

export function warmPrimaryRouteData(currentPath: string) {
  if (warming) return warming;
  warming = (async () => {
    const routes = primaryRoutePaths.filter((path) => path !== currentPath);
    for (let index = 0; index < routes.length; index += 2) {
      await Promise.all(routes.slice(index, index + 2).map(prefetchRouteData));
    }
  })().finally(() => { warming = null; });
  return warming;
}
