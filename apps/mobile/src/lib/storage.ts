import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Minimal async key-value interface used for persisting auth tokens.
interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// expo-secure-store has no web implementation, so fall back to localStorage
// on web (fine for dev verification; native uses the encrypted keystore).
const webStorage: KeyValueStore = {
  async getItem(key) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // ignore
    }
  },
  async removeItem(key) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // ignore
    }
  },
};

const nativeStorage: KeyValueStore = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const storage: KeyValueStore = Platform.OS === 'web' ? webStorage : nativeStorage;
