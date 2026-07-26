import { MD3LightTheme } from 'react-native-paper';

export const NAVY = '#0B1220';
export const NAVY_SOFT = '#152238';
export const GOLD = '#D4AF37';
export const GOLD_SOFT = '#F1E3B8';
export const BG = '#F4F5F9';
export const TEXT_MUTED = '#6B7280';
export const BORDER = '#E7E9EF';

export const theme = {
  ...MD3LightTheme,
  roundness: 14,
  colors: {
    ...MD3LightTheme.colors,
    primary: NAVY,
    secondary: GOLD,
    tertiary: GOLD,
    error: '#DC2626',
    background: BG,
    surface: '#FFFFFF',
  },
};

export const riskColor = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
  if (level === 'HIGH') return '#DC2626';
  if (level === 'MEDIUM') return '#D97706';
  return '#16A34A';
};

export const cardShadow = {
  shadowColor: '#0B1220',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};
