import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute, RootRoute } from '../components/auth/AuthRoutes';
import { AppShell } from '../components/layout/AppShell';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { OverviewPage } from '../pages/OverviewPage';
import { TransactionsPage } from '../pages/TransactionsPage';
import { WalletsPage } from '../pages/WalletsPage';
import { BudgetsPage } from '../pages/BudgetsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { CategoriesPage } from '../pages/CategoriesPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { LoadingPreviewPage } from '../pages/LoadingPreviewPage';
import { LandingPreviewPage } from '../pages/LandingPreviewPage';
import { LandingPage } from '../pages/LandingPage';

export const router = createBrowserRouter([
  ...(import.meta.env.DEV
    ? [
        {
          path: 'loading-preview',
          element: <LoadingPreviewPage />,
        },
        {
          path: 'landing-preview',
          element: <LandingPreviewPage />,
        },
      ]
    : []),
  {
    path: '/',
    element: (
      <RootRoute>
        <LandingPage />
      </RootRoute>
    ),
  },
  {
    path: 'verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: 'forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: 'reset-password',
    element: <ResetPasswordPage />,
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: 'overview',
            element: <OverviewPage />,
          },
          {
            path: 'transactions',
            element: <TransactionsPage />,
          },
          {
            path: 'wallets',
            element: <WalletsPage />,
          },
          {
            path: 'budgets',
            element: <BudgetsPage />,
          },
          {
            path: 'reports',
            element: <ReportsPage />,
          },
          {
            path: 'categories',
            element: <CategoriesPage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

export default AppRouter;
