import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface BuyInBadgeProps {
  amount: number;
}

export function BuyInBadge({ amount }: BuyInBadgeProps) {
  return (
    <LinearGradient
      colors={["rgba(153, 69, 255, 0.2)", "rgba(20, 241, 149, 0.2)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.badge}
    >
      <Text style={styles.text}>${amount}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(153, 69, 255, 0.5)",
    borderRadius: 999,
  },
  text: {
    color: "#14F195",
    fontWeight: "bold",
    fontSize: 14,
  },
});
