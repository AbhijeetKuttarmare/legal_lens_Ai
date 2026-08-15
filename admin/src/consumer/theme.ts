import { useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

export type ThemePrefs = {
  mode: ThemeMode;
  accent: string;
  buttonColor: string;
};

export const DEFAULT_THEME: ThemePrefs = {
  mode: 'dark',
  accent: '#E8A93D',
  buttonColor: '#E8A93D',
};

export const ACCENT_SWATCHES = ['#E8A93D', '#3B82F6', '#10B981', '#F43F5E', '#8B5CF6', '#06B6D4'];

const STORAGE_KEY = 'cw-theme-prefs';

// Light-mode values for the tokens that the dark redesign (sidebar, topstrip,
// Home/Upload/Documents) reads. Swapped in via --cw-user-dark-* overrides so
// every component that already consumes --cw-dark-* picks up light mode for
// free, without per-component changes.
const LIGHT_OVERRIDES: Record<string, string> = {
  '--cw-user-dark-bg': '#F8FAFC',
  '--cw-user-dark-surface': '#FFFFFF',
  '--cw-user-dark-surface-2': '#F1F5F9',
  '--cw-user-dark-border': '#E5E7EB',
  '--cw-user-dark-text': '#111827',
  '--cw-user-dark-text-muted': '#6B7280',
  '--cw-user-dark-tint-03': 'rgba(17, 24, 39, 0.03)',
  '--cw-user-dark-tint-04': 'rgba(17, 24, 39, 0.05)',
  '--cw-user-dark-tint-06': 'rgba(17, 24, 39, 0.07)',
};

export function loadThemePrefs(): ThemePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw);
    return {
      mode: parsed.mode === 'light' ? 'light' : 'dark',
      accent: typeof parsed.accent === 'string' ? parsed.accent : DEFAULT_THEME.accent,
      buttonColor: typeof parsed.buttonColor === 'string' ? parsed.buttonColor : DEFAULT_THEME.buttonColor,
    };
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveThemePrefs(prefs: ThemePrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function applyThemePrefs(prefs: ThemePrefs) {
  const root = document.documentElement;
  root.dataset.cwTheme = prefs.mode;
  root.style.setProperty('--cw-user-accent', prefs.accent);
  root.style.setProperty('--cw-user-btn-color', prefs.buttonColor);

  if (prefs.mode === 'light') {
    for (const [prop, value] of Object.entries(LIGHT_OVERRIDES)) {
      root.style.setProperty(prop, value);
    }
  } else {
    for (const prop of Object.keys(LIGHT_OVERRIDES)) {
      root.style.removeProperty(prop);
    }
  }
}

export function useApplyStoredTheme() {
  useEffect(() => {
    applyThemePrefs(loadThemePrefs());
  }, []);
}
