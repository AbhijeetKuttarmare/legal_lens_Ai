import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1E3A8A',
    secondary: '#0EA5E9',
    error: '#DC2626',
  },
};

export const riskColor = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
  if (level === 'HIGH') return '#DC2626';
  if (level === 'MEDIUM') return '#D97706';
  return '#16A34A';
};
