import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../api/client';
import { AuthUser } from '../api/types';

const USER_KEY = 'legallens_user';

export async function persistSession(token: string, user: AuthUser) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function loadSession(): Promise<AuthUser | null> {
  const [token, userJson] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(USER_KEY),
  ]);
  if (!token || !userJson) return null;
  return JSON.parse(userJson) as AuthUser;
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
