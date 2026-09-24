import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import type { AppearancePreference } from '../types/settings';

export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ResolvedTheme;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  preference: AppearancePreference;
  themePreference: AppearancePreference;
  setPreference: (preference: AppearancePreference, event?: React.MouseEvent | MouseEvent) => void;
  setThemePreference: (preference: AppearancePreference, event?: React.MouseEvent | MouseEvent) => void;
  toggleTheme: (event?: React.MouseEvent | MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'finexy:theme-preference';

function getStoredPreference(): AppearancePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // Local storage unavailable
  }
  return 'system';
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyThemeToDOM(theme: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<AppearancePreference>(getStoredPreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Derive resolvedTheme synchronously from preference and system theme
  const resolvedTheme: ResolvedTheme = preference === 'system' ? systemTheme : preference;
  const isDark = resolvedTheme === 'dark';

  // Listen to system prefers-color-scheme changes
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Sync DOM with resolvedTheme whenever resolvedTheme changes
  useEffect(() => {
    applyThemeToDOM(resolvedTheme);
  }, [resolvedTheme]);

  const setThemePreference = useCallback(
    (newPreference: AppearancePreference, event?: React.MouseEvent | MouseEvent) => {
      const nextResolved: ResolvedTheme =
        newPreference === 'system' ? systemTheme : newPreference;

      // If the visual theme does not change, update state/storage without visual animation
      if (nextResolved === resolvedTheme) {
        setPreferenceState(newPreference);
        try {
          localStorage.setItem(STORAGE_KEY, newPreference);
        } catch {
          // ignore
        }
        return;
      }

      const supportsViewTransition =
        typeof document !== 'undefined' &&
        'startViewTransition' in document &&
        typeof (document as unknown as { startViewTransition: unknown }).startViewTransition === 'function' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!supportsViewTransition) {
        applyThemeToDOM(nextResolved);
        setPreferenceState(newPreference);
        try {
          localStorage.setItem(STORAGE_KEY, newPreference);
        } catch {
          // ignore
        }
        return;
      }

      const clickX = event?.clientX;
      const clickY = event?.clientY;
      const x = clickX ?? window.innerWidth / 2;
      const y = clickY ?? window.innerHeight / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const doc = document as unknown as {
        startViewTransition: (callback: () => void) => { ready: Promise<void>; finished: Promise<void> };
      };

      try {
        const transition = doc.startViewTransition(() => {
          flushSync(() => {
            applyThemeToDOM(nextResolved);
            setPreferenceState(newPreference);
            try {
              localStorage.setItem(STORAGE_KEY, newPreference);
            } catch {
              // ignore
            }
          });
        });

        transition.ready
          .then(() => {
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 380,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'forwards',
                pseudoElement: '::view-transition-new(root)',
              }
            );
          })
          .catch(() => {
            // Handled aborted or interrupted transitions gracefully
          });
      } catch {
        applyThemeToDOM(nextResolved);
        setPreferenceState(newPreference);
        try {
          localStorage.setItem(STORAGE_KEY, newPreference);
        } catch {
          // ignore
        }
      }
    },
    [resolvedTheme, systemTheme]
  );

  const toggleTheme = useCallback(
    (event?: React.MouseEvent | MouseEvent) => {
      const nextTheme: ResolvedTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
      setThemePreference(nextTheme, event);
    },
    [resolvedTheme, setThemePreference]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolvedTheme,
      resolvedTheme,
      isDark,
      preference,
      themePreference: preference,
      setPreference: setThemePreference,
      setThemePreference,
      toggleTheme,
    }),
    [resolvedTheme, isDark, preference, setThemePreference, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { ThemeContext };
