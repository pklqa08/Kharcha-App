import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle, Pressable } from "react-native";
import { useTheme } from "@/src/presentation/theme/theme";
import { spacing, radius, mono } from "@/src/presentation/theme/theme";
import { Feather } from "@expo/vector-icons";

/* -------- Card -------- */
export const Card: React.FC<{ children: React.ReactNode; style?: ViewStyle; onPress?: () => void; testID?: string }> = ({ children, style, onPress, testID }) => {
  const { palette } = useTheme();
  const inner = (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: palette.surfaceSecondary,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: palette.border,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{inner}</Pressable>;
  return inner;
};

/* -------- Section Header -------- */
export const SectionHeader: React.FC<{ title: string; action?: { label: string; onPress: () => void; testID?: string } }> = ({ title, action }) => {
  const { palette } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: palette.onSurface }]}>{title}</Text>
      {action && (
        <Pressable onPress={action.onPress} testID={action.testID}>
          <Text style={[styles.sectionAction, { color: palette.brandPrimary }]}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
};

/* -------- Stat Card -------- */
export const StatCard: React.FC<{ label: string; value: string; accent?: string; icon?: keyof typeof Feather.glyphMap; testID?: string; style?: ViewStyle }> = ({ label, value, accent, icon, testID, style }) => {
  const { palette } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        {
          flex: 1,
          backgroundColor: palette.surfaceSecondary,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: palette.border,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      <View style={styles.statTop}>
        <Text style={[styles.statLabel, { color: palette.muted }]}>{label}</Text>
        {icon && <Feather name={icon} size={14} color={accent ?? palette.muted} />}
      </View>
      <Text style={[styles.statValue, { color: accent ?? palette.onSurface, fontFamily: mono }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
};

/* -------- Empty State -------- */
export const EmptyState: React.FC<{ icon?: keyof typeof Feather.glyphMap; title: string; subtitle?: string; cta?: { label: string; onPress: () => void; testID?: string } }> = ({ icon = "inbox", title, subtitle, cta }) => {
  const { palette } = useTheme();
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIcon, { borderColor: palette.border }]}>
        <Feather name={icon} size={28} color={palette.muted} />
      </View>
      <Text style={[styles.emptyTitle, { color: palette.onSurface }]}>{title}</Text>
      {subtitle && <Text style={[styles.emptySubtitle, { color: palette.muted }]}>{subtitle}</Text>}
      {cta && (
        <Pressable
          testID={cta.testID}
          onPress={cta.onPress}
          style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: palette.brandPrimary, borderRadius: radius.pill }}
        >
          <Text style={{ color: palette.onBrandPrimary, fontWeight: "500" }}>{cta.label}</Text>
        </Pressable>
      )}
    </View>
  );
};

/* -------- Primary Button -------- */
export const PrimaryButton: React.FC<{ label: string; onPress: () => void; disabled?: boolean; testID?: string; icon?: keyof typeof Feather.glyphMap; variant?: "primary" | "secondary" | "ghost" }> = ({ label, onPress, disabled, testID, icon, variant = "primary" }) => {
  const { palette } = useTheme();
  const bg = variant === "primary" ? palette.brandPrimary : variant === "secondary" ? palette.surfaceTertiary : "transparent";
  const fg = variant === "primary" ? palette.onBrandPrimary : palette.onSurface;
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md + 2,
          borderRadius: radius.pill,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
        },
      ]}
    >
      {icon && <Feather name={icon} size={16} color={fg} />}
      <Text style={{ color: fg, fontSize: 15, fontWeight: "500" }}>{label}</Text>
    </Pressable>
  );
};

/* -------- Header -------- */
export const ScreenHeader: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode; onBack?: () => void }> = ({ title, subtitle, right, onBack }) => {
  const { palette } = useTheme();
  return (
    <View style={[styles.header]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 }}>
        {onBack && (
          <Pressable onPress={onBack} testID="header-back-button" hitSlop={12}>
            <Feather name="arrow-left" size={22} color={palette.onSurface} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: palette.onSurface }]} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={[styles.headerSubtitle, { color: palette.muted }]} numberOfLines={1}>{subtitle}</Text>}
        </View>
      </View>
      {right}
    </View>
  );
};

/* -------- Chip -------- */
export const Chip: React.FC<{ label: string; selected?: boolean; onPress: () => void; testID?: string }> = ({ label, selected, onPress, testID }) => {
  const { palette } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={{
        height: 36,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? palette.brandPrimary : palette.border,
        backgroundColor: selected ? palette.brandTertiary : palette.surfaceSecondary,
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <Text style={{ color: selected ? palette.onBrandTertiary : palette.onSurface, fontSize: 13, fontWeight: "500" }}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md, marginTop: spacing.lg },
  sectionTitle: { fontSize: 12, fontWeight: "500", textTransform: "uppercase", letterSpacing: 1 },
  sectionAction: { fontSize: 13, fontWeight: "500" },
  statTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  statLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 },
  statValue: { fontSize: 22, fontWeight: "500", letterSpacing: -0.5 },
  emptyWrap: { alignItems: "center", justifyContent: "center", paddingVertical: spacing["3xl"] },
  emptyIcon: { width: 72, height: 72, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  emptyTitle: { fontSize: 17, fontWeight: "500", marginBottom: spacing.xs },
  emptySubtitle: { fontSize: 13, textAlign: "center", paddingHorizontal: spacing.xl },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, gap: spacing.md },
  headerTitle: { fontSize: 22, fontWeight: "500", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
});
