/**
 * Per-device console preferences.
 *
 * These describe this browser rather than the account, so they live in
 * localStorage rather than on the user document — and each one is applied as an
 * attribute on <html>, which CSS keys off. A preference that only stores a
 * value and changes nothing is worse than no preference at all.
 */

const KEYS = {
  compactTables: 'lumina.prefs.compactTables',
  reduceMotion: 'lumina.prefs.reduceMotion',
};

export const DEFAULT_PREFS = {
  compactTables: false,
  reduceMotion: false,
};

export function readConsolePrefs() {
  try {
    return {
      compactTables: localStorage.getItem(KEYS.compactTables) === 'true',
      reduceMotion: localStorage.getItem(KEYS.reduceMotion) === 'true',
    };
  } catch {
    // Private mode or blocked storage: fall back to the defaults.
    return { ...DEFAULT_PREFS };
  }
}

/** Writes the preferences and applies them to the document in one step. */
export function writeConsolePrefs(prefs) {
  try {
    localStorage.setItem(KEYS.compactTables, String(prefs.compactTables));
    localStorage.setItem(KEYS.reduceMotion, String(prefs.reduceMotion));
  } catch {
    // They still apply for this session.
  }
  applyConsolePrefs(prefs);
  return prefs;
}

/** The attributes src/styles/theme.css keys off. */
export function applyConsolePrefs(prefs = readConsolePrefs()) {
  const root = document.documentElement;
  root.toggleAttribute('data-compact-tables', prefs.compactTables);
  root.toggleAttribute('data-reduce-motion', prefs.reduceMotion);
}
