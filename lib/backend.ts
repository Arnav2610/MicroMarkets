/**
 * Local backend - persists store data to AsyncStorage.
 * Users are identified by name. Data survives app refresh.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User, Group, Market } from "@/data/store";

const STORAGE_KEY = "@micromarkets/data";
const LAST_USER_KEY = "@micromarkets/lastUser";

export interface PersistedState {
  users: User[];
  groups: Group[];
  markets: Market[];
  balanceCache: Record<string, number>;
  marketIdCounter: number;
}

export async function loadFromStorage(): Promise<PersistedState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export async function saveToStorage(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore save errors
  }
}

export async function loadLastUser(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
}

export async function saveLastUser(name: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_USER_KEY, name);
  } catch {
    // ignore
  }
}

export async function clearLastUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_USER_KEY);
  } catch {
    // ignore
  }
}

/** Clear all persisted data. Call resetStore() after this to clear in-memory state. */
export async function resetBackend(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY, LAST_USER_KEY]);
  } catch {
    // ignore
  }
}
