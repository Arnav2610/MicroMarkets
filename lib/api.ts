/**
 * API layer for Solana/MicroMarkets program.
 * Stub implementation - wire to your backend or Solana RPC when ready.
 */

export interface MarketData {
  id: number;
  question: string;
  closeTime: number;
  resolved: boolean;
  outcome: boolean | null;
  totalYesShares: number;
  totalNoShares: number;
  authority: string;
}

export interface TradeData {
  market: string;
  user: string;
  side: boolean;
  amount: number;
  price: number;
  timestamp: number;
  isBuy: boolean;
}

export interface PositionData {
  yesShares: number;
  noShares: number;
}

// Stub implementations - replace with real Solana/backend calls
export async function getBalance(userId: string): Promise<number> {
  // TODO: Fetch from chain via backend
  return 1000;
}

export async function createMarket(
  email: string,
  marketId: number,
  question: string,
  closeTime: number
): Promise<void> {
  // TODO: Call Solana program
  await Promise.resolve();
}

export async function buyShares(
  userId: string,
  marketId: number,
  side: boolean,
  amount: number,
  price: number
): Promise<void> {
  // TODO: Call Solana program
  await Promise.resolve();
}

export async function sellShares(
  userId: string,
  marketId: number,
  side: boolean,
  amount: number,
  price: number
): Promise<void> {
  // TODO: Call Solana program
  await Promise.resolve();
}

export async function resolveMarket(
  email: string,
  marketId: number,
  outcome: boolean
): Promise<void> {
  // TODO: Call Solana program
  await Promise.resolve();
}

export async function getMarket(marketId: number): Promise<MarketData> {
  // TODO: Fetch from chain
  return {
    id: marketId,
    question: "",
    closeTime: 0,
    resolved: false,
    outcome: null,
    totalYesShares: 0,
    totalNoShares: 0,
    authority: "",
  };
}

export async function getPosition(
  userId: string,
  marketId: number
): Promise<PositionData> {
  // TODO: Fetch from chain
  return { yesShares: 0, noShares: 0 };
}

export async function getTradesForMarket(marketId: number): Promise<TradeData[]> {
  // TODO: Fetch from chain
  return [];
}
