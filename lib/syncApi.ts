/**
 * Sync API client - fetches/pushes shared state to the ledger server.
 * Enables multi-device demo: both phones use the same server state.
 *
 * Set EXPO_PUBLIC_LEDGER_API_URL to your machine's IP (e.g. http://192.168.1.x:3001)
 * so both devices can reach the server on the same LAN.
 */

import type { PersistedState } from "./backend";

const API_URL =
  (typeof process !== "undefined" &&
    (process as { env?: Record<string, string> }).env?.EXPO_PUBLIC_LEDGER_API_URL) ||
  "http://localhost:3001";

export async function fetchStateFromServer(): Promise<PersistedState | null> {
  try {
    const res = await fetch(`${API_URL}/api/state`);
    if (!res.ok) return null;
    return (await res.json()) as PersistedState;
  } catch {
    return null;
  }
}

export async function pushStateToServer(state: PersistedState): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    return res.ok;
  } catch {
    return false;
  }
}
