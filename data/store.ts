/**
 * MicroMarkets data store.
 * Groups: in-memory (off-chain).
 * Markets, balances, positions, trades: Solana (via API).
 * Persisted via lib/backend (AsyncStorage).
 */

import * as api from "@/lib/api";
import { recordTradeOnChain } from "@/lib/ledgerApi";
import { saveToStorage, type PersistedState } from "@/lib/backend";

export interface User {
  id: string; // name (identifier)
  name: string;
  pubkey?: string;
}

export interface Group {
  id: string;
  name: string;
  joinCode: string;
  baseBuyIn: number;
  members: string[];
}

export interface PricePoint {
  timestamp: number;
  yesPercent: number;
}

export interface MarketTransaction {
  id: string;
  userId: string;
  side: "yes" | "no";
  amount: number;
  timestamp: number;
  type: "buy" | "sell";
}

export interface Market {
  id: string; // string representation of marketId (u64)
  marketId: number;
  groupId: string;
  question: string;
  creatorId: string;
  /** Total $ in YES pool */
  yesPool: number;
  /** Total $ in NO pool */
  noPool: number;
  positions: Record<string, { yes: number; no: number }>; // user's $ stake in each pool
  resolved: boolean;
  outcome: "YES" | "NO" | null;
  priceHistory: PricePoint[];
  transactions: MarketTransaction[];
}

// In-memory state (off-chain)
let users: User[] = [];
let groups: Group[] = [];
let markets: Market[] = []; // local cache of on-chain markets
let balanceCache: Record<string, number> = {};
let marketIdCounter = Math.floor(Date.now() / 1000);

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function ensureUniqueJoinCode(): string {
  let code = generateJoinCode();
  while (groups.some((g) => g.joinCode === code)) {
    code = generateJoinCode();
  }
  return code;
}

// --- Persistence ---
export function getPersistableState(): PersistedState {
  return {
    users: [...users],
    groups: groups.map((g) => ({ ...g, members: [...g.members] })),
    markets: markets.map((m) => ({
      ...m,
      positions: { ...m.positions },
      priceHistory: [...(m.priceHistory ?? [])],
      transactions: [...(m.transactions ?? [])],
    })),
    balanceCache: { ...balanceCache },
    marketIdCounter,
  };
}

export function hydrateStore(state: PersistedState): void {
  users = state.users ?? [];
  groups = state.groups ?? [];
  markets = state.markets ?? [];
  balanceCache = state.balanceCache ?? {};
  marketIdCounter = state.marketIdCounter ?? Math.floor(Date.now() / 1000);
  notifyStoreChange();
}

const storeListeners = new Set<() => void>();

export function subscribeToStore(callback: () => void): () => void {
  storeListeners.add(callback);
  return () => storeListeners.delete(callback);
}

function notifyStoreChange(): void {
  storeListeners.forEach((cb) => cb());
}

async function persist(): Promise<void> {
  await saveToStorage(getPersistableState());
  notifyStoreChange();
}

// --- User operations ---
export function createUser(name: string, pubkey?: string): User {
  const id = name.trim();
  if (!id) throw new Error("Name is required");
  const existing = users.find((u) => u.id === id);
  if (existing) return existing;
  const user: User = { id, name: id, pubkey };
  users.push(user);
  void persist();
  return user;
}

export function getOrCreateUser(name: string): User {
  const id = name.trim();
  if (!id) throw new Error("Name is required");
  const existing = users.find((u) => u.id === id);
  if (existing) return existing;
  return createUser(id);
}

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

// --- Balance (from chain, cached) ---
export function setBalanceCache(userId: string, balance: number): void {
  balanceCache[userId] = balance;
}

export function getBalanceFromCache(userId: string): number {
  return balanceCache[userId] ?? 0;
}

export async function refreshBalance(userId: string): Promise<number> {
  const balance = await api.getBalance(userId);
  balanceCache[userId] = balance;
  return balance;
}

// --- Group operations (off-chain) ---
export function createGroup(name: string, baseBuyIn: number, creatorId: string): Group {
  const id = `group-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const joinCode = ensureUniqueJoinCode();
  const group: Group = {
    id,
    name,
    joinCode,
    baseBuyIn,
    members: [creatorId],
  };
  groups.push(group);
  // Creator gets the buy-in amount
  setBalanceCache(creatorId, (balanceCache[creatorId] ?? 0) + baseBuyIn);
  void persist();
  return group;
}

export function joinGroup(joinCode: string, userId: string): Group | null {
  const group = groups.find((g) => g.joinCode.toUpperCase() === joinCode.toUpperCase());
  if (!group || group.members.includes(userId)) return null;
  group.members.push(userId);
  // New member gets the buy-in amount
  setBalanceCache(userId, (balanceCache[userId] ?? 0) + group.baseBuyIn);
  void persist();
  return group;
}

export function getGroupById(id: string): Group | undefined {
  return groups.find((g) => g.id === id);
}

export function getGroupsByUser(userId: string): Group[] {
  return groups.filter((g) => g.members.includes(userId));
}

export function getUserBalance(userId: string, _groupId?: string): number {
  return balanceCache[userId] ?? 0;
}

export function getTotalBalance(userId: string): number {
  return balanceCache[userId] ?? 0;
}

export function getGroupLeaderboard(
  groupId: string
): { userId: string; balance: number }[] {
  const group = getGroupById(groupId);
  if (!group) return [];
  return group.members
    .map((userId) => ({ userId, balance: balanceCache[userId] ?? 0 }))
    .sort((a, b) => b.balance - a.balance);
}

// --- Market operations (Solana via API) ---

function onChainToMarket(
  m: api.MarketData,
  groupId: string,
  creatorId: string,
  positions: Record<string, { yes: number; no: number }>,
  priceHistory: PricePoint[],
  transactions: MarketTransaction[]
): Market {
  const total = m.totalYesShares + m.totalNoShares;
  const yesPercent = total === 0 ? 50 : Math.round((m.totalYesShares / total) * 100);
  return {
    id: String(m.id),
    marketId: m.id,
    groupId,
    question: m.question,
    creatorId,
    yesPool: m.totalYesShares,
    noPool: m.totalNoShares,
    positions,
    resolved: m.resolved,
    outcome: m.outcome === null ? null : m.outcome ? "YES" : "NO",
    priceHistory,
    transactions,
  };
}

export async function createMarket(
  groupId: string,
  question: string,
  creatorId: string,
  yesPercent: number,
  noPercent: number,
  totalStake: number,
  email: string
): Promise<Market> {
  const marketId = marketIdCounter++;
  const closeTime = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days

  await api.createMarket(email, marketId, question, closeTime);

  const yesAmount = Math.floor((yesPercent / 100) * totalStake);
  const noAmount = Math.floor((noPercent / 100) * totalStake);
  if (yesAmount > 0) {
    await api.buyShares(email, marketId, true, yesAmount, yesPercent);
  }
  if (noAmount > 0) {
    await api.buyShares(email, marketId, false, noAmount, 100 - yesPercent);
  }

  const [marketData, trades] = await Promise.all([
    api.getMarket(marketId),
    api.getTradesForMarket(marketId),
  ]);

  // Use creator's stake as initial liquidity (API stub returns zeros)
  const positions: Record<string, { yes: number; no: number }> = {
    [creatorId]: { yes: yesAmount, no: noAmount },
  };
  let priceHistory = tradesToPriceHistory(trades);
  if (priceHistory.length === 1 && priceHistory[0].yesPercent === 50) {
    priceHistory[0].yesPercent = yesPercent; // Use creator's initial odds
  }
  const transactions = tradesToTransactions(trades);

  const market = onChainToMarket(
    marketData,
    groupId,
    creatorId,
    positions,
    priceHistory,
    transactions
  );
  market.question = question; // Use our question, not API stub
  market.yesPool = yesAmount; // $ in YES pool
  market.noPool = noAmount;   // $ in NO pool
  markets.push(market);
  // Deduct stake from creator's balance
  setBalanceCache(email, (balanceCache[email] ?? 0) - totalStake);
  void persist();
  return market;
}

function tradesToPriceHistory(trades: api.TradeData[]): PricePoint[] {
  let yesTotal = 0;
  let noTotal = 0;
  const points: PricePoint[] = [];
  for (const t of trades) {
    if (t.isBuy) {
      if (t.side) yesTotal += t.amount;
      else noTotal += t.amount;
    } else {
      if (t.side) yesTotal -= t.amount;
      else noTotal -= t.amount;
    }
    const total = yesTotal + noTotal;
    const yesPercent = total === 0 ? 50 : Math.round((yesTotal / total) * 100);
    points.push({ timestamp: t.timestamp * 1000, yesPercent });
  }
  if (points.length === 0) {
    points.push({ timestamp: Date.now(), yesPercent: 50 });
  }
  return points;
}

function tradesToTransactions(trades: api.TradeData[]): MarketTransaction[] {
  return trades.map((t, i) => ({
    id: `tx-${t.timestamp}-${i}`,
    userId: t.user,
    side: t.side ? "yes" : "no",
    amount: t.amount,
    timestamp: t.timestamp * 1000,
    type: t.isBuy ? "buy" : "sell",
  }));
}

function appendTradeToMarket(
  market: Market,
  userId: string,
  side: "yes" | "no",
  amount: number
): void {
  const now = Date.now();
  const total = market.yesPool + market.noPool;
  const yesPercent = total === 0 ? 50 : Math.round((market.yesPool / total) * 100);
  if (!market.priceHistory) market.priceHistory = [];
  market.priceHistory.push({ timestamp: now, yesPercent });
  if (!market.transactions) market.transactions = [];
  market.transactions.push({
    id: `tx-${now}-${market.transactions.length}`,
    userId,
    side,
    amount,
    timestamp: now,
    type: "buy",
  });
}

/** Add $amount to YES or NO pool. Amount is in dollars. */
export async function addToPool(
  marketIdOrId: number | string,
  userId: string,
  side: "yes" | "no",
  amount: number
): Promise<boolean> {
  const market = typeof marketIdOrId === "string"
    ? markets.find((m) => m.id === marketIdOrId)
    : markets.find((m) => m.marketId === marketIdOrId);
  if (!market || amount <= 0) return false;
  const cost = Math.round(amount * 100) / 100;
  if (cost > (balanceCache[userId] ?? 0)) return false;
  try {
    await api.buyShares(userId, market.marketId, side === "yes", cost, 50);
    const pos = market.positions[userId] ?? { yes: 0, no: 0 };
    if (side === "yes") {
      pos.yes += cost;
      market.yesPool += cost;
    } else {
      pos.no += cost;
      market.noPool += cost;
    }
    market.positions[userId] = pos;
    setBalanceCache(userId, (balanceCache[userId] ?? 0) - cost);
    appendTradeToMarket(market, userId, side, cost);
    void persist();
    void recordTradeOnChain(market.marketId, side, cost).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export async function resolveMarket(
  marketId: number,
  outcome: "YES" | "NO",
  email: string
): Promise<boolean> {
  try {
    await api.resolveMarket(email, marketId, outcome === "YES");
    const market = markets.find((m) => m.marketId === marketId);
    if (market) {
      market.resolved = true;
      market.outcome = outcome;
      // Parimutuel: total pool split proportionally to $ stake in winning pool. Losers get $0.
      const totalPool = market.yesPool + market.noPool;
      const winningPool = outcome === "YES" ? market.yesPool : market.noPool;
      const multiplier = winningPool > 0 ? totalPool / winningPool : 0;
      for (const [userId, pos] of Object.entries(market.positions)) {
        const stake = outcome === "YES" ? pos.yes : pos.no;
        if (stake > 0 && multiplier > 0) {
          const payout = Math.round(stake * multiplier * 100) / 100;
          setBalanceCache(userId, (balanceCache[userId] ?? 0) + payout);
        }
      }
      void persist();
    }
    return true;
  } catch {
    return false;
  }
}

export function getMarketById(id: string): Market | undefined {
  return markets.find((m) => m.id === id);
}

export function getActiveMarketsByGroup(groupId: string): Market[] {
  return markets.filter((m) => m.groupId === groupId && !m.resolved);
}

export function getResolvedMarketsByGroup(groupId: string): Market[] {
  return markets.filter((m) => m.groupId === groupId && m.resolved);
}

export function getActiveMarketsForUser(userId: string): Market[] {
  const userGroups = getGroupsByUser(userId);
  const groupIds = new Set(userGroups.map((g) => g.id));
  return markets.filter((m) => groupIds.has(m.groupId) && !m.resolved);
}

export function getYesOdds(market: Market): number {
  const total = market.yesPool + market.noPool;
  return total === 0 ? 50 : Math.round((market.yesPool / total) * 100);
}

export function getNoOdds(market: Market): number {
  const total = market.yesPool + market.noPool;
  return total === 0 ? 50 : Math.round((market.noPool / total) * 100);
}

export function getMarketPriceHistory(market: Market): PricePoint[] {
  return market.priceHistory ?? [];
}

export function getMarketRecentTransactions(
  market: Market,
  limit = 5
): MarketTransaction[] {
  const txs = market.transactions ?? [];
  return [...txs].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

export async function refreshMarket(marketId: number): Promise<Market | null> {
  const market = markets.find((m) => m.marketId === marketId);
  if (!market) return null;
  try {
    const [marketData, trades] = await Promise.all([
      api.getMarket(marketId),
      api.getTradesForMarket(marketId),
    ]);
    const positions: Record<string, { yes: number; no: number }> = {};
    for (const member of getGroupById(market.groupId)?.members ?? []) {
      const pos = await api.getPosition(member, marketId);
      positions[member] = { yes: pos.yesShares, no: pos.noShares };
    }
    const priceHistory = tradesToPriceHistory(trades);
    const transactions = tradesToTransactions(trades);
    const updated = onChainToMarket(
      marketData,
      market.groupId,
      market.creatorId,
      positions,
      priceHistory,
      transactions
    );
    const idx = markets.findIndex((m) => m.marketId === marketId);
    if (idx >= 0) markets[idx] = updated;
    return updated;
  } catch {
    return null;
  }
}

export function resetStore(): void {
  users = [];
  groups = [];
  markets = [];
  balanceCache = {};
}
