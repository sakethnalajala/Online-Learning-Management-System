import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'lumina.theme';
export const THEMES = { DARK: 'dark', LIGHT: 'light' };

/**
 * Reads the stored preference, falling back to the OS setting and then to dark,
 * which is this product's primary theme.
 */
function initialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === THEMES.DARK || stored === THEMES.LIGHT) return stored;
  } catch {
    /* private mode / blocked storage — fall through to the OS preference */
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? THEMES.LIGHT : THEMES.DARK;
  }

  return THEMES.DARK;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(initialTheme);

  // `data-theme` on <html> is what every CSS variable keys off, so this single
  // attribute repaints the entire application.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;

    // Keep the browser chrome (mobile address bar) in step.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === THEMES.LIGHT ? '#f5f4fa' : '#0b0a14');

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* the theme still applies for this session */
    }
  }, [theme]);

  // Follow the OS only while the user has not made an explicit choice.
  useEffect(() => {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (stored) return undefined;

    const query = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (event) => setThemeState(event.matches ? THEMES.LIGHT : THEMES.DARK);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((next) => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((current) => (current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK)),
    []
  );

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === THEMES.DARK,
      isLight: theme === THEMES.LIGHT,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
