import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme, spacing, radius, mono } from "../core/theme";

interface PinPadProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  onBiometric?: () => void;
  error?: string | null;
  length?: number;
  biometricAvailable?: boolean;
  testIDPrefix?: string;
}

export const PinPad: React.FC<PinPadProps> = ({ value, onChange, onSubmit, onBiometric, error, length = 4, biometricAvailable, testIDPrefix = "pin" }) => {
  const { palette } = useTheme();

  const press = (n: string) => {
    Haptics.selectionAsync();
    if (value.length < length) {
      const next = value + n;
      onChange(next);
      if (next.length === length && onSubmit) setTimeout(onSubmit, 80);
    }
  };
  const back = () => {
    Haptics.selectionAsync();
    onChange(value.slice(0, -1));
  };

  const rows: Array<Array<string | "back" | "bio" | "empty">> = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [biometricAvailable ? "bio" : "empty", "0", "back"],
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.dots} testID={`${testIDPrefix}-dots`}>
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < value.length ? palette.brandPrimary : "transparent",
                borderColor: error ? palette.error : palette.borderStrong,
              },
            ]}
          />
        ))}
      </View>
      {error && <Text style={[styles.error, { color: palette.error, fontFamily: mono }]}>{error}</Text>}
      <View style={styles.pad}>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.padRow}>
            {row.map((key, ci) => {
              if (key === "empty") return <View key={ci} style={styles.key} />;
              if (key === "back") {
                return (
                  <Pressable key={ci} testID={`${testIDPrefix}-key-back`} onPress={back} style={({ pressed }) => [styles.key, { opacity: pressed ? 0.5 : 1 }]}>
                    <Feather name="delete" size={22} color={palette.onSurface} />
                  </Pressable>
                );
              }
              if (key === "bio") {
                return (
                  <Pressable key={ci} testID={`${testIDPrefix}-key-bio`} onPress={onBiometric} style={({ pressed }) => [styles.key, { opacity: pressed ? 0.5 : 1 }]}>
                    <Feather name="unlock" size={22} color={palette.brandPrimary} />
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={ci}
                  testID={`${testIDPrefix}-key-${key}`}
                  onPress={() => press(key)}
                  style={({ pressed }) => [styles.key, { backgroundColor: pressed ? palette.surfaceTertiary : palette.surfaceSecondary, borderColor: palette.border }]}
                >
                  <Text style={[styles.keyText, { color: palette.onSurface, fontFamily: mono }]}>{key}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: "center", width: "100%" },
  dots: { flexDirection: "row", gap: spacing.lg, marginBottom: spacing.md },
  dot: { width: 16, height: 16, borderRadius: 999, borderWidth: 1.5 },
  error: { fontSize: 12, marginBottom: spacing.md },
  pad: { width: "100%", maxWidth: 320, gap: spacing.md, marginTop: spacing.lg },
  padRow: { flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  key: { flex: 1, aspectRatio: 1.5, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "transparent" },
  keyText: { fontSize: 24, fontWeight: "500" },
});
