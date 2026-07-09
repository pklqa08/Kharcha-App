import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";

import { useTheme, spacing, radius, mono } from "@/src/presentation/theme/theme";
import { useSettings } from "@/src/application/providers/AppProviders";
import { useDashboardProvider } from "@/src/application/providers";
import { getCurrency, formatAmount } from "@/src/domain/services/currencies";
import { StatCard, SectionHeader, EmptyState } from "@/src/presentation/components/ui";
import { TransactionRow } from "@/src/presentation/components/TransactionRow";

export default function Dashboard() {
  const { palette } = useTheme();
  const { currency } = useSettings();
  const { today, month, recent, categoriesMap, loadDashboard } = useDashboardProvider();
  const cur = getCurrency(currency);
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { loadDashboard(); }, [loadDashboard]));
  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const balance = month.income - month.expense;
  const savingsRate = month.income > 0 ? Math.max(0, ((month.income - month.expense) / month.income) * 100) : 0;

  const quickActions: Array<{ label: string; icon: keyof typeof Feather.glyphMap; color: string; onPress: () => void; testID: string }> = [
    { label: "Add", icon: "plus", color: palette.brandPrimary, onPress: () => router.push("/transaction/add"), testID: "quick-add-btn" },
    { label: "Ledger", icon: "list", color: palette.onSurface, onPress: () => router.push("/(tabs)/transactions"), testID: "quick-ledger-btn" },
    { label: "Insights", icon: "trending-up", color: palette.success, onPress: () => router.push("/(tabs)/analytics"), testID: "quick-insights-btn" },
    { label: "Reports", icon: "file-text", color: palette.warning, onPress: () => router.push("/reports"), testID: "quick-reports-btn" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }} edges={["top"]} testID="dashboard-screen">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brandPrimary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.hello, { color: palette.muted }]}>{dayjs().format("dddd, MMM D")}</Text>
            <Text style={[styles.brand, { color: palette.onSurface }]}>Kharcha</Text>
          </View>
          <Pressable
            testID="header-settings-btn"
            onPress={() => router.push("/(tabs)/settings")}
            hitSlop={12}
            style={{ padding: spacing.sm }}
          >
            <Feather name="user" size={22} color={palette.onSurface} />
          </Pressable>
        </View>

        {/* Balance Hero */}
        <View style={[styles.hero, { backgroundColor: palette.surfaceInverse }]} testID="balance-hero">
          <Text style={[styles.heroLabel, { color: palette.onSurfaceInverse + "AA" }]}>THIS MONTH BALANCE</Text>
          <Text style={[styles.heroValue, { color: balance >= 0 ? palette.success : palette.error, fontFamily: mono }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatAmount(balance, cur.symbol, { signMode: balance >= 0 ? "income" : "expense" })}
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.xl, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.onSurfaceInverse + "77", fontSize: 10, letterSpacing: 0.6 }}>INCOME</Text>
              <Text style={{ color: palette.onSurfaceInverse, fontSize: 15, fontFamily: mono, marginTop: 2 }}>
                {formatAmount(month.income, cur.symbol)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.onSurfaceInverse + "77", fontSize: 10, letterSpacing: 0.6 }}>EXPENSE</Text>
              <Text style={{ color: palette.onSurfaceInverse, fontSize: 15, fontFamily: mono, marginTop: 2 }}>
                {formatAmount(month.expense, cur.symbol)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.onSurfaceInverse + "77", fontSize: 10, letterSpacing: 0.6 }}>SAVINGS</Text>
              <Text style={{ color: palette.onSurfaceInverse, fontSize: 15, fontFamily: mono, marginTop: 2 }}>
                {savingsRate.toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Today stats */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg, flexDirection: "row", gap: spacing.md }}>
          <StatCard label="Today Expense" value={formatAmount(today.expense, cur.symbol)} accent={palette.error} icon="arrow-down-right" testID="stat-today-expense" />
          <StatCard label="Today Income" value={formatAmount(today.income, cur.symbol)} accent={palette.success} icon="arrow-up-right" testID="stat-today-income" />
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <SectionHeader title="Quick Actions" />
          <View style={styles.quickRow}>
            {quickActions.map((qa) => (
              <Pressable
                key={qa.label}
                testID={qa.testID}
                onPress={() => { Haptics.selectionAsync(); qa.onPress(); }}
                style={[styles.quickBtn, { backgroundColor: palette.surfaceSecondary, borderColor: palette.border }]}
              >
                <View style={[styles.quickIcon, { backgroundColor: `${qa.color}22` }]}>
                  <Feather name={qa.icon} size={18} color={qa.color} />
                </View>
                <Text style={{ color: palette.onSurface, fontSize: 12, fontWeight: "500" }}>{qa.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <SectionHeader title="Recent Activity" action={{ label: "See all", onPress: () => router.push("/(tabs)/transactions"), testID: "see-all-btn" }} />
        </View>
        <View style={[styles.recentBox, { borderColor: palette.border, backgroundColor: palette.surfaceSecondary }]}>
          {recent.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="No transactions yet"
              subtitle="Tap the + button below to log your first income or expense."
              cta={{ label: "Add Transaction", onPress: () => router.push("/transaction/add"), testID: "empty-add-btn" }}
            />
          ) : (
            recent.map((t, idx) => (
              <View key={t.id}>
                <TransactionRow
                  txn={t}
                  category={t.category_id ? categoriesMap[t.category_id] : null}
                  currencyCode={currency}
                  onPress={() => router.push({ pathname: "/transaction/add", params: { id: t.id } })}
                  testID={`recent-txn-${idx}`}
                />
                {idx < recent.length - 1 && <View style={[styles.divider, { backgroundColor: palette.divider }]} />}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        testID="fab-add"
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/transaction/add"); }}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: palette.brandPrimary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Feather name="plus" size={24} color={palette.onBrandPrimary} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  hello: { fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase" },
  brand: { fontSize: 28, fontWeight: "500", letterSpacing: -1, marginTop: 2 },
  hero: { marginHorizontal: spacing.lg, padding: spacing.xl, borderRadius: radius.lg },
  heroLabel: { fontSize: 10, letterSpacing: 1, marginBottom: spacing.sm },
  heroValue: { fontSize: 36, fontWeight: "500", letterSpacing: -1 },
  quickRow: { flexDirection: "row", gap: spacing.sm },
  quickBtn: { flex: 1, alignItems: "center", padding: spacing.md, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm },
  quickIcon: { width: 36, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  recentBox: { marginHorizontal: spacing.lg, marginTop: spacing.sm, borderRadius: radius.lg, borderWidth: 1, overflow: "hidden" },
  divider: { height: 1, marginLeft: 68 },
  fab: { position: "absolute", right: spacing.lg, bottom: 96, width: 56, height: 56, borderRadius: 999, alignItems: "center", justifyContent: "center", elevation: 6, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
});
