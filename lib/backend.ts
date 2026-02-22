/**
 * Local backend - persists store data to AsyncStorage.
 * When EXPO_PUBLIC_LEDGER_API_URL is set, also syncs with server for multi-device demo.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User, Group, Market } from "@/data/store";
import { fetchStateFromServer, pushStateToServer } from "@/lib/syncApi";

const STORAGE_KEY = "@micromarkets/data";
const LAST_USER_KEY = "@micromarkets/lastUser";

export interface PersistedState {
  users: User[];
  groups: Group[];
  markets: Market[];
  balanceCache: Record<string, number>;
  marketIdCounter: number;
}

/** Load state: try server first (for multi-device), else local AsyncStorage */
export async function loadFromStorage(): Promise<PersistedState | null> {
  try {
    const serverState = await fetchStateFromServer();
    if (serverState) return serverState;
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PersistedState;
    } catch {
      return null;
    }
  }
}

/** Save state to local storage and push to server (for multi-device sync) */
export async function saveToStorage(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    await pushStateToServer(state);
  } catch {
    // ignore save errors
  }
}

/** Fetch latest state from server (call before join to get groups created on other devices) */
export async function refreshFromServer(): Promise<PersistedState | null> {
  return fetchStateFromServer();
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
