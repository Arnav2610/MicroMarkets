/**
 * Client for MicroMarkets Ledger - records trades on Solana via the ledger server.
 */

// Set EXPO_PUBLIC_LEDGER_API_URL in .env or app config. For iOS simulator use localhost; for physical device use your machine's IP.
const LEDGER_API_URL =
  (typeof process !== "undefined" && (process as { env?: Record<string, string> }).env?.EXPO_PUBLIC_LEDGER_API_URL) ||
  "http://localhost:3001";

export async function recordTradeOnChain(
  marketId: number,
  side: "yes" | "no",
  amount: number
): Promise<boolean> {
  try {
    const res = await fetch(`${LEDGER_API_URL}/record-trade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marketId,
        side: side === "yes",
        amount,
      }),
    });
    if (!res.ok) {
      console.warn("[Ledger] record-trade failed:", await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[Ledger] record-trade error:", err);
    return false;
  }
}
