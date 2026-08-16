import axios from 'axios';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/env';
import { store } from '../store/store';
import { setUnauthenticated } from '../store/authSlice';
import { clearSession } from '../auth/session';

export const TOKEN_KEY = 'legallens_access_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let loggingOut = false;

// A 401 here means the JWT itself is invalid/expired OR the account was
// just banned (jwt.strategy.ts re-checks isBanned on every request) — either
// way the session is dead, so log out and surface why rather than leaving
// stale screens that keep failing silently.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && !loggingOut) {
      loggingOut = true;
      const message =
        (error.response.data as { message?: string })?.message ||
        'Your session has ended. Please sign in again.';
      await clearSession();
      store.dispatch(setUnauthenticated());
      Alert.alert('Signed out', message, [{ text: 'OK', onPress: () => (loggingOut = false) }]);
    }
    return Promise.reject(error);
  },
);

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] };
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
    return error.message;
  }
  return 'Something went wrong';
}
