import { useAuth } from "@/context/AuthContext";
import { useStoreRefresh } from "@/context/StoreContext";
import {
  createMarket,
  getGroupsByUser,
  getUserBalance,
} from "@/data/store";
import { useLayout } from "@/hooks/useLayout";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { BottomNav } from "../components/BottomNav";

export function CreateMarketScreen() {
  const layout = useLayout();
  const router = useRouter();
  const { user } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const createLayout = useMemo(() => {
    const h = layout.height;
    return {
      paddingH: layout.paddingH,
      formGap: h * 0.025,
      fieldGap: h * 0.01,
      inputPadding: layout.inputPadding,
      questionMinH: h * 0.12,
      borderRadius: layout.radius,
      dropdownPaddingV: h * 0.017,
      dropdownPaddingH: layout.inputPadding,
      sliderH: h * 0.05,
      btnPaddingV: layout.btnPaddingV,
      btnMarginT: h * 0.04,
      btnPaddingBottom: h * 0.08,
      captionMarginT: h * 0.006,
      bottomNavH: layout.bottomNavH,
    };
  }, [layout]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [yesPercent, setYesPercent] = useState(50);
  const [stake, setStake] = useState("10");

  useStoreRefresh();
  const groups = user ? getGroupsByUser(user.id) : [];
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const balance = selectedGroupId && user
    ? getUserBalance(user.id, selectedGroupId)
    : 0;

  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups.length]);

  const handleCreate = async () => {
    if (!user) return;
    if (!selectedGroupId) {
      Alert.alert("Error", "Select a group");
      return;
    }
    const q = question.trim();
    if (!q) {
      Alert.alert("Error", "Enter a market question");
      return;
    }
    const stakeNum = parseInt(stake, 10);
    if (isNaN(stakeNum) || stakeNum <= 0) {
      Alert.alert("Error", "Enter a valid stake amount");
      return;
    }
    if (stakeNum > balance) {
      Alert.alert("Error", "Insufficient balance");
      return;
    }
    const noPercent = 100 - yesPercent;
    try {
      const market = await createMarket(
        selectedGroupId,
        q,
        user.id,
        yesPercent,
        noPercent,
        stakeNum,
        user.id
      );
      setQuestion("");
      setYesPercent(50);
      setStake("10");
      router.push(`/market/${market.id}`);
    } catch {
      Alert.alert("Error", "Failed to create market");
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: createLayout.bottomNavH }]}>
      {/* Fixed header - matches Feed/Groups */}
      <View style={[styles.fixedHeader, { paddingHorizontal: createLayout.paddingH, paddingTop: layout.headerPaddingTop, paddingBottom: layout.headerPaddingBottom }]}>
        <Text style={styles.title}>Create Market</Text>
      </View>

      {/* Form - not scrollable */}
      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.form, { paddingHorizontal: createLayout.paddingH, paddingTop: 8, paddingBottom: createLayout.btnPaddingBottom, flex: 1, justifyContent: "space-between" }]}>
          <View style={[styles.formFields, { gap: createLayout.formGap }]}>
          {/* Group dropdown - opens modal to prevent layout shift */}
          <View style={[styles.field, { gap: createLayout.fieldGap }]}>
            <Text style={styles.label}>Group</Text>
            {groups.length === 0 ? (
              <Text style={styles.hint}>Create or join a group first</Text>
            ) : (
              <>
                <Pressable
                  onPress={() => setDropdownOpen(true)}
                  style={[
                    styles.dropdownTrigger,
                    {
                      paddingVertical: createLayout.dropdownPaddingV,
                      paddingHorizontal: createLayout.dropdownPaddingH,
                      borderRadius: createLayout.borderRadius,
                    },
                  ]}
                >
                  <Text style={styles.dropdownText}>
                    {selectedGroup ? selectedGroup.name : "Choose a group"}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </Pressable>

                {/* Group picker modal - no layout shift */}
                <Modal
                  visible={dropdownOpen}
                  transparent
                  animationType="fade"
                >
                  <Pressable
                    style={styles.dropdownModalOverlay}
                    onPress={() => setDropdownOpen(false)}
                  >
                    <Pressable
                      style={[styles.dropdownModalContent, { maxWidth: layout.width * 0.9 }]}
                      onPress={() => {}}
                    >
                      <Text style={styles.dropdownModalTitle}>Select Group</Text>
                      <ScrollView style={styles.dropdownModalList} showsVerticalScrollIndicator={false}>
                        {groups.map((g) => (
                          <Pressable
                            key={g.id}
                            onPress={() => {
                              setSelectedGroupId(g.id);
                              setDropdownOpen(false);
                            }}
                            style={[
                              styles.dropdownOption,
                              {
                                paddingVertical: createLayout.fieldGap * 1.5,
                                paddingHorizontal: createLayout.dropdownPaddingH,
                              },
                              selectedGroupId === g.id && styles.dropdownOptionActive,
                            ]}
                          >
                            <Text style={styles.dropdownOptionText}>{g.name}</Text>
                            <Text style={styles.dropdownOptionMeta}>
                              ${getUserBalance(user!.id, g.id)}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                      <Pressable
                        onPress={() => setDropdownOpen(false)}
                        style={styles.dropdownModalCancel}
                      >
                        <Text style={styles.dropdownModalCancelText}>Cancel</Text>
                      </Pressable>
                    </Pressable>
                  </Pressable>
                </Modal>
              </>
            )}
          </View>

            <View style={[styles.field, { gap: createLayout.fieldGap }]}>
              <Text style={styles.label}>Market Question</Text>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="Will something happen?"
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={4}
                style={[
                  styles.textArea,
                  {
                    padding: createLayout.inputPadding,
                    minHeight: createLayout.questionMinH,
                    borderRadius: createLayout.borderRadius,
                  },
                ]}
              />
            </View>

            <View style={[styles.field, { gap: createLayout.fieldGap }]}>
              <Text style={styles.label}>Current Odds Estimate</Text>
              <View style={[styles.sliderLabels, { marginBottom: createLayout.fieldGap }]}>
                <Text style={styles.sliderLabelYes}>YES {yesPercent}%</Text>
                <Text style={styles.sliderLabelNo}>NO {100 - yesPercent}%</Text>
              </View>
              <Slider
                style={[styles.slider, { height: createLayout.sliderH }]}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={yesPercent}
                onValueChange={setYesPercent}
                minimumTrackTintColor="#14F195"
                maximumTrackTintColor="#F03E3E"
                thumbTintColor="#fff"
              />
            </View>

            <View style={[styles.field, { gap: createLayout.fieldGap }]}>
              <View style={styles.liquidityHeader}>
                <Text style={styles.label}>Initial Market Liquidity (Your Stake)</Text>
                {selectedGroup && user && (
                  <Text style={styles.balanceDisplay}>
                    Balance: ${getUserBalance(user.id, selectedGroup.id)}
                  </Text>
                )}
              </View>
              <TextInput
                value={stake}
                onChangeText={setStake}
                placeholder="10"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                style={[
                  styles.input,
                  {
                    padding: createLayout.inputPadding,
                    borderRadius: createLayout.borderRadius,
                  },
                ]}
              />
              <Text style={[styles.liquidityCaption, { marginTop: createLayout.captionMarginT }]}>
                Split between YES and NO pools based on probability above.
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleCreate}
            style={({ pressed }) => [
              styles.createBtnWrap,
              { marginTop: createLayout.btnMarginT, borderRadius: createLayout.borderRadius },
              pressed && styles.createBtnPressed,
            ]}
          >
            <LinearGradient
              colors={["#9945FF", "#14F195"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.createBtn,
                { paddingVertical: createLayout.btnPaddingV, borderRadius: createLayout.borderRadius },
              ]}
            >
              <Text style={styles.createBtnText}>Create Market</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  fixedHeader: { backgroundColor: "#000" },
  formWrapper: { flex: 1 },
  title: { fontSize: 24, color: "#fff", fontWeight: "bold" },
  form: {},
  formFields: {},
  field: {},
  label: { color: "#fff", fontWeight: "600", fontSize: 16 },
  hint: { color: "#6b7280", fontSize: 12 },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    backgroundColor: "#1A1A1A",
  },
  dropdownText: { color: "#fff", fontSize: 15, fontWeight: "500" },
  dropdownArrow: { color: "#9ca3af", fontSize: 10 },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dropdownModalContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    maxHeight: 320,
  },
  dropdownModalTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 12,
  },
  dropdownModalList: { maxHeight: 220 },
  dropdownModalCancel: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  dropdownModalCancelText: { color: "#9ca3af", fontWeight: "600" },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  dropdownOptionActive: {
    backgroundColor: "rgba(20, 241, 149, 0.12)",
  },
  dropdownOptionText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  dropdownOptionMeta: { color: "#14F195", fontSize: 13, fontWeight: "600" },
  textArea: {
    backgroundColor: "#1A1A1A",
    color: "#fff",
    fontSize: 15,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  input: {
    backgroundColor: "#1A1A1A",
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  liquidityHeader: { gap: 4 },
  balanceDisplay: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },
  liquidityCaption: {
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 18,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabelYes: { color: "#14F195", fontWeight: "600", fontSize: 14 },
  sliderLabelNo: { color: "#F03E3E", fontWeight: "600", fontSize: 14 },
  slider: { width: "100%" },
  createBtnWrap: { overflow: "hidden" },
  createBtnPressed: { opacity: 0.98 },
  createBtn: { alignItems: "center" },
  createBtnText: { color: "#000", fontWeight: "bold", fontSize: 16 },
});
