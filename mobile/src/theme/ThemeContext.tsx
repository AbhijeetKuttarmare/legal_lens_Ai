import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export type AppThemeMode = 'light' | 'dark';

export interface ThemePrefs {
  mode: AppThemeMode;
  accent: string;
  buttonColor: string;
}

// Same accent palette as the web settings panel (admin/src/consumer/theme.ts)
// for a consistent set of choices across platforms.
export const ACCENT_SWATCHES = ['#B08D57', '#3B82F6', '#10B981', '#F43F5E', '#8B5CF6', '#06B6D4'];

// GOLD (#B08D57) matches the app's existing default accent, so picking
// "default" doesn't change how the app looks for anyone already using it.
export const DEFAULT_THEME_PREFS: ThemePrefs = {
  mode: 'light',
  accent: '#B08D57',
  buttonColor: '#B08D57',
};

const STORAGE_KEY = 'app-theme-prefs';

// Semantic palette consumed by every screen via useAppTheme(). Light values
// match the app's existing (pre-dark-mode) look exactly, so mode: 'light'
// stays a no-op visually. Dark values reuse the same hex the web consumer
// portal's dark redesign uses (admin/src/consumer/consumer.css --cw-dark-*)
// so the two platforms feel like the same brand.
const LIGHT_PALETTE = {
  bg: '#F4F5F9',
  headerBg: '#0B1220',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF1F6',
  text: '#0B1220',
  textOnHeader: '#FFFFFF',
  textMuted: '#6B7280',
  textMutedOnHeader: '#B7C0D1',
  border: '#E7E9EF',
  bodyText: '#374151',
};

const DARK_PALETTE = {
  bg: '#0A101E',
  headerBg: '#0A101E',
  surface: '#121B2E',
  surfaceAlt: '#0E1626',
  text: '#F5F7FA',
  textOnHeader: '#F5F7FA',
  textMuted: '#8D97A8',
  textMutedOnHeader: '#8D97A8',
  border: 'rgba(255, 255, 255, 0.08)',
  bodyText: '#C6CCDA',
};

export interface AppTheme {
  mode: AppThemeMode;
  accent: string;
  buttonColor: string;
  bg: string;
  headerBg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textOnHeader: string;
  textMuted: string;
  textMutedOnHeader: string;
  border: string;
  bodyText: string;
  onAccent: string;
  paper: typeof MD3LightTheme;
  cardShadow: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

function buildTheme(prefs: ThemePrefs): AppTheme {
  const palette = prefs.mode === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
  const base = prefs.mode === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return {
    mode: prefs.mode,
    accent: prefs.accent,
    buttonColor: prefs.buttonColor,
    ...palette,
    onAccent: '#0B1220',
    paper: {
      ...base,
      roundness: 14,
      colors: {
        ...base.colors,
        primary: palette.text,
        secondary: prefs.accent,
        tertiary: prefs.accent,
        error: '#DC2626',
        background: palette.bg,
        surface: palette.surface,
      },
    },
    cardShadow:
      prefs.mode === 'dark'
        ? { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 3 }
        : { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  };
}

export function riskColor(level: 'LOW' | 'MEDIUM' | 'HIGH') {
  if (level === 'HIGH') return '#DC2626';
  if (level === 'MEDIUM') return '#D97706';
  return '#16A34A';
}

interface ThemeContextValue {
  theme: AppTheme;
  prefs: ThemePrefs;
  setPrefs: (prefs: ThemePrefs) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefsState] = useState<ThemePrefs>(DEFAULT_THEME_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          setPrefsState({
            mode: parsed.mode === 'dark' ? 'dark' : 'light',
            accent: typeof parsed.accent === 'string' ? parsed.accent : DEFAULT_THEME_PREFS.accent,
            buttonColor: typeof parsed.buttonColor === 'string' ? parsed.buttonColor : DEFAULT_THEME_PREFS.buttonColor,
          });
        }
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  const setPrefs = (next: ThemePrefs) => {
    setPrefsState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  };

  const theme = useMemo(() => buildTheme(prefs), [prefs]);

  // Render immediately with defaults rather than blocking on AsyncStorage —
  // avoids a blank-screen flash, and the theme swaps in a frame later if the
  // user had customized it.
  void loaded;

  return <ThemeContext.Provider value={{ theme, prefs, setPrefs }}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within a ThemeProvider');
  return ctx.theme;
}

export function useThemePrefs() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePrefs must be used within a ThemeProvider');
  return { prefs: ctx.prefs, setPrefs: ctx.setPrefs };
}
