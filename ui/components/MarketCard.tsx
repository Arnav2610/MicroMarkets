import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { OddsBar } from "./OddsBar";
import { BuyInBadge } from "./BuyInBadge";

export interface MarketCardMarket {
  id: string;
  question: string;
  yesOdds: number;
  noOdds: number;
  liquidity: number;
  groupName?: string;
  timeRemaining?: string;
}

interface MarketCardProps {
  market: MarketCardMarket;
}

export function MarketCard({ market }: MarketCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/market/${market.id}` as any)}
      style={({ pressed }) => [styles.cardWrap, pressed && styles.cardPressed]}
    >
      <LinearGradient
        colors={["#1A1A1A", "#0D0D0D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.content}>
          {market.groupName && (
            <Text style={styles.groupLabel}>{market.groupName}</Text>
          )}
          <Text style={styles.question} numberOfLines={2}>
            {market.question}
          </Text>
          <OddsBar yesOdds={market.yesOdds} noOdds={market.noOdds} size="small" />
          <View style={styles.footer}>
            <BuyInBadge amount={market.liquidity} />
            {market.timeRemaining && (
              <Text style={styles.time}>{market.timeRemaining}</Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardWrap: { width: "100%" },
  card: {
    width: "100%",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  cardPressed: { opacity: 0.98 },
  content: { gap: 10 },
  groupLabel: {
    fontSize: 12,
    color: "#14F195",
    fontWeight: "600",
  },
  question: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  time: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "500",
  },
});
