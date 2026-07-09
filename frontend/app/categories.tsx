import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme, spacing, radius } from "@/src/shared/theme/theme";
import { useCategoryProvider } from "@/src/application/providers";
import { ScreenHeader, PrimaryButton, Chip, EmptyState } from "@/src/presentation/widgets/ui";

const ICON_OPTIONS: Array<keyof typeof Feather.glyphMap> = [
  "coffee", "shopping-cart", "shopping-bag", "truck", "film", "zap",
  "heart", "book", "home", "map", "droplet", "briefcase", "trending-up",
  "activity", "edit", "gift", "plus-circle", "star", "smile", "phone",
  "wifi", "tv", "camera", "music", "package",
];

const COLORS = ["#FF5E00", "#00B359", "#4A90E2", "#E91E63", "#9C27B0", "#FFC200", "#F44336", "#3F51B5", "#795548", "#009688", "#607D8B", "#FF6B35"];

export default function CategoriesScreen() {
  const { palette } = useTheme();
  const { categories: cats, loadCategories, createCategory, removeCategory } = useCategoryProvider();
  const router = useRouter();
  const [tab, setTab] = useState<"expense" | "income">("expense");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<keyof typeof Feather.glyphMap>("shopping-cart");
  const [color, setColor] = useState(COLORS[0]);

  const load = useCallback(async () => {
    await loadCategories(tab);
  }, [tab, loadCategories]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    await createCategory(name.trim(), tab, icon, color);
    setName(""); setAdding(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    load();
  };

  const remove = async (id: string) => {
    await removeCategory(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    load();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }} edges={["top"]} testID="categories-screen">
      <ScreenHeader title="Categories" onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <Chip label="Expense" selected={tab === "expense"} onPress={() => setTab("expense")} testID="cat-tab-expense" />
          <Chip label="Income" selected={tab === "income"} onPress={() => setTab("income")} testID="cat-tab-income" />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
          {cats.length === 0 ? (
            <EmptyState icon="tag" title="No categories" />
          ) : (
            <View style={styles.grid}>
              {cats.map((c) => (
                <Pressable
                  key={c.id}
                  testID={`cat-item-${c.id}`}
                  onLongPress={() => c.is_custom ? remove(c.id) : null}
                  style={[styles.card, { backgroundColor: palette.surfaceSecondary, borderColor: palette.border }]}
                >
                  <View style={[styles.catIcon, { backgroundColor: `${c.color}22`, borderColor: `${c.color}44` }]}>
                    <Feather name={c.icon as any} size={18} color={c.color} />
                  </View>
                  <Text style={{ color: palette.onSurface, fontSize: 12, fontWeight: "500", textAlign: "center" }} numberOfLines={2}>{c.name}</Text>
                  {c.is_custom === 1 && <Text style={{ color: palette.muted, fontSize: 9, marginTop: 2 }}>CUSTOM</Text>}
                </Pressable>
              ))}
            </View>
          )}

          {adding && (
            <View style={[styles.addForm, { backgroundColor: palette.surfaceSecondary, borderColor: palette.border }]}>
              <Text style={{ color: palette.muted, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: spacing.sm }}>New Category</Text>
              <TextInput
                testID="new-cat-name"
                placeholder="Category name"
                placeholderTextColor={palette.muted}
                value={name}
                onChangeText={setName}
                style={[styles.input, { color: palette.onSurface, borderColor: palette.border, backgroundColor: palette.surface }]}
              />
              <Text style={{ color: palette.muted, fontSize: 11, marginTop: spacing.md, marginBottom: spacing.sm }}>ICON</Text>
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map((i) => (
                  <Pressable key={i} testID={`icon-${i}`} onPress={() => setIcon(i)} style={[styles.iconOpt, { borderColor: icon === i ? color : palette.border, backgroundColor: icon === i ? `${color}22` : "transparent" }]}>
                    <Feather name={i} size={16} color={icon === i ? color : palette.onSurface} />
                  </Pressable>
                ))}
              </View>
              <Text style={{ color: palette.muted, fontSize: 11, marginTop: spacing.md, marginBottom: spacing.sm }}>COLOR</Text>
              <View style={styles.iconGrid}>
                {COLORS.map((c) => (
                  <Pressable key={c} testID={`color-${c}`} onPress={() => setColor(c)} style={[styles.colorOpt, { backgroundColor: c, borderColor: color === c ? palette.onSurface : "transparent" }]} />
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton label="Cancel" variant="secondary" onPress={() => { setAdding(false); setName(""); }} testID="cancel-cat-btn" />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton label="Add" onPress={create} testID="save-cat-btn" icon="check" />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {!adding && (
          <View style={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
            <PrimaryButton label="Add Custom Category" onPress={() => setAdding(true)} icon="plus" testID="add-cat-btn" />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  card: { width: "31%", padding: spacing.md, borderRadius: radius.md, borderWidth: 1, alignItems: "center", gap: spacing.sm },
  catIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  addForm: { marginTop: spacing.lg, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15 },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  iconOpt: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  colorOpt: { width: 32, height: 32, borderRadius: 999, borderWidth: 2 },
});
