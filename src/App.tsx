import { AppRouter } from './router/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { PrivacyProvider } from './context/PrivacyContext';
import { DataRevalidationProvider } from './context/DataRevalidationContext';
import { FinancialRealtimeBridge } from './context/FinancialRealtimeBridge';

export function App() {
  return (
    <AuthProvider>
      <DataRevalidationProvider><FinancialRealtimeBridge /><PrivacyProvider><AppRouter /></PrivacyProvider></DataRevalidationProvider>
    </AuthProvider>
  );
}

export default App;
