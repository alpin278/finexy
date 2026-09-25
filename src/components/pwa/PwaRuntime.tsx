import { useEffect, useState, type ReactNode } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { PwaContext } from './pwa-context';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isStandalone() {
  return typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function PwaRuntime({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandalone);
  const isIOS = isIOSDevice();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (outcome === 'accepted') setIsInstalled(true);
  };

  if (!isOnline) return <OfflineState />;

  return (
    <PwaContext.Provider value={{ canInstall: Boolean(installPrompt) && !isInstalled, isIOS, isInstalled, promptInstall }}>
      {needRefresh && <PwaUpdatePrompt onUpdate={() => void updateServiceWorker(true)} />}
      {children}
    </PwaContext.Provider>
  );
}

function PwaUpdatePrompt({ onUpdate }: { onUpdate: () => void }) {
  return (
    <div className="finexy-safe-bottom fixed inset-x-4 bottom-0 z-[70] sm:left-auto sm:w-[min(24rem,calc(100vw-2rem))]" role="status" aria-live="polite">
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-elevated">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">Finexy update available</p>
          <p className="mt-0.5 text-xs text-secondary">Refresh when you are ready to use the latest version.</p>
        </div>
        <button type="button" onClick={onUpdate} className="shrink-0 rounded-full bg-dark px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-dark-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25">
          Update now
        </button>
      </div>
    </div>
  );
}

function OfflineState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 text-primary" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="w-full max-w-sm rounded-[28px] border border-border bg-card p-6 text-center shadow-card sm:p-8">
        <img src="/icons/finexy-192.svg" alt="Finexy" className="mx-auto h-16 w-16 rounded-2xl" />
        <h1 className="mt-5 text-xl font-bold tracking-tight">Internet connection required</h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">Finexy keeps current financial data network-driven. Reconnect to access your account and safely manage your finances.</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-full bg-dark px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-dark-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25">
          Try again
        </button>
      </div>
    </main>
  );
}
