import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useLayout } from "@/hooks/useLayout";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MarketCard } from "../components/MarketCard";
import { useAuth } from "@/context/AuthContext";
import { useStoreRefresh } from "@/context/StoreContext";
import {
  getGroupById,
  getActiveMarketsByGroup,
  getResolvedMarketsByGroup,
  getGroupLeaderboard,
  getUserById,
  getYesOdds,
  getNoOdds,
  hydrateStore,
  getOrCreateUser,
} from "@/data/store";
import { refreshFromServer } from "@/lib/backend";

type Tab = "leaderboard" | "active" | "past";

export function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const layout = useLayout();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("leaderboard");

  useStoreRefresh();
  const group = getGroupById(id || "");
  const activeMarkets = getActiveMarketsByGroup(id || "");
  const resolvedMarkets = getResolvedMarketsByGroup(id || "");
  const [leaderboard, setLeaderboard] = useState<{ userId: string; balance: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const state = await refreshFromServer();
        if (state) {
          hydrateStore(state);
          if (user?.id) getOrCreateUser(user.id);
        }
        if (id) setLeaderboard(getGroupLeaderboard(id));
      })();
    }, [id, user?.id])
  );

  if (!group) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Group not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "leaderboard", label: "Leaderboard" },
    { key: "active", label: "Active" },
    { key: "past", label: "Past" },
  ];

  return (
    <View style={styles.container}>
      {/* Fixed header */}
      <View style={[styles.header, { paddingHorizontal: layout.paddingH, paddingTop: layout.headerPaddingTop, paddingBottom: layout.headerPaddingBottom }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#9ca3af" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>{group.name}</Text>
        <Text style={styles.subtitle}>
          Code: {group.joinCode} • ${group.baseBuyIn} buy-in
        </Text>

        {/* Tab bar */}
        <View style={[styles.tabBar, { marginTop: layout.gapMd }]}>
          {tabs.map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => setActiveTab(key)}
              style={[
                styles.tab,
                activeTab === key && styles.tabActive,
              ]}
            >
              {activeTab === key ? (
                <LinearGradient
                  colors={["#9945FF", "#14F195"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabActiveInner}
                >
                  <Text style={styles.tabTextActive}>{label}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.tabText}>{label}</Text>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tab content - scrollable */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: layout.paddingH, paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "leaderboard" && (
          <View style={styles.tabContent}>
            {leaderboard.map((entry, i) => {
              const u = getUserById(entry.userId);
              return (
                <View key={entry.userId} style={styles.leaderRow}>
                  <Text style={styles.rank}>#{i + 1}</Text>
                  <Text style={styles.leaderName}>{u?.name ?? "Unknown"}</Text>
                  <Text style={styles.leaderBalance}>${entry.balance}</Text>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === "active" && (
          <View style={[styles.tabContent, { gap: layout.gapSm * 1.5 }]}>
            {activeMarkets.length === 0 ? (
              <Text style={styles.empty}>No active markets</Text>
            ) : (
              activeMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={{
                    id: market.id,
                    question: market.question,
                    yesOdds: getYesOdds(market),
                    noOdds: getNoOdds(market),
                    liquidity: market.yesPool + market.noPool,
                    groupName: group.name,
                  }}
                />
              ))
            )}
          </View>
        )}

        {activeTab === "past" && (
          <View style={[styles.tabContent, { gap: layout.gapSm }]}>
            {resolvedMarkets.length === 0 ? (
              <Text style={styles.empty}>No resolved markets yet</Text>
            ) : (
              resolvedMarkets.map((market) => (
                <View key={market.id} style={styles.pastCard}>
                  <Text style={styles.pastQuestion} numberOfLines={2}>
                    {market.question}
                  </Text>
                  <View style={styles.pastOutcome}>
                    <Text
                      style={[
                        styles.outcomeBadge,
                        market.outcome === "YES" ? styles.outcomeYes : styles.outcomeNo,
                      ]}
                    >
                      {market.outcome}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: { backgroundColor: "#000" },
  notFound: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  notFoundText: { color: "#fff", fontSize: 18 },
  backBtn: { padding: 12 },
  backBtnText: { color: "#14F195", fontWeight: "600" },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  backText: { color: "#9ca3af", fontWeight: "500" },
  title: { fontSize: 24, color: "#fff", fontWeight: "bold" },
  subtitle: { fontSize: 14, color: "#9ca3af", marginTop: 4 },
  tabBar: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  tabActive: {
    borderColor: "transparent",
  },
  tabActiveInner: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabText: {
    paddingVertical: 10,
    textAlign: "center",
    color: "#9ca3af",
    fontWeight: "600",
    fontSize: 14,
  },
  tabTextActive: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  tabContent: {
    paddingTop: 16,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
    gap: 12,
  },
  rank: { color: "#9ca3af", fontSize: 14, width: 28 },
  leaderName: { flex: 1, color: "#fff", fontSize: 16 },
  leaderBalance: { color: "#14F195", fontWeight: "bold", fontSize: 16 },
  empty: { color: "#6b7280", fontSize: 14, fontStyle: "italic" },
  pastCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  pastQuestion: { color: "#fff", fontSize: 14, marginBottom: 8 },
  pastOutcome: { flexDirection: "row" },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "bold",
  },
  outcomeYes: { backgroundColor: "rgba(20, 241, 149, 0.2)", color: "#14F195" },
  outcomeNo: { backgroundColor: "rgba(240, 62, 62, 0.2)", color: "#F03E3E" },
});
