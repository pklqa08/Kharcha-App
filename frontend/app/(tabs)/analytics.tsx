import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { PieChart, BarChart } from "react-native-gifted-charts";

import { useTheme, spacing, radius, mono } from "@/src/presentation/theme/theme";
import { useSettings } from "@/src/application/providers/AppProviders";
import { useMerchantProvider, useTransactionProvider } from "@/src/application/providers";
import { getCurrency, formatAmount } from "@/src/domain/services/currencies";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "@/src/domain/services/format";
import { Chip, EmptyState, ScreenHeader, Card, SectionHeader } from "@/src/presentation/components/ui";
import dayjs from "dayjs";

type Range = "week" | "month" | "year";

export default function Analytics() {
  const { palette } = useTheme();
  const { currency } = useSettings();
  const { totalsBetween, categoryBreakdown, dailySeries } = useTransactionProvider();
  const { merchants, loadTopMerchants } = useMerchantProvider();
  const cur = getCurrency(currency);
  const [range, setRange] = useState<Range>("month");
  const [totals, setTotals] = useState({ income: 0, expense: 0 });
  const [breakdown, setBreakdown] = useState<Array<{ name: string; color: string; total: number; icon: string }>>([]);
  const [daily, setDaily] = useState<Array<{ date: string; income: number; expense: number }>>([]);

  const load = useCallback(async () => {
    const from =
      range === "week" ? startOfDay(dayjs().subtract(6, "day").toDate()) :
      range === "month" ? startOfMonth() :
      startOfDay(dayjs().startOf("year").toDate());
    const to = endOfDay();
    const [t, b, d] = await Promise.all([
      totalsBetween(from, to),
      categoryBreakdown(from, to, "debit"),
      dailySeries(from, to),
    ]);
    await loadTopMerchants(from, to, 5);
    setTotals(t);
    setBreakdown(b.map((x) => ({ name: x.name, color: x.color, total: x.total, icon: x.icon })));
    setDaily(d);
  }, [range, totalsBetween, categoryBreakdown, dailySeries, loadTopMerchants]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const width = Dimensions.get("window").width;
  const chartWidth = width - spacing.lg * 2 - spacing.lg * 2;

  const pieData = breakdown.slice(0, 6).map((b) => ({ value: b.total, color: b.color, text: "" }));
  const barData = daily.length > 0
    ? daily.slice(-7).map((d) => ({
        value: d.expense,
        label: dayjs(d.date).format("dd").slice(0, 1),
        frontColor: palette.brandPrimary,
      }))
    : [];

  const hasData = totals.income > 0 || totals.expense > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }} edges={["top"]} testID="analytics-screen">
      <ScreenHeader title="Insights" subtitle="Understand your money flow" />
      <ScrollView contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: spacing.lg }} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm }}>
          <Chip label="Week" selected={range === "week"} onPress={() => setRange("week")} testID="range-week" />
          <Chip label="Month" selected={range === "month"} onPress={() => setRange("month")} testID="range-month" />
          <Chip label="Year" selected={range === "year"} onPress={() => setRange("year")} testID="range-year" />
        </ScrollView>

        {!hasData ? (
          <View style={{ marginTop: spacing["2xl"] }}>
            <EmptyState icon="bar-chart-2" title="No insights yet" subtitle="Add transactions to see charts, trends and top merchants." />
          </View>
        ) : (
          <>
            {/* Income vs Expense */}
            <Card style={{ marginTop: spacing.md }} testID="income-vs-expense-card">
              <SectionHeader title="Income vs Expense" />
              <View style={{ flexDirection: "row", gap: spacing.lg, marginTop: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: palette.muted, fontSize: 11, letterSpacing: 0.6 }}>INCOME</Text>
                  <Text style={{ color: palette.success, fontSize: 20, fontFamily: mono, marginTop: 4 }}>
                    {formatAmount(totals.income, cur.symbol)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: palette.muted, fontSize: 11, letterSpacing: 0.6 }}>EXPENSE</Text>
                  <Text style={{ color: palette.error, fontSize: 20, fontFamily: mono, marginTop: 4 }}>
                    {formatAmount(totals.expense, cur.symbol)}
                  </Text>
                </View>
              </View>
              {/* Ratio Bar */}
              <View style={{ height: 8, borderRadius: 999, backgroundColor: palette.error, marginTop: spacing.md, overflow: "hidden" }}>
                <View
                  style={{
                    height: "100%",
                    width: totals.income + totals.expense > 0 ? `${(totals.income / (totals.income + totals.expense)) * 100}%` : "0%",
                    backgroundColor: palette.success,
                  }}
                />
              </View>
            </Card>

            {/* Trend */}
            {barData.length > 1 && (
              <Card style={{ marginTop: spacing.md }} testID="daily-trend-card">
                <SectionHeader title="Recent Daily Expense" />
                <BarChart
                  data={barData}
                  width={chartWidth}
                  height={140}
                  barWidth={22}
                  spacing={14}
                  hideRules
                  xAxisThickness={0}
                  yAxisThickness={0}
                  yAxisTextStyle={{ color: palette.muted, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: palette.muted, fontSize: 10 }}
                  noOfSections={3}
                  frontColor={palette.brandPrimary}
                />
              </Card>
            )}

            {/* Category breakdown */}
            {breakdown.length > 0 && (
              <Card style={{ marginTop: spacing.md }} testID="category-breakdown-card">
                <SectionHeader title="By Category" />
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg, marginTop: spacing.sm }}>
                  <PieChart
                    data={pieData.length ? pieData : [{ value: 1, color: palette.surfaceTertiary }]}
                    radius={64}
                    innerRadius={40}
                    donut
                    centerLabelComponent={() => (
                      <View style={{ alignItems: "center" }}>
                        <Text style={{ color: palette.muted, fontSize: 9 }}>TOTAL</Text>
                        <Text style={{ color: palette.onSurface, fontFamily: mono, fontSize: 13 }}>
                          {formatAmount(totals.expense, cur.symbol)}
                        </Text>
                      </View>
                    )}
                  />
                  <View style={{ flex: 1, gap: spacing.sm }}>
                    {breakdown.slice(0, 5).map((b, i) => (
                      <View key={i} style={styles.legendRow}>
                        <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: b.color }} />
                        <Text style={{ color: palette.onSurface, fontSize: 12, flex: 1 }} numberOfLines={1}>{b.name}</Text>
                        <Text style={{ color: palette.muted, fontSize: 11, fontFamily: mono }}>
                          {totals.expense > 0 ? ((b.total / totals.expense) * 100).toFixed(0) : 0}%
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Card>
            )}

            {/* Top Merchants */}
            {merchants.length > 0 && (
              <Card style={{ marginTop: spacing.md }} testID="top-merchants-card">
                <SectionHeader title="Top Merchants" />
                {merchants.map((m, i) => (
                  <View key={i} style={styles.merchantRow}>
                    <View style={[styles.rank, { backgroundColor: palette.brandTertiary }]}>
                      <Text style={{ color: palette.brandPrimary, fontFamily: mono, fontSize: 12 }}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: palette.onSurface, fontSize: 14, fontWeight: "500" }}>{m.merchant}</Text>
                      <Text style={{ color: palette.muted, fontSize: 11 }}>{m.count} transactions</Text>
                    </View>
                    <Text style={{ color: palette.error, fontFamily: mono, fontSize: 14 }}>
                      {formatAmount(m.total, cur.symbol)}
                    </Text>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  legendRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  merchantRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  rank: { width: 28, height: 28, borderRadius: 999, alignItems: "center", justifyContent: "center" },
});
