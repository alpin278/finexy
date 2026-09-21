import { AppRouter } from './router/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { PrivacyProvider } from './context/PrivacyContext';

export function App() {
  return (
    <AuthProvider>
      <PrivacyProvider><AppRouter /></PrivacyProvider>
    </AuthProvider>
  );
}

export default App;
