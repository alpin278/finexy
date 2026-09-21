import { AppRouter } from './router/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { PrivacyProvider } from './context/PrivacyContext';
import { DataRevalidationProvider } from './context/DataRevalidationContext';

export function App() {
  return (
    <AuthProvider>
      <DataRevalidationProvider><PrivacyProvider><AppRouter /></PrivacyProvider></DataRevalidationProvider>
    </AuthProvider>
  );
}

export default App;
