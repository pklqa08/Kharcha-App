import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useTheme, spacing, radius, mono } from "../core/theme";
import { Transaction, Category } from "../data/models";
import { formatAmount, getCurrency } from "../core/currencies";

interface Props {
  txn: Transaction;
  category?: Category | null;
  currencyCode: string;
  onPress?: () => void;
  onLongPress?: () => void;
  testID?: string;
}

export const TransactionRow: React.FC<Props> = ({ txn, category, currencyCode, onPress, onLongPress, testID }) => {
  const { palette } = useTheme();
  const cur = getCurrency(currencyCode);
  const isIncome = txn.type === "credit";
  const amountColor = isIncome ? palette.success : palette.error;
  const iconName = (category?.icon ?? "circle") as keyof typeof Feather.glyphMap;
  const iconColor = category?.color ?? palette.muted;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? palette.surfaceTertiary : "transparent" }]}
    >
      <View style={[styles.iconBox, { backgroundColor: `${iconColor}22`, borderColor: `${iconColor}44` }]}>
        <Feather name={iconName} size={18} color={iconColor} />
      </View>
      <View style={styles.middle}>
        <Text style={[styles.title, { color: palette.onSurface }]} numberOfLines={1}>
          {txn.merchant || txn.description || category?.name || (isIncome ? "Income" : "Expense")}
        </Text>
        <Text style={[styles.sub, { color: palette.muted }]} numberOfLines={1}>
          {category?.name ?? "Uncategorized"} \u00B7 {dayjs(txn.date).format("h:mm A")}
          {txn.payment_mode ? ` \u00B7 ${txn.payment_mode.toUpperCase()}` : ""}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor, fontFamily: mono }]}>
        {formatAmount(txn.amount, cur.symbol, { signMode: isIncome ? "income" : "expense" })}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconBox: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  middle: { flex: 1 },
  title: { fontSize: 15, fontWeight: "500" },
  sub: { fontSize: 12, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: "500", letterSpacing: -0.2 },
});
