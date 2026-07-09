import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme, spacing, radius } from "@/src/shared/theme/theme";
import { useSettings } from "@/src/application/providers/AppProviders";
import { useCategoryProvider, useTransactionProvider } from "@/src/application/providers";
import { TxnType } from "@/src/domain/entities/models";
import { groupByDay } from "@/src/domain/services/format";
import { Chip, EmptyState, ScreenHeader } from "@/src/presentation/widgets/ui";
import { TransactionRow } from "@/src/presentation/widgets/TransactionRow";

type Filter = "all" | "income" | "expense";

export default function Transactions() {
  const { palette } = useTheme();
  const { currency } = useSettings();
  const { transactions: txns, loadTransactions, deleteTransaction } = useTransactionProvider();
  const { categories, loadCategories } = useCategoryProvider();
  const router = useRouter();

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const cats = useMemo(() => {
    const map: Record<string, (typeof categories)[number]> = {};
    categories.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [categories]);

  const load = useCallback(async () => {
    const type: TxnType | undefined = filter === "income" ? "credit" : filter === "expense" ? "debit" : undefined;
    await Promise.all([
      loadTransactions({ type, search: search.trim() || undefined }),
      loadCategories(),
    ]);
  }, [filter, search, loadTransactions, loadCategories]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const grouped = groupByDay(txns);

  const handleDelete = async (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await deleteTransaction(id);
    load();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }} edges={["top"]} testID="transactions-screen">
      <ScreenHeader title="Ledger" subtitle={`${txns.length} transactions`} />

      {/* Search */}
      <View style={{ paddingHorizontal: spacing.lg }}>
        <View style={[styles.searchBox, { backgroundColor: palette.surfaceSecondary, borderColor: palette.border }]}>
          <Feather name="search" size={16} color={palette.muted} />
          <TextInput
            testID="txn-search-input"
            placeholder="Search merchant, notes..."
            placeholderTextColor={palette.muted}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: palette.onSurface }]}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable testID="txn-search-clear" onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={palette.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingVertical: spacing.md, alignItems: "center" }}
      >
        <Chip label="All" selected={filter === "all"} onPress={() => setFilter("all")} testID="filter-all" />
        <Chip label="Expenses" selected={filter === "expense"} onPress={() => setFilter("expense")} testID="filter-expense" />
        <Chip label="Income" selected={filter === "income"} onPress={() => setFilter("income")} testID="filter-income" />
      </ScrollView>

      {grouped.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <EmptyState
            icon="inbox"
            title={search || filter !== "all" ? "No matching transactions" : "No transactions yet"}
            subtitle={search || filter !== "all" ? "Try adjusting your filters or search." : "Start by adding your first transaction."}
            cta={{ label: "Add Transaction", onPress: () => router.push("/transaction/add"), testID: "empty-add-btn" }}
          />
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(g) => g.dateKey}
          contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: spacing.lg }}
          renderItem={({ item }) => (
            <View style={{ marginBottom: spacing.md }}>
              <Text style={[styles.dayLabel, { color: palette.muted }]}>{item.label}</Text>
              <View style={[styles.group, { backgroundColor: palette.surfaceSecondary, borderColor: palette.border }]}>
                {item.items.map((t, idx) => (
                  <View key={t.id}>
                    <TransactionRow
                      txn={t}
                      category={t.category_id ? cats[t.category_id] : null}
                      currencyCode={currency}
                      onPress={() => router.push({ pathname: "/transaction/add", params: { id: t.id } })}
                      onLongPress={() => handleDelete(t.id)}
                      testID={`txn-row-${t.id}`}
                    />
                    {idx < item.items.length - 1 && <View style={[styles.divider, { backgroundColor: palette.divider }]} />}
                  </View>
                ))}
              </View>
            </View>
          )}
        />
      )}

      <Pressable
        testID="fab-add"
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/transaction/add"); }}
        style={({ pressed }) => [styles.fab, { backgroundColor: palette.brandPrimary, opacity: pressed ? 0.85 : 1 }]}
      >
        <Feather name="plus" size={24} color={palette.onBrandPrimary} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBox: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.lg, height: 44 },
  searchInput: { flex: 1, fontSize: 14 },
  dayLabel: { fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: spacing.xs, marginLeft: spacing.sm },
  group: { borderRadius: radius.lg, borderWidth: 1, overflow: "hidden" },
  divider: { height: 1, marginLeft: 68 },
  fab: { position: "absolute", right: spacing.lg, bottom: 96, width: 56, height: 56, borderRadius: 999, alignItems: "center", justifyContent: "center", elevation: 6, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
});
