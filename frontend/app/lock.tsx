import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";

import { useTheme, spacing, mono } from "@/src/core/theme";
import { PinPad } from "@/src/widgets/PinPad";
import { verifyPin } from "@/src/core/pin";
import { useSettings } from "@/src/providers/AppProviders";

export default function LockScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { biometricEnabled } = useSettings();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    (async () => {
      const hw = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hw && enrolled && biometricEnabled);
      if (hw && enrolled && biometricEnabled) tryBiometric();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricEnabled]);

  const tryBiometric = async () => {
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Kharcha",
        fallbackLabel: "Use PIN",
        disableDeviceFallback: false,
      });
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      }
    } catch {}
  };

  const handleSubmit = async (submittedValue?: string) => {
    const candidate = submittedValue ?? pin;
    const ok = await verifyPin(candidate);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Incorrect PIN");
      setPin("");
      setAttempts((a) => a + 1);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }} testID="lock-screen">
      <View style={styles.header}>
        <Text style={[styles.brand, { color: palette.brandPrimary, fontFamily: mono }]}>KHARCHA</Text>
        <Text style={[styles.title, { color: palette.onSurface }]}>Enter PIN to unlock</Text>
      </View>
      <View style={styles.pad}>
        <PinPad
          value={pin}
          onChange={(v) => { setPin(v); if (error) setError(null); }}
          onSubmit={(v) => handleSubmit(v)}
          onBiometric={tryBiometric}
          biometricAvailable={biometricAvailable}
          error={error}
          testIDPrefix="lock-pin"
        />
        {attempts >= 3 && (
          <Text style={{ color: palette.muted, marginTop: spacing.lg, fontSize: 12 }}>
            Forgot PIN? Reinstall the app to reset (local storage will be wiped).
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", paddingTop: spacing["2xl"], paddingHorizontal: spacing.lg },
  brand: { fontSize: 14, letterSpacing: 4, marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: "500", letterSpacing: -0.5 },
  pad: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
});
