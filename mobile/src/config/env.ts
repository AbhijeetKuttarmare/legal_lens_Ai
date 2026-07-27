import { Platform } from 'react-native';

// Android emulator maps host machine's localhost to 10.0.2.2.
// iOS simulator can use localhost directly.
// If testing on a physical device via Expo Go, replace this with your machine's LAN IP, e.g. http://192.168.1.10:3000/api
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

const PRODUCTION_API_BASE_URL = 'https://legallens-backend-twbd.onrender.com/api';

export const API_BASE_URL = __DEV__ ? `http://${DEV_HOST}:5000/api` : PRODUCTION_API_BASE_URL;
