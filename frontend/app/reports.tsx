import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import dayjs from "dayjs";

import { useTheme, spacing, radius, mono } from "@/src/presentation/theme/theme";
import { useTransactionProvider } from "@/src/application/providers";
import { useSettings } from "@/src/application/providers/AppProviders";
import { getCurrency, formatAmount } from "@/src/domain/services/currencies";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from "@/src/domain/services/format";
import { ScreenHeader, Card, Chip, SectionHeader, EmptyState } from "@/src/presentation/components/ui";

type Period = "day" | "month" | "year";

interface ReportData {
  totals: { income: number; expense: number };
  categories: Array<{ name: string; color: string; total: number }>;
  merchants: Array<{ merchant: string; total: number; count: number }>;
}

export default function Reports() {
  const { palette } = useTheme();
  const { totalsBetween, categoryBreakdown, topMerchants } = useTransactionProvider();
  const { currency } = useSettings();
  const cur = getCurrency(currency);
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<ReportData>({ totals: { income: 0, expense: 0 }, categories: [], merchants: [] });

  const load = useCallback(async () => {
    const from = period === "day" ? startOfDay() : period === "month" ? startOfMonth() : startOfYear();
    const to = period === "day" ? endOfDay() : period === "month" ? endOfMonth() : endOfYear();
    const [totals, cats, merchants] = await Promise.all([
      totalsBetween(from, to),
      categoryBreakdown(from, to, "debit"),
      topMerchants(from, to, 10),
    ]);
    setData({ totals, categories: cats.map((c) => ({ name: c.name, color: c.color, total: c.total })), merchants });
  }, [period, totalsBetween, categoryBreakdown, topMerchants]);

  useEffect(() => { load(); }, [load]);

  const periodLabel =
    period === "day" ? dayjs().format("dddd, MMM D, YYYY") :
    period === "month" ? dayjs().format("MMMM YYYY") :
    dayjs().format("YYYY");

  const savings = data.totals.income - data.totals.expense;
  const hasData = data.totals.income > 0 || data.totals.expense > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }} edges={["top"]} testID="reports-screen">
      <ScreenHeader title="Reports" subtitle={periodLabel} onBack={() => router.back()} />
      <View style={{ flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <Chip label="Today" selected={period === "day"} onPress={() => setPeriod("day")} testID="report-day" />
        <Chip label="Month" selected={period === "month"} onPress={() => setPeriod("month")} testID="report-month" />
        <Chip label="Year" selected={period === "year"} onPress={() => setPeriod("year")} testID="report-year" />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
        {!hasData ? (
          <EmptyState icon="file-text" title="No data for this period" subtitle="Add some transactions to generate a report." />
        ) : (
          <>
            <Card testID="summary-card">
              <SectionHeader title="Summary" />
              <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
                <SummaryLine label="Income" value={formatAmount(data.totals.income, cur.symbol)} color={palette.success} palette={palette} />
                <SummaryLine label="Expense" value={formatAmount(data.totals.expense, cur.symbol)} color={palette.error} palette={palette} />
                <View style={[styles.line, { backgroundColor: palette.divider }]} />
                <SummaryLine label="Net Savings" value={formatAmount(savings, cur.symbol, { signMode: savings >= 0 ? "income" : "expense" })} color={savings >= 0 ? palette.success : palette.error} palette={palette} bold />
              </View>
            </Card>

            <Card style={{ marginTop: spacing.md }} testID="cat-summary-card">
              <SectionHeader title="By Category" />
              {data.categories.length === 0 ? (
                <Text style={{ color: palette.muted, fontSize: 13 }}>No expense categorised.</Text>
              ) : (
                data.categories.map((c, i) => (
                  <View key={i} style={styles.catRow}>
                    <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c.color }} />
                    <Text style={{ flex: 1, color: palette.onSurface, fontSize: 14 }} numberOfLines={1}>{c.name}</Text>
                    <Text style={{ color: palette.onSurface, fontFamily: mono, fontSize: 13 }}>
                      {formatAmount(c.total, cur.symbol)}
                    </Text>
                  </View>
                ))
              )}
            </Card>

            <Card style={{ marginTop: spacing.md }} testID="merchant-summary-card">
              <SectionHeader title="By Merchant" />
              {data.merchants.length === 0 ? (
                <Text style={{ color: palette.muted, fontSize: 13 }}>No merchants recorded.</Text>
              ) : (
                data.merchants.map((m, i) => (
                  <View key={i} style={styles.catRow}>
                    <Text style={{ color: palette.muted, fontFamily: mono, fontSize: 11, width: 24 }}>{i + 1}</Text>
                    <Text style={{ flex: 1, color: palette.onSurface, fontSize: 14 }} numberOfLines={1}>{m.merchant}</Text>
                    <Text style={{ color: palette.muted, fontSize: 11, marginRight: spacing.sm }}>{m.count}x</Text>
                    <Text style={{ color: palette.error, fontFamily: mono, fontSize: 13 }}>
                      {formatAmount(m.total, cur.symbol)}
                    </Text>
                  </View>
                ))
              )}
            </Card>

            <Text style={{ color: palette.muted, fontSize: 11, textAlign: "center", marginTop: spacing.lg }}>
              Export as PDF/CSV coming soon.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const SummaryLine: React.FC<{ label: string; value: string; color: string; palette: any; bold?: boolean }> = ({ label, value, color, palette, bold }) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
    <Text style={{ color: palette.muted, fontSize: bold ? 14 : 13, fontWeight: bold ? "500" : "400" }}>{label}</Text>
    <Text style={{ color, fontFamily: mono, fontSize: bold ? 18 : 15 }}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  line: { height: 1, marginVertical: spacing.xs },
  catRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
});
