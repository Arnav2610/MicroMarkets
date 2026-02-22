import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useLayout } from "@/hooks/useLayout";
import { Ionicons } from "@expo/vector-icons";

const navItems = [
  { path: "/", icon: "home" as const, label: "Feed" },
  { path: "/groups", icon: "people" as const, label: "Groups" },
  { path: "/create", icon: "add-circle" as const, label: "Create" },
  { path: "/profile", icon: "person" as const, label: "Profile" },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const layout = useLayout();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/" || pathname.startsWith("/feed");
    }
    return pathname.startsWith(path);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.nav, { height: layout.bottomNavH, paddingHorizontal: layout.paddingH }]}>
        {navItems.map(({ path, icon, label }) => {
          const active = isActive(path);
          return (
            <Pressable
              key={path}
              onPress={() => router.replace(path as any)}
              style={styles.navItem}
            >
              <Ionicons
                name={icon}
                size={20}
                color={active ? "#14F195" : "#6b7280"}
              />
              <Text
                style={[
                  styles.label,
                  active ? styles.labelActive : styles.labelInactive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000",
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    alignSelf: "center",
    width: "100%",
  },
  navItem: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
  },
  labelActive: { color: "#14F195" },
  labelInactive: { color: "#6b7280" },
});
