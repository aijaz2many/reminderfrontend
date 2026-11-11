import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const sessionStore = {
  getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return Promise.resolve(globalThis.localStorage.getItem(key));
    return SecureStore.getItemAsync(key);
  },

  setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },

  deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};
