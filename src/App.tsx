import { AppRouter } from './router/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PrivacyProvider } from './context/PrivacyContext';
import { DataRevalidationProvider } from './context/DataRevalidationContext';
import { FinancialRealtimeBridge } from './context/FinancialRealtimeBridge';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataRevalidationProvider><FinancialRealtimeBridge /><PrivacyProvider><AppRouter /></PrivacyProvider></DataRevalidationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
