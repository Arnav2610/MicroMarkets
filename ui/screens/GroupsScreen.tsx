import React, { useState } from "react";
import { useLayout } from "@/hooks/useLayout";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BottomNav } from "../components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { useStoreRefresh } from "@/context/StoreContext";
import {
  getGroupsByUser,
  createGroup,
  joinGroup,
  getUserBalance,
} from "@/data/store";

export function GroupsScreen() {
  const router = useRouter();
  const layout = useLayout();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createBuyIn, setCreateBuyIn] = useState("10");
  const [joinCode, setJoinCode] = useState("");

  useStoreRefresh();
  const groups = user ? getGroupsByUser(user.id) : [];

  const handleCreateGroup = () => {
    if (!user) return;
    const name = createName.trim();
    const buyIn = parseInt(createBuyIn, 10);
    if (!name) {
      Alert.alert("Error", "Enter a group name");
      return;
    }
    if (isNaN(buyIn) || buyIn <= 0) {
      Alert.alert("Error", "Enter a valid buy-in amount");
      return;
    }
    createGroup(name, buyIn, user.id);
    setCreateName("");
    setCreateBuyIn("10");
    setShowCreate(false);
  };

  const handleJoinGroup = () => {
    if (!user) return;
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      Alert.alert("Error", "Enter a join code");
      return;
    }
    const group = joinGroup(code, user.id);
    if (group) {
      Alert.alert("Success", `Joined ${group.name}!`);
      setJoinCode("");
      setShowJoin(false);
    } else {
      Alert.alert("Error", "Invalid or already joined group");
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: layout.bottomNavH }]}>
      {/* Fixed header + actions */}
      <View style={[styles.fixedHeader, { paddingHorizontal: layout.paddingH }]}>
        <View style={[styles.header, { paddingTop: layout.headerPaddingTop, paddingBottom: layout.headerPaddingBottom, gap: layout.gapSm }]}>
          <Text style={styles.title}>Groups</Text>
          <Text style={styles.subtitle}>{groups.length} groups</Text>
        </View>

        <View style={[styles.actions, { marginBottom: layout.gapLg }]}>
          <Pressable
            onPress={() => setShowCreate(true)}
            style={({ pressed }) => [styles.actionBtnWrap, pressed && styles.btnPressed]}
          >
            <LinearGradient
              colors={["#9945FF", "#14F195"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionBtn}
            >
              <Ionicons name="add" size={20} color="#000" />
              <Text style={styles.actionBtnText}>Create Group</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={() => setShowJoin(true)}
            style={({ pressed }) => [styles.actionBtnOutline, pressed && styles.btnPressed]}
          >
            <Ionicons name="log-in-outline" size={20} color="#14F195" />
            <Text style={styles.actionBtnOutlineText}>Join Group</Text>
          </Pressable>
        </View>
      </View>

      {/* Scrollable groups list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: layout.paddingH, gap: layout.gapSm * 1.5 }]}
        showsVerticalScrollIndicator={false}
      >
        {groups.map((group) => (
          <Pressable
            key={group.id}
            onPress={() => router.push(`/group/${group.id}` as any)}
            style={({ pressed }) => [styles.groupCardWrap, pressed && styles.cardPressed]}
          >
            <LinearGradient
              colors={["#1A1A1A", "#0D0D0D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.groupCard}
            >
              <View style={styles.groupRow}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </View>
              <Text style={styles.groupMeta}>
                {group.members.length} members • ${group.baseBuyIn} buy-in
              </Text>
              <Text style={styles.groupCode}>Code: {group.joinCode}</Text>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>

      <BottomNav />

      {/* Create Group Modal */}
      <Modal visible={showCreate} transparent animationType="fade">
        <Pressable style={[styles.modalOverlay, { padding: layout.paddingH * 2 }]} onPress={() => setShowCreate(false)}>
          <Pressable style={[styles.modalContent, { maxWidth: layout.width * 0.9 }]} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Create Group</Text>
            <Text style={styles.modalLabel}>Group Name</Text>
            <TextInput
              value={createName}
              onChangeText={setCreateName}
              placeholder="e.g. Roommates"
              placeholderTextColor="#6b7280"
              style={styles.modalInput}
            />
            <Text style={styles.modalLabel}>Base Buy-in (tokens)</Text>
            <TextInput
              value={createBuyIn}
              onChangeText={setCreateBuyIn}
              placeholder="10"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowCreate(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateGroup}
                style={({ pressed }) => [styles.modalConfirmWrap, pressed && styles.btnPressed]}
              >
                <LinearGradient
                  colors={["#9945FF", "#14F195"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalConfirm}
                >
                  <Text style={styles.modalConfirmText}>Create</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Join Group Modal */}
      <Modal visible={showJoin} transparent animationType="fade">
        <Pressable style={[styles.modalOverlay, { padding: layout.paddingH * 2 }]} onPress={() => setShowJoin(false)}>
          <Pressable style={[styles.modalContent, { maxWidth: layout.width * 0.9 }]} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Join Group</Text>
            <Text style={styles.modalLabel}>Join Code</Text>
            <TextInput
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              placeholder="e.g. ABC123"
              placeholderTextColor="#6b7280"
              autoCapitalize="characters"
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowJoin(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleJoinGroup}
                style={({ pressed }) => [styles.modalConfirmWrap, pressed && styles.btnPressed]}
              >
                <LinearGradient
                  colors={["#9945FF", "#14F195"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalConfirm}
                >
                  <Text style={styles.modalConfirmText}>Join</Text>
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
  fixedHeader: {
    backgroundColor: "#000",
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 16 },
  header: {},
  title: { fontSize: 24, color: "#fff", fontWeight: "bold" },
  subtitle: { fontSize: 14, color: "#9ca3af" },
  actions: { flexDirection: "row", gap: 12 },
  actionBtnWrap: { flex: 1, borderRadius: 8, overflow: "hidden" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionBtnText: { color: "#000", fontWeight: "bold", fontSize: 14 },
  actionBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#14F195",
    borderRadius: 8,
  },
  actionBtnOutlineText: { color: "#14F195", fontWeight: "600", fontSize: 14 },
  btnPressed: { opacity: 0.98 },
  groupCardWrap: { width: "100%" },
  groupCard: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  cardPressed: { opacity: 0.98 },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupName: { fontSize: 18, color: "#fff", fontWeight: "bold" },
  groupMeta: { fontSize: 14, color: "#9ca3af", marginTop: 4 },
  groupCode: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  modalTitle: { fontSize: 20, color: "#fff", fontWeight: "bold", marginBottom: 20 },
  modalLabel: { fontSize: 14, color: "#9ca3af", marginBottom: 8 },
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
  modalConfirm: { paddingVertical: 12, alignItems: "center" },
  modalConfirmText: { color: "#000", fontWeight: "bold" },
});
