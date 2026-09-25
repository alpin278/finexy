import { AppRouter } from './router/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PrivacyProvider } from './context/PrivacyContext';
import { DataRevalidationProvider } from './context/DataRevalidationContext';
import { FinancialRealtimeBridge } from './context/FinancialRealtimeBridge';
import { AppBootSplash } from './components/loading/AppBootSplash';
import { PwaRuntime } from './components/pwa/PwaRuntime';

export function App() {
  return (
    <PwaRuntime>
      <ThemeProvider>
        <AuthProvider>
          <DataRevalidationProvider>
            <FinancialRealtimeBridge />
            <PrivacyProvider>
              <AppRouter />
              <AppBootSplash />
            </PrivacyProvider>
          </DataRevalidationProvider>
        </AuthProvider>
      </ThemeProvider>
    </PwaRuntime>
  );
}

export default App;
