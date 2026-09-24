import { useState } from 'react';
import { FinexySplash } from '../components/loading/FinexySplash';
import { useTheme } from '../context/useTheme';
import { Icon } from '../components/ui/Icon';

type ViewportMode = 'fullscreen' | 'desktop' | 'mobile';

export function LoadingPreviewPage() {
  const { preference, resolvedTheme, setPreference } = useTheme();
  const [viewportMode, setViewportMode] = useState<ViewportMode>('fullscreen');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isControlsMinimized, setIsControlsMinimized] = useState(false);

  return (
    <div className="relative min-h-screen w-full bg-canvas text-primary font-sans antialiased">
      {/* Studio Header / Floating Controls */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-[#24241F] bg-[#141411]/90 px-4 py-2.5 backdrop-blur-md transition-all">
        {/* Brand & Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#FF5A36] shadow-[0_0_8px_#FF5A36]" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-white">
              FINEXY
            </span>
          </div>
          <span className="rounded border border-[#2E2E28] bg-[#1A1A17] px-2 py-0.5 font-mono text-[11px] text-[#9C9C94]">
            Stitch Refined v1.1
          </span>
        </div>

        {/* Studio Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Viewport Stage Selector */}
          <div className="flex items-center rounded-lg border border-[#282822] bg-[#1A1A17] p-1 text-xs">
            <button
              id="btn-view-fullscreen"
              type="button"
              onClick={() => setViewportMode('fullscreen')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
                viewportMode === 'fullscreen'
                  ? 'bg-[#252520] text-white shadow-sm'
                  : 'text-[#9C9C94] hover:text-white'
              }`}
            >
              <Icon name="arrows-fullscreen" className="text-[11px] text-accent" />
              Full Screen
            </button>
            <button
              id="btn-view-desktop"
              type="button"
              onClick={() => setViewportMode('desktop')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
                viewportMode === 'desktop'
                  ? 'bg-[#252520] text-white shadow-sm'
                  : 'text-[#9C9C94] hover:text-white'
              }`}
            >
              <Icon name="display" className="text-[11px]" />
              1366×768
            </button>
            <button
              id="btn-view-mobile"
              type="button"
              onClick={() => setViewportMode('mobile')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
                viewportMode === 'mobile'
                  ? 'bg-[#252520] text-white shadow-sm'
                  : 'text-[#9C9C94] hover:text-white'
              }`}
            >
              <Icon name="phone" className="text-[11px]" />
              390×844
            </button>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center rounded-lg border border-[#282822] bg-[#1A1A17] p-1 text-xs">
            <button
              id="btn-theme-dark"
              type="button"
              onClick={() => setPreference('dark')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-all ${
                resolvedTheme === 'dark' && preference !== 'system'
                  ? 'bg-[#24241F] text-white shadow-sm'
                  : 'text-[#9C9C94] hover:text-white'
              }`}
            >
              <Icon name="moon" className="text-[11px]" />
              Dark
            </button>
            <button
              id="btn-theme-light"
              type="button"
              onClick={() => setPreference('light')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-all ${
                resolvedTheme === 'light' && preference !== 'system'
                  ? 'bg-[#EAE7E0] text-[#191815] shadow-sm'
                  : 'text-[#9C9C94] hover:text-white'
              }`}
            >
              <Icon name="sun" className="text-[11px]" />
              Light
            </button>
            <button
              id="btn-theme-system"
              type="button"
              onClick={() => setPreference('system')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-all ${
                preference === 'system'
                  ? 'bg-[#24241F] text-white shadow-sm'
                  : 'text-[#9C9C94] hover:text-white'
              }`}
            >
              <Icon name="laptop" className="text-[11px]" />
              System
            </button>
          </div>

          {/* Reduced Motion Toggle */}
          <button
            id="btn-motion-toggle"
            type="button"
            onClick={() => setReducedMotion(!reducedMotion)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
              reducedMotion
                ? 'border-accent/40 bg-accent/15 text-accent'
                : 'border-[#282822] bg-[#1A1A17] text-[#9C9C94] hover:text-white'
            }`}
          >
            <Icon name="play-circle" className="text-[11px]" />
            Motion: {reducedMotion ? 'Reduced' : 'Normal'}
          </button>

          {/* Minimize / Hide Studio Chrome Toggle */}
          <button
            type="button"
            aria-label={isControlsMinimized ? 'Show studio specs' : 'Hide studio specs'}
            onClick={() => setIsControlsMinimized(!isControlsMinimized)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#282822] bg-[#1A1A17] text-[#9C9C94] hover:text-white"
          >
            <Icon name={isControlsMinimized ? 'chevron-down' : 'chevron-up'} className="text-[11px]" />
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main
        className={`flex w-full items-center justify-center transition-all ${
          viewportMode === 'fullscreen'
            ? 'h-screen p-0 pt-0'
            : 'min-h-screen p-6 pt-20 pb-16'
        }`}
      >
        {viewportMode === 'fullscreen' ? (
          /* Pure Full-Screen Stage */
          <div className="relative h-full w-full">
            <FinexySplash
              fullScreen={false}
              reducedMotion={reducedMotion}
              className="h-full w-full"
            />
          </div>
        ) : viewportMode === 'desktop' ? (
          /* 1366x768 Simulated Display Frame */
          <div className="flex flex-col items-center">
            <div className="relative h-[768px] w-[1366px] max-w-[95vw] overflow-hidden rounded-2xl border border-[#2B2B26] shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
              <FinexySplash
                fullScreen={false}
                reducedMotion={reducedMotion}
                className="h-full w-full"
              />
            </div>
            <p className="mt-3 font-mono text-[11px] text-[#74746C]">1366 × 768 Desktop Viewport Simulation</p>
          </div>
        ) : (
          /* 390x844 Mobile Device Frame */
          <div className="flex flex-col items-center">
            <div className="relative h-[844px] w-[390px] max-h-[85vh] overflow-hidden rounded-[44px] border-[6px] border-[#2B2B26] shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
              {/* Dynamic Island / Speaker notch simulation */}
              <div className="pointer-events-none absolute top-3 left-1/2 z-20 h-4 w-28 -translate-x-1/2 rounded-full bg-[#1A1A17]" />
              <FinexySplash
                fullScreen={false}
                reducedMotion={reducedMotion}
                trackWidthClass="w-[120px]"
                className="h-full w-full"
              />
            </div>
            <p className="mt-3 font-mono text-[11px] text-[#74746C]">390 × 844 Mobile Viewport Simulation</p>
          </div>
        )}
      </main>

      {/* Technical Spec Footer Bar (matches Google Stitch Screen #2 footer specs) */}
      {!isControlsMinimized && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#24241F] bg-[#141411]/90 px-6 py-2.5 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-[#9C9C94]">
              <span>
                <strong className="text-white">Duration:</strong> 2.25s cycle (~1.6s active travel + ~0.35s pulse + ~0.3s calm pause)
              </span>
              <span>
                <strong className="text-white">Easing:</strong> cubic-bezier(0.22, 1, 0.36, 1)
              </span>
              <span>
                <strong className="text-white">Accent:</strong> #FF5A36 (Selective 4% screen weight)
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-[#55B88B]">
              <span>✓ No spinners</span>
              <span>✓ No generic SaaS blobs</span>
              <span>✓ Pure negative space</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default LoadingPreviewPage;
