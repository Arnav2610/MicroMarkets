import React, { useCallback } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useLayout } from "@/hooks/useLayout";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MarketCard } from "../components/MarketCard";
import { BottomNav } from "../components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { useStoreRefresh } from "@/context/StoreContext";
import {
  getActiveMarketsForUser,
  getGroupById,
  getYesOdds,
  getNoOdds,
  hydrateStore,
  getOrCreateUser,
} from "@/data/store";
import { refreshFromServer } from "@/lib/backend";

export function GroupFeedScreen() {
  const router = useRouter();
  const layout = useLayout();
  const { user } = useAuth();
  useStoreRefresh(); // Re-render when store changes (new markets, trades, etc.)

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const state = await refreshFromServer();
        if (state) {
          hydrateStore(state);
          if (user?.id) getOrCreateUser(user.id);
        }
      })();
    }, [user?.id])
  );

  const markets = user ? getActiveMarketsForUser(user.id) : [];
  const groupMap = new Map(markets.map((m) => [m.groupId, getGroupById(m.groupId)]));

  return (
    <View style={[styles.container, { paddingBottom: layout.bottomNavH }]}>
      {/* Fixed header */}
      <View style={[styles.fixedHeader, { paddingHorizontal: layout.paddingH, paddingTop: layout.headerPaddingTop, paddingBottom: layout.headerPaddingBottom }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Feed</Text>
          <Pressable
            onPress={() => router.replace("/create" as any)}
            style={({ pressed }) => [styles.newButtonWrap, pressed && styles.newButtonPressed]}
          >
            <LinearGradient
              colors={["#9945FF", "#14F195"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.newButton}
            >
              <Ionicons name="add" size={16} color="#000" />
              <Text style={styles.newButtonText}>New</Text>
            </LinearGradient>
          </Pressable>
        </View>
        <Text style={[styles.subtitle, { marginTop: layout.gapSm }]}>{markets.length} active markets</Text>
      </View>

      {/* Scrollable markets list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: layout.paddingH, gap: layout.gapSm * 1.5 }]}
        showsVerticalScrollIndicator={false}
      >
        {markets.map((market) => {
          const group = groupMap.get(market.groupId);
          return (
            <MarketCard
              key={market.id}
              market={{
                id: market.id,
                question: market.question,
                yesOdds: getYesOdds(market),
                noOdds: getNoOdds(market),
                liquidity: market.yesPool + market.noPool,
                groupName: group?.name,
              }}
            />
          );
        })}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  fixedHeader: {
    backgroundColor: "#000",
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  newButtonWrap: { borderRadius: 8, overflow: "hidden" },
  newButtonPressed: { opacity: 0.98 },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newButtonText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "500",
  },
});
