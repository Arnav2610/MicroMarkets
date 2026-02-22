import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface OddsBarProps {
  yesOdds: number;
  noOdds: number;
  size?: "small" | "large";
  yesAmount?: number;
  noAmount?: number;
}

export function OddsBar({ yesOdds, noOdds, size = "small", yesAmount, noAmount }: OddsBarProps) {
  const height = size === "small" ? 24 : 40;

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { height }]}>
        <LinearGradient
          colors={["#14F195", "#00D68F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.yesBar, { width: `${yesOdds}%` }]}
        >
          {yesOdds > 15 && (
            <Text style={styles.yesText}>{yesOdds}%</Text>
          )}
        </LinearGradient>
        <LinearGradient
          colors={["#F03E3E", "#DC2626"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.noBar, { width: `${noOdds}%` }]}
        >
          {noOdds > 15 && (
            <Text style={styles.noText}>{noOdds}%</Text>
          )}
        </LinearGradient>
      </View>
      {size === "large" && (
        <View style={styles.labels}>
          <Text style={styles.yesLabel}>
            YES{yesAmount != null ? ` ($${Math.round(yesAmount)})` : ""}
          </Text>
          <Text style={styles.noLabel}>
            NO{noAmount != null ? ` ($${Math.round(noAmount)})` : ""}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  bar: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
  },
  yesBar: {
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 10,
  },
  noBar: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 10,
  },
  yesText: { color: "#000", fontWeight: "bold", fontSize: 14 },
  noText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  yesLabel: { color: "#14F195", fontWeight: "bold", fontSize: 14 },
  noLabel: { color: "#F03E3E", fontWeight: "bold", fontSize: 14 },
});
