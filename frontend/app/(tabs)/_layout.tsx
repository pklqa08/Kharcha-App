import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useTheme, spacing } from "@/src/presentation/theme/theme";

const TAB_ITEMS: Array<{ name: string; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { name: "index", label: "Home", icon: "home" },
  { name: "transactions", label: "Ledger", icon: "list" },
  { name: "analytics", label: "Insights", icon: "bar-chart-2" },
  { name: "settings", label: "Settings", icon: "settings" },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { palette, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabWrap, { paddingBottom: Math.max(insets.bottom, 8) }]} pointerEvents="box-none">
      <BlurView intensity={isDark ? 80 : 60} tint={isDark ? "dark" : "light"} style={[styles.blurRow, { borderColor: palette.border, backgroundColor: palette.surface + "E6" }]}>
        {state.routes.map((route: any, index: number) => {
          const item = TAB_ITEMS.find((t) => t.name === route.name);
          if (!item) return null;
          const focused = state.index === index;
          const color = focused ? palette.brandPrimary : palette.muted;
          const onPress = () => {
            Haptics.selectionAsync();
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              testID={`tab-${item.name}`}
              onPress={onPress}
              accessibilityRole="button"
              style={styles.tabBtn}
            >
              <Feather name={item.icon} size={20} color={color} />
              <Text style={[styles.tabLabel, { color }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "transparent" } }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabWrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.md },
  blurRow: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    overflow: "hidden",
    ...(Platform.OS === "android" ? {} : {}),
  },
  tabBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: spacing.xs, gap: 3 },
  tabLabel: { fontSize: 10, fontWeight: "500", letterSpacing: 0.4 },
});
