import { useAuth } from "@/context/AuthContext";
import { useStoreRefresh } from "@/context/StoreContext";
import {
  addToPool,
  getGroupById,
  getMarketById,
  getMarketPriceHistory,
  getMarketRecentTransactions,
  getNoOdds,
  getUserBalance,
  getUserById,
  getYesOdds,
  hydrateStore,
  getOrCreateUser,
  refreshMarket,
  resolveMarket,
} from "@/data/store";
import { refreshFromServer } from "@/lib/backend";
import { useLayout } from "@/hooks/useLayout";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MarketPriceChart } from "../components/MarketPriceChart";
import { OddsBar } from "../components/OddsBar";

function formatTransactionTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "Just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return `${Math.floor(diff / 86400_000)}d ago`;
}
// ZUNFTM
export function MarketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const layout = useLayout();
  const { user } = useAuth();
  const [tradeModal, setTradeModal] = useState<"buy-yes" | "buy-no" | null>(null);
  const [tradeAmount, setTradeAmount] = useState("");
  const [resolveModal, setResolveModal] = useState(false);
  const [resolveOutcome, setResolveOutcome] = useState<"YES" | "NO" | null>(null);
  const [refresh, setRefresh] = useState(0);
  useStoreRefresh();

  const refreshMarketData = useCallback(async () => {
    const state = await refreshFromServer();
    if (state) {
      hydrateStore(state);
      if (user?.id) getOrCreateUser(user.id);
    }
    const m = getMarketById(id || "");
    if (m) void refreshMarket(m.marketId);
  }, [id, user?.id]);

  useFocusEffect(
    useCallback(() => {
      refreshMarketData();
      const interval = setInterval(refreshMarketData, 1000);
      return () => clearInterval(interval);
    }, [refreshMarketData])
  );

  const market = getMarketById(id || "");
  const group = market ? getGroupById(market.groupId) : undefined;

  if (!market) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Market not found</Text>
      </View>
    );
  }

  const isCreator = user && market.creatorId === user.id;
  const yesOdds = getYesOdds(market);
  const noOdds = getNoOdds(market);
  const userPosition = user ? market.positions[user.id] : undefined;
  const userYes = userPosition?.yes ?? 0;
  const userNo = userPosition?.no ?? 0;
  const userBalance = user && group ? getUserBalance(user.id, market.groupId) : 0;

  const handleTrade = async (action: "buy-yes" | "buy-no") => {
    if (!user) return;
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Enter a valid amount ($)");
      return;
    }
    const side = action.includes("yes") ? "yes" : "no";
    if (amount > userBalance) {
      Alert.alert("Error", `Insufficient balance. You have $${Math.round(userBalance)}`);
      return;
    }
    const ok = await addToPool(market.id, user.id, side, amount);
    if (ok) {
      setTradeAmount("");
      setTradeModal(null);
      setRefresh((r) => r + 1);
    } else {
      Alert.alert("Error", "Could not complete trade");
    }
  };

  const handleResolve = async () => {
    if (!user || !isCreator || !resolveOutcome) return;
    await resolveMarket(market.marketId, resolveOutcome, user.id);
    setResolveModal(false);
    setResolveOutcome(null);
    Alert.alert("Resolved", `Market resolved as ${resolveOutcome}`);
    router.back();
  };

  if (market.resolved) {
    return (
      <View style={styles.container}>
        <View style={[styles.fixedHeader, { paddingHorizontal: layout.paddingH, paddingTop: layout.headerPaddingTop, paddingBottom: layout.headerPaddingBottom }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={20} color="#9ca3af" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          {group && (
            <Text style={styles.groupLabel}>{group.name}</Text>
          )}
          <Text style={styles.question} numberOfLines={3}>{market.question}</Text>
        </View>
        <View style={[styles.inner, { paddingHorizontal: layout.paddingH, paddingTop: layout.gapMd }]}>
          <View style={styles.resolvedBadge}>
            <Text
              style={[
                styles.resolvedText,
                market.outcome === "YES" ? styles.outcomeYes : styles.outcomeNo,
              ]}
            >
              Resolved: {market.outcome}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed header - does not scroll */}
      <View style={[styles.fixedHeader, { paddingHorizontal: layout.paddingH, paddingTop: layout.headerPaddingTop, paddingBottom: layout.headerPaddingBottom }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color="#9ca3af" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        {group && (
          <Text style={styles.groupLabel}>{group.name}</Text>
        )}
        <Text style={styles.question} numberOfLines={3}>{market.question}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.inner, { paddingHorizontal: layout.paddingH }]}>
          <View style={[styles.content, { gap: layout.gapMd }]}>
            <View style={styles.oddsSection}>
              <OddsBar
                yesOdds={yesOdds}
                noOdds={noOdds}
                size="large"
                yesAmount={market.yesPool}
                noAmount={market.noPool}
              />
            </View>

            <View style={styles.chartAndPoolSection}>
              <MarketPriceChart
                key={refresh}
                priceHistory={getMarketPriceHistory(market)}
                width={layout.width - layout.paddingH * 2}
              />
              <View style={styles.marketActionsSection}>
            <LinearGradient
              colors={["#1A1A1A", "#0D0D0D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.poolCard}
            >
              <View style={styles.statsGrid}>
                <View style={styles.statColumn}>
                  <Text style={styles.poolLabel}>Total Pool</Text>
                  <Text style={styles.poolValue}>${Math.round(market.yesPool + market.noPool)}</Text>
                </View>
                {user ? (
                  <View style={[styles.statColumn, styles.statColumnRight]}>
                    <Text style={styles.poolLabel}>Your Balance</Text>
                    <Text style={styles.balanceValue}>${userBalance}</Text>
                  </View>
                ) : null}
              </View>
              {user && (
                <View style={[styles.statsGrid, styles.statsGridSecond]}>
                  <View style={styles.statColumn}>
                    <Text style={styles.positionLabel}>My stake · YES</Text>
                    <Text style={styles.positionValueYes}>
                      ${Math.round(userYes)}
                      {market.yesPool > 0 && (
                        <Text style={styles.positionMeta}>
                          {" "}({Math.round(100 * userYes / market.yesPool)}% of pool)
                        </Text>
                      )}
                    </Text>
                    <Text style={styles.positionValueHint}>
                      {market.yesPool > 0
                        ? `Worth $${Math.round(userYes * ((market.yesPool + market.noPool) / market.yesPool))} if YES wins`
                        : ""}
                    </Text>
                  </View>
                  <View style={[styles.statColumn, styles.statColumnRight]}>
                    <Text style={styles.positionLabel}>My stake · NO</Text>
                    <Text style={styles.positionValueNo}>
                      ${Math.round(userNo)}
                      {market.noPool > 0 && (
                        <Text style={styles.positionMeta}>
                          {" "}({Math.round(100 * userNo / market.noPool)}% of pool)
                        </Text>
                      )}
                    </Text>
                    <Text style={styles.positionValueHint}>
                      {market.noPool > 0
                        ? `Worth $${Math.round(userNo * ((market.yesPool + market.noPool) / market.noPool))} if NO wins`
                        : ""}
                    </Text>
                  </View>
                </View>
              )}
            </LinearGradient>

            <View style={styles.actionsGrid}>
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => setTradeModal("buy-yes")}
                  style={({ pressed }) => [styles.actionBtnWrap, pressed && styles.btnPressed]}
                >
                  <LinearGradient
                    colors={["#14F195", "#00D68F"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.joinYesText}>Buy YES</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  onPress={() => setTradeModal("buy-no")}
                  style={({ pressed }) => [styles.actionBtnWrap, pressed && styles.btnPressed]}
                >
                  <LinearGradient
                    colors={["#F03E3E", "#DC2626"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.joinBtnText}>Buy NO</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>

            {isCreator && (
              <Pressable
                onPress={() => setResolveModal(true)}
                style={({ pressed }) => [
                  styles.resolveBtnWrap,
                  pressed && styles.btnPressed,
                ]}
              >
                <LinearGradient
                  colors={["#9945FF", "#14F195"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.resolveBtn}
                >
                  <Text style={styles.resolveBtnText}>Resolve Market</Text>
                </LinearGradient>
              </Pressable>
            )}
            </View>
            </View>

            {/* Recent transactions */}
            <View style={styles.transactionsSection}>
              <Text style={styles.transactionsTitle}>Recent Activity</Text>
              {getMarketRecentTransactions(market, 5).length === 0 ? (
                <Text style={styles.transactionsEmpty}>No transactions yet</Text>
              ) : (
                getMarketRecentTransactions(market, 5).map((tx) => {
                  const txUser = getUserById(tx.userId);
                  const timeStr = formatTransactionTime(tx.timestamp);
                  return (
                    <View key={tx.id} style={styles.transactionRow}>
                      <View style={styles.transactionLeft}>
                        <Text style={tx.side === "yes" ? styles.txYes : styles.txNo}>
                          Added to {tx.side === "yes" ? "YES" : "NO"}
                        </Text>
                        <Text style={styles.txUser}>
                          {txUser?.name ?? "Unknown"} · ${typeof tx.amount === "number" ? Math.round(tx.amount) : tx.amount}
                        </Text>
                      </View>
                      <Text style={styles.txTime}>{timeStr}</Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Trade Modal - Kalshi/Polymarket style */}
      <Modal visible={!!tradeModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            Keyboard.dismiss();
            setTradeModal(null);
            setTradeAmount("");
          }}
        >
          <Pressable
            style={[styles.modalContent, { marginBottom: layout.height * 0.2 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>
              Add to {tradeModal?.includes("yes") ? "YES" : "NO"}
            </Text>
            <Text style={styles.modalLabel}>Amount $ (balance: ${userBalance})</Text>
            <TextInput
              value={tradeAmount}
              onChangeText={setTradeAmount}
              placeholder="0"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              style={styles.modalInput}
            />
            {tradeAmount && (() => {
              const amt = parseFloat(tradeAmount) || 0;
              if (amt <= 0) return null;
              const totalPool = market.yesPool + market.noPool + amt;
              const newPool = tradeModal?.includes("yes") ? market.yesPool + amt : market.noPool + amt;
              const newStake = (tradeModal?.includes("yes") ? userYes : userNo) + amt;
              const shareOfPool = newPool > 0 ? (100 * newStake / newPool) : 0;
              const valueIfWins = newPool > 0 ? (newStake * (totalPool / newPool)) : 0;
              return (
                <View style={styles.tradeSummary}>
                  <View style={styles.tradeSummaryRow}>
                    <Text style={styles.tradeSummaryLabel}>You add</Text>
                    <Text style={styles.tradeSummaryValue}>${Math.round(amt)}</Text>
                  </View>
                  {amt > 0 && (
                    <>
                      <View style={styles.tradeSummaryRow}>
                        <Text style={styles.tradeSummaryLabel}>New total position</Text>
                        <Text style={tradeModal?.includes("yes") ? styles.tradeSummaryValueYes : styles.tradeSummaryValueNo}>
                          ${Math.round(newStake)}
                        </Text>
                      </View>
                      <View style={styles.tradeSummaryRow}>
                        <Text style={styles.tradeSummaryLabel}>If {tradeModal?.includes("yes") ? "YES" : "NO"} wins</Text>
                        <Text style={styles.tradeSummaryValueGreen}>
                          ${Math.round(valueIfWins)} ({Math.round(shareOfPool)}% of pool)
                        </Text>
                      </View>
                    </>
                  )}
                  {userBalance > 0 && (
                    <Text style={styles.tradeSummaryHint}>Max: ${Math.round(userBalance)}</Text>
                  )}
                </View>
              );
            })()}
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setTradeModal(null);
                  setTradeAmount("");
                }}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => tradeModal && handleTrade(tradeModal)}
                style={({ pressed }) => [styles.modalConfirmWrap, pressed && styles.btnPressed]}
              >
                <LinearGradient
                  colors={["#9945FF", "#14F195"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalConfirm}
                >
                  <Text style={styles.modalConfirmText}>Add</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Resolve Modal */}
      <Modal visible={resolveModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setResolveModal(false);
            setResolveOutcome(null);
          }}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Resolve Market</Text>
            <Text style={styles.modalLabel}>Outcome</Text>
            <View style={styles.resolveOptions}>
              <Pressable
                onPress={() => setResolveOutcome("YES")}
                style={[
                  styles.resolveOption,
                  resolveOutcome === "YES" && styles.resolveOptionYes,
                ]}
              >
                <Text style={styles.resolveOptionText}>YES</Text>
              </Pressable>
              <Pressable
                onPress={() => setResolveOutcome("NO")}
                style={[
                  styles.resolveOption,
                  resolveOutcome === "NO" && styles.resolveOptionNo,
                ]}
              >
                <Text style={styles.resolveOptionText}>NO</Text>
              </Pressable>
            </View>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setResolveModal(false);
                  setResolveOutcome(null);
                }}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleResolve}
                disabled={!resolveOutcome}
                style={({ pressed }) => [
                  styles.modalConfirmWrap,
                  pressed && styles.btnPressed,
                  !resolveOutcome && styles.modalConfirmDisabled,
                ]}
              >
                <LinearGradient
                  colors={["#9945FF", "#14F195"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalConfirm}
                >
                  <Text style={styles.modalConfirmText}>Resolve</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingTop: 16, paddingBottom: 40 },
  inner: { alignSelf: "center", width: "100%" },
  notFound: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: { color: "#fff" },
  fixedHeader: {
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#252525",
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8 },
  backText: { color: "#9ca3af", fontWeight: "500" },
  content: {},
  groupLabel: {
    fontSize: 14,
    color: "#14F195",
    fontWeight: "600",
    marginTop: 16,
  },
  question: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    lineHeight: 20,
    marginTop: 12,
    marginBottom: -6,
  },
  oddsSection: { gap: 8 },
  poolCard: {
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: "#252525",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statColumn: { gap: 4 },
  statColumnRight: { alignItems: "flex-end" },
  statsGridSecond: { marginTop: 16 },
  poolLabel: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  poolValue: { fontSize: 22, color: "#fff", fontWeight: "bold" },
  balanceValue: { fontSize: 22, fontWeight: "bold", color: "#14F195" },
  positionLabel: { fontSize: 13, color: "#9ca3af" },
  positionValueYes: { fontSize: 20, color: "#14F195", fontWeight: "bold" },
  positionValueNo: { fontSize: 20, color: "#F03E3E", fontWeight: "bold" },
  positionMeta: { fontSize: 14, color: "#9ca3af", fontWeight: "500" },
  positionValueHint: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  resolvedBadge: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#252525" },
  resolvedText: { fontSize: 18, fontWeight: "bold" },
  outcomeYes: { color: "#14F195" },
  outcomeNo: { color: "#F03E3E" },
  actions: { gap: 10, paddingBottom: 24 },
  chartAndPoolSection: { gap: 6 },
  marketActionsSection: { gap: 6 },
  actionsGrid: {
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtnWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  sellBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#14F195",
    backgroundColor: "rgba(20, 241, 149, 0.1)",
  },
  sellBtnNo: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F03E3E",
    backgroundColor: "rgba(240, 62, 62, 0.1)",
  },
  sellYesText: { color: "#14F195", fontWeight: "bold", fontSize: 16 },
  sellBtnText: { color: "#F03E3E", fontWeight: "bold", fontSize: 16 },
  joinYesText: { color: "#000", fontWeight: "bold", fontSize: 16 },
  joinBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  btnPressed: { opacity: 0.98 },
  resolveBtnWrap: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 0,
  },
  resolveBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  resolveBtnText: { color: "#000", fontWeight: "bold", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: "#252525",
  },
  modalTitle: { fontSize: 20, color: "#fff", fontWeight: "bold", marginBottom: 20 },
  tradePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#0D0D0D",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  tradePriceLabel: { fontSize: 14, color: "#9ca3af" },
  tradePriceValue: { fontSize: 18, fontWeight: "bold" },
  tradePriceYes: { color: "#14F195" },
  tradePriceNo: { color: "#F03E3E" },
  modalLabel: { fontSize: 14, color: "#9ca3af", marginBottom: 8 },
  tradeSummary: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#0D0D0D",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 8,
  },
  tradeSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tradeSummaryLabel: { fontSize: 14, color: "#9ca3af" },
  tradeSummaryValue: { fontSize: 16, color: "#fff", fontWeight: "600" },
  tradeSummaryValueGreen: { fontSize: 16, color: "#14F195", fontWeight: "bold" },
  tradeSummaryValueYes: { fontSize: 16, color: "#14F195", fontWeight: "bold" },
  tradeSummaryValueNo: { fontSize: 16, color: "#F03E3E", fontWeight: "bold" },
  tradeSummaryHint: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  modalInput: {
    backgroundColor: "#0D0D0D",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 8,
  },
  modalCancelText: { color: "#9ca3af", fontWeight: "600" },
  modalConfirmWrap: { flex: 1, borderRadius: 8, overflow: "hidden" },
  modalConfirmDisabled: { opacity: 0.5 },
  modalConfirm: { paddingVertical: 12, alignItems: "center" },
  modalConfirmText: { color: "#000", fontWeight: "bold" },
  resolveOptions: { flexDirection: "row", gap: 12, marginBottom: 16 },
  resolveOption: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2A2A2A",
  },
  resolveOptionYes: { borderColor: "#14F195", backgroundColor: "rgba(20, 241, 149, 0.1)" },
  resolveOptionNo: { borderColor: "#F03E3E", backgroundColor: "rgba(240, 62, 62, 0.1)" },
  resolveOptionText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  transactionsSection: {
    marginTop: 0,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#252525",
    paddingBottom: 40,
  },
  transactionsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  transactionsEmpty: { color: "#6b7280", fontSize: 14 },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  transactionLeft: { gap: 2 },
  txYes: { color: "#14F195", fontWeight: "600", fontSize: 14 },
  txNo: { color: "#F03E3E", fontWeight: "600", fontSize: 14 },
  txUser: { color: "#9ca3af", fontSize: 13 },
  txTime: { color: "#6b7280", fontSize: 12 },
});
