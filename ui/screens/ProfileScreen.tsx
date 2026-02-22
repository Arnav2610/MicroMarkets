import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useLayout } from "@/hooks/useLayout";
import { LinearGradient } from "expo-linear-gradient";
import { BottomNav } from "../components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { useStoreRefresh } from "@/context/StoreContext";
import { getGroupsByUser, getUserBalance, resetStore } from "@/data/store";
import { resetBackend } from "@/lib/backend";

export function ProfileScreen() {
  const router = useRouter();
  const layout = useLayout();
  const { user, signOut } = useAuth();
  const [refresh, setRefresh] = useState(0);
  useStoreRefresh();
  useFocusEffect(
    useCallback(() => {
      setRefresh((r) => r + 1);
    }, [])
  );

  const groups = user ? getGroupsByUser(user.id) : [];

  const handleLogout = () => {
    signOut();
    router.replace("/landing" as any);
  };

  const handleResetData = () => {
    Alert.alert(
      "Reset all data",
      "This will delete all groups, markets, and balances. You cannot undo this.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetBackend();
            resetStore();
            signOut();
            router.replace("/landing" as any);
          },
        },
      ]
    );
  };

  if (!user) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: layout.bottomNavH }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.inner, { paddingHorizontal: layout.paddingH }]}>
          <View style={[styles.header, { paddingTop: layout.headerPaddingTop, paddingBottom: layout.headerPaddingBottom }]}>
            <Text style={styles.title}>Profile</Text>
          </View>

          <View style={[styles.content, { gap: layout.gapMd }]}>
            <LinearGradient
              colors={["#1A1A1A", "#0D0D0D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.userCard}
            >
              <View style={styles.userRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.name[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
                <View>
                  <Text style={styles.username}>{user.name}</Text>
                  <Text style={styles.member}>Member</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={[styles.groupsSection, { gap: layout.gapSm * 1.5 }]}>
              <View style={styles.groupsHeader}>
                <Ionicons name="people" size={20} color="#14F195" />
                <Text style={styles.groupsTitle}>Your Groups</Text>
              </View>
              {groups.map((group) => {
                const balance = getUserBalance(user.id, group.id);
                return (
                  <Pressable
                    key={group.id}
                    onPress={() => router.push(`/group/${group.id}` as any)}
                    style={({ pressed }) => [styles.groupCard, pressed && styles.cardPressed]}
                  >
                    <LinearGradient
                      colors={["#1A1A1A", "#0D0D0D"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.groupCardGradient}
                    >
                      <View style={styles.groupRow}>
                        <Text style={styles.groupName}>{group.name}</Text>
                        <Text style={styles.groupBalance}>${balance}</Text>
                      </View>
                      <Text style={styles.groupMembers}>
                        {group.members.length} members • ${group.baseBuyIn} buy-in
                      </Text>
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleResetData}
              style={({ pressed }) => [
                styles.resetBtn,
                pressed && styles.logoutBtnPressed,
              ]}
            >
              <Ionicons name="trash-outline" size={20} color="#F03E3E" />
              <Text style={styles.resetBtnText}>Reset all data</Text>
            </Pressable>

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutBtn,
                pressed && styles.logoutBtnPressed,
              ]}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: { alignSelf: "center", width: "100%" },
  header: {},
  title: { fontSize: 24, color: "#fff", fontWeight: "bold" },
  content: {},
  userCard: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 12,
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#9945FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  username: { fontSize: 20, color: "#fff", fontWeight: "bold" },
  member: { fontSize: 14, color: "#9ca3af" },
  groupsSection: {},
  groupsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  groupsTitle: { fontSize: 18, color: "#fff", fontWeight: "bold" },
  groupCard: { width: "100%", borderRadius: 8, overflow: "hidden" },
  cardPressed: { opacity: 0.98 },
  groupCardGradient: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  groupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  groupName: { color: "#fff", fontWeight: "600" },
  groupBalance: { color: "#14F195", fontWeight: "bold", fontSize: 18 },
  groupMembers: { fontSize: 14, color: "#9ca3af", marginTop: 4 },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#F03E3E",
    borderRadius: 8,
  },
  resetBtnText: { color: "#F03E3E", fontWeight: "600" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 8,
  },
  logoutBtnPressed: { opacity: 0.9 },
  logoutText: { color: "#fff", fontWeight: "600" },
});
