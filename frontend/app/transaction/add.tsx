import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";

import { useTheme, spacing, radius, mono } from "@/src/presentation/theme/theme";
import { useCategoryProvider, useTransactionProvider } from "@/src/application/providers";
import { useSettings } from "@/src/application/providers/AppProviders";
import { PaymentMode, TxnType } from "@/src/domain/entities/models";
import { getCurrency } from "@/src/domain/services/currencies";
import { ScreenHeader, PrimaryButton, Chip } from "@/src/presentation/components/ui";

const PAYMENT_MODES: PaymentMode[] = ["cash", "upi", "card", "netbanking", "wallet", "other"];

export default function AddEditTransaction() {
  const { palette } = useTheme();
  const { categories, loadCategories } = useCategoryProvider();
  const { getTransactionById, saveTransaction, deleteTransaction } = useTransactionProvider();
  const { currency } = useSettings();
  const cur = getCurrency(currency);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [type, setType] = useState<TxnType>("debit");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("upi");
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<null | "date" | "time">(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCats = useCallback(async () => {
    await loadCategories(type === "credit" ? "income" : "expense");
  }, [type, loadCategories]);

  useEffect(() => { loadCats(); }, [loadCats]);

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categoryId, categories]);

  useEffect(() => {
    (async () => {
      if (!isEdit || !id) return;
      const t = await getTransactionById(id);
      if (!t) return;
      setType(t.type);
      setAmount(String(t.amount));
      setMerchant(t.merchant ?? "");
      setNotes(t.notes ?? "");
      setCategoryId(t.category_id);
      setPaymentMode((t.payment_mode as PaymentMode) ?? "upi");
      setDate(new Date(t.date));
    })();
  }, [id, isEdit, getTransactionById]);

  const save = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const input = {
      amount: val,
      type,
      category_id: categoryId,
      merchant: merchant.trim() || null,
      notes: notes.trim() || null,
      date: date.toISOString(),
      payment_mode: paymentMode,
    };
    await saveTransaction(input, isEdit && id ? id : undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleDelete = useCallback(async () => {
    if (!id || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.back();
    } finally {
      setIsDeleting(false);
    }
  }, [id, isDeleting, deleteTransaction, router]);

  const del = useCallback(async () => {
    if (!id || isDeleting) return;

    if (Platform.OS === "web") {
      const confirmFn = (globalThis as { confirm?: (message?: string) => boolean }).confirm;
      const confirmed = typeof confirmFn === "function"
        ? confirmFn("Delete transaction?\n\nThis cannot be undone.")
        : false;

      if (!confirmed) {
        return;
      }

      try {
        await handleDelete();
      } catch (error) {
        console.warn("[txn-form] Failed to delete transaction", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Unable to delete transaction", "Please try again.");
      }
      return;
    }

    Alert.alert("Delete transaction?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await handleDelete();
          } catch (error) {
            console.warn("[txn-form] Failed to delete transaction", error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Unable to delete transaction", "Please try again.");
          }
        }
      }
    ]);
  }, [id, isDeleting, handleDelete]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }} edges={["top"]} testID="txn-form-screen">
      <ScreenHeader
        title={isEdit ? "Edit Transaction" : "Add Transaction"}
        onBack={() => router.back()}
        right={isEdit ? (
          <Pressable testID="txn-delete-btn" onPress={del} hitSlop={12} disabled={isDeleting}>
            <Feather name="trash-2" size={20} color={palette.error} />
          </Pressable>
        ) : undefined}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          {/* Type Toggle */}
          <View style={[styles.typeToggle, { backgroundColor: palette.surfaceSecondary, borderColor: palette.border }]}>
            <Pressable
              testID="type-expense"
              onPress={() => { Haptics.selectionAsync(); setType("debit"); setCategoryId(null); }}
              style={[styles.typeBtn, type === "debit" && { backgroundColor: palette.error }]}
            >
              <Feather name="arrow-down-right" size={16} color={type === "debit" ? palette.onError : palette.muted} />
              <Text style={{ color: type === "debit" ? palette.onError : palette.muted, fontWeight: "500" }}>Expense</Text>
            </Pressable>
            <Pressable
              testID="type-income"
              onPress={() => { Haptics.selectionAsync(); setType("credit"); setCategoryId(null); }}
              style={[styles.typeBtn, type === "credit" && { backgroundColor: palette.success }]}
            >
              <Feather name="arrow-up-right" size={16} color={type === "credit" ? palette.onSuccess : palette.muted} />
              <Text style={{ color: type === "credit" ? palette.onSuccess : palette.muted, fontWeight: "500" }}>Income</Text>
            </Pressable>
          </View>

          {/* Amount */}
          <View style={styles.amountBlock}>
            <Text style={{ color: palette.muted, fontSize: 11, letterSpacing: 0.8 }}>AMOUNT</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, marginTop: spacing.xs }}>
              <Text style={{ color: palette.onSurface, fontSize: 32, fontFamily: mono }}>{cur.symbol}</Text>
              <TextInput
                testID="amount-input"
                placeholder="0"
                placeholderTextColor={palette.muted}
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ""))}
                keyboardType="decimal-pad"
                style={[styles.amountInput, { color: palette.onSurface, fontFamily: mono, borderBottomColor: palette.borderStrong }]}
                autoFocus={!isEdit}
              />
            </View>
          </View>

          {/* Category */}
          <Label palette={palette}>Category</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
            {categories.map((c) => (
              <Pressable
                key={c.id}
                testID={`cat-${c.id}`}
                onPress={() => { Haptics.selectionAsync(); setCategoryId(c.id); }}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: categoryId === c.id ? `${c.color}33` : palette.surfaceSecondary,
                    borderColor: categoryId === c.id ? c.color : palette.border,
                  },
                ]}
              >
                <Feather name={c.icon as any} size={14} color={c.color} />
                <Text style={{ color: palette.onSurface, fontSize: 13 }}>{c.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Merchant */}
          <Label palette={palette}>Merchant / Description</Label>
          <TextInput
            testID="merchant-input"
            placeholder="e.g., Zomato, Uber, Amazon..."
            placeholderTextColor={palette.muted}
            value={merchant}
            onChangeText={setMerchant}
            style={[styles.input, { color: palette.onSurface, borderColor: palette.border, backgroundColor: palette.surfaceSecondary }]}
          />

          {/* Payment Mode */}
          <Label palette={palette}>Payment Mode</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
            {PAYMENT_MODES.map((m) => (
              <Chip key={m} label={m.toUpperCase()} selected={paymentMode === m} onPress={() => setPaymentMode(m)} testID={`pmode-${m}`} />
            ))}
          </ScrollView>

          {/* Date */}
          <Label palette={palette}>Date & Time</Label>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Pressable
              testID="date-btn"
              onPress={() => setShowDatePicker("date")}
              style={[styles.dateBtn, { borderColor: palette.border, backgroundColor: palette.surfaceSecondary }]}
            >
              <Feather name="calendar" size={16} color={palette.muted} />
              <Text style={{ color: palette.onSurface, fontFamily: mono, fontSize: 14 }}>{dayjs(date).format("MMM D, YYYY")}</Text>
            </Pressable>
            <Pressable
              testID="time-btn"
              onPress={() => setShowDatePicker("time")}
              style={[styles.dateBtn, { borderColor: palette.border, backgroundColor: palette.surfaceSecondary }]}
            >
              <Feather name="clock" size={16} color={palette.muted} />
              <Text style={{ color: palette.onSurface, fontFamily: mono, fontSize: 14 }}>{dayjs(date).format("h:mm A")}</Text>
            </Pressable>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode={showDatePicker}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, d) => {
                setShowDatePicker(null);
                if (d) setDate(d);
              }}
            />
          )}

          {/* Notes */}
          <Label palette={palette}>Notes</Label>
          <TextInput
            testID="notes-input"
            placeholder="Optional notes..."
            placeholderTextColor={palette.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
            style={[styles.input, { color: palette.onSurface, borderColor: palette.border, backgroundColor: palette.surfaceSecondary, minHeight: 80, textAlignVertical: "top" }]}
          />
        </ScrollView>
        <View style={{ padding: spacing.lg, paddingBottom: spacing.xl, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.divider }}>
          <PrimaryButton
            testID="save-txn-btn"
            label={isEdit ? "Save Changes" : `Save ${type === "debit" ? "Expense" : "Income"}`}
            onPress={save}
            icon="check"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const Label: React.FC<{ palette: any; children: React.ReactNode }> = ({ palette, children }) => (
  <Text style={{ color: palette.muted, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", marginTop: spacing.lg, marginBottom: spacing.sm }}>{children}</Text>
);

const styles = StyleSheet.create({
  typeToggle: { flexDirection: "row", padding: 4, borderRadius: radius.pill, borderWidth: 1 },
  typeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.pill },
  amountBlock: { marginTop: spacing.xl, marginBottom: spacing.md },
  amountInput: { flex: 1, fontSize: 40, borderBottomWidth: 1, paddingVertical: spacing.xs, letterSpacing: -1 },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15 },
  catChip: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, height: 36, borderRadius: radius.pill, borderWidth: 1, flexShrink: 0 },
  dateBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
});
