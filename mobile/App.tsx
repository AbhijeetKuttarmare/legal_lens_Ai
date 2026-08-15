import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './src/store/store';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

const paperSettings = {
  icon: (props: { name: string; color?: string; size: number; direction: 'rtl' | 'ltr' }) => (
    <MaterialCommunityIcons name={props.name as any} color={props.color} size={props.size} />
  ),
};

function ThemedApp() {
  const t = useAppTheme();
  return (
    <PaperProvider theme={t.paper} settings={paperSettings}>
      {/* Header/hero blocks stay dark navy at the top of nearly every screen
          in both theme modes, so light (white) status bar icons are always
          the right contrast choice here — this isn't theme-reactive. */}
      <StatusBar style="light" />
      <RootNavigator />
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ThemedApp />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
