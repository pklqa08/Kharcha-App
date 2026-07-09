import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

import { useTheme, spacing, radius, mono } from "@/src/presentation/theme/theme";
import { useSettings } from "@/src/application/providers/AppProviders";
import { CURRENCIES } from "@/src/domain/services/currencies";
import { PrimaryButton } from "@/src/presentation/components/ui";
import { PinPad } from "@/src/presentation/components/PinPad";
import { savePin } from "@/src/domain/services/pin";

type Step = "welcome" | "currency" | "pin_setup" | "pin_confirm";

export default function Onboarding() {
  const { palette } = useTheme();
  const { setCurrency, markOnboarded, refresh, currency } = useSettings();
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedCurrency, setSelected] = useState<string>(currency ?? "INR");
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState<string | null>(null);

  const finish = async (opts?: { skipPin?: boolean }) => {
    await setCurrency(selectedCurrency);
    if (opts?.skipPin) {
      await markOnboarded();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    }
  };

  const handleFinishWithPin = async (confirmValue?: string) => {
    const confirm = confirmValue ?? pin2;
    if (pin1 !== confirm) {
      setError("PINs do not match");
      setPin2("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    await savePin(pin1);
    await setCurrency(selectedCurrency);
    await markOnboarded();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {step === "welcome" && (
          <View style={styles.center} testID="onboarding-welcome">
            <View style={{ alignItems: "center", paddingHorizontal: spacing.xl }}>
              <View style={[styles.badge, { borderColor: palette.brandPrimary }]}>
                <Text style={[styles.brand, { color: palette.brandPrimary, fontFamily: mono }]}>K</Text>
              </View>
              <Text style={[styles.h1, { color: palette.onSurface }]}>Kharcha</Text>
              <Text style={[styles.tagline, { color: palette.muted }]}>
                Intelligent personal finance. Fully offline. Beautifully organised.
              </Text>
            </View>
            <View style={{ padding: spacing.xl, width: "100%" }}>
              <PrimaryButton label="Get Started" onPress={() => setStep("currency")} icon="arrow-right" testID="onboarding-start-btn" />
            </View>
          </View>
        )}

        {step === "currency" && (
          <View style={{ flex: 1 }} testID="onboarding-currency">
            <Text style={[styles.stepTitle, { color: palette.onSurface }]}>Choose your currency</Text>
            <Text style={[styles.stepSub, { color: palette.muted }]}>You can change this later in Settings.</Text>
            <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c.code}
                  testID={`currency-option-${c.code}`}
                  onPress={() => { Haptics.selectionAsync(); setSelected(c.code); }}
                  style={[
                    styles.currencyRow,
                    {
                      backgroundColor: selectedCurrency === c.code ? palette.brandTertiary : palette.surfaceSecondary,
                      borderColor: selectedCurrency === c.code ? palette.brandPrimary : palette.border,
                    },
                  ]}
                >
                  <Text style={[styles.currencySymbol, { color: palette.onSurface, fontFamily: mono }]}>{c.symbol}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.onSurface, fontSize: 15, fontWeight: "500" }}>{c.name}</Text>
                    <Text style={{ color: palette.muted, fontSize: 12, marginTop: 2 }}>{c.code}</Text>
                  </View>
                  {selectedCurrency === c.code && <Feather name="check" size={18} color={palette.brandPrimary} />}
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.footerBtns}>
              <PrimaryButton label="Continue" onPress={() => setStep("pin_setup")} testID="currency-continue-btn" icon="arrow-right" />
            </View>
          </View>
        )}

        {step === "pin_setup" && (
          <View style={{ flex: 1, paddingHorizontal: spacing.lg }} testID="onboarding-pin-setup">
            <Text style={[styles.stepTitle, { color: palette.onSurface }]}>Set a 4-digit PIN</Text>
            <Text style={[styles.stepSub, { color: palette.muted }]}>Protects the app when you open it.</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <PinPad
                value={pin1}
                onChange={setPin1}
                onSubmit={() => setStep("pin_confirm")}
                testIDPrefix="setup-pin"
              />
            </View>
            <View style={styles.footerBtns}>
              <PrimaryButton label="Skip PIN" variant="ghost" onPress={() => finish({ skipPin: true })} testID="skip-pin-btn" />
            </View>
          </View>
        )}

        {step === "pin_confirm" && (
          <View style={{ flex: 1, paddingHorizontal: spacing.lg }} testID="onboarding-pin-confirm">
            <Text style={[styles.stepTitle, { color: palette.onSurface }]}>Confirm your PIN</Text>
            <Text style={[styles.stepSub, { color: palette.muted }]}>Enter the same 4 digits again.</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <PinPad
                value={pin2}
                onChange={(v) => { setPin2(v); setError(null); }}
                onSubmit={(v) => handleFinishWithPin(v)}
                error={error}
                testIDPrefix="confirm-pin"
              />
            </View>
            <View style={styles.footerBtns}>
              <PrimaryButton label="Back" variant="ghost" onPress={() => { setPin2(""); setPin1(""); setError(null); setStep("pin_setup"); }} testID="pin-back-btn" />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "space-between", paddingTop: spacing["3xl"] },
  badge: { width: 88, height: 88, borderRadius: 20, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  brand: { fontSize: 44, fontWeight: "500" },
  h1: { fontSize: 34, fontWeight: "500", letterSpacing: -1, marginBottom: spacing.sm },
  tagline: { fontSize: 15, textAlign: "center", lineHeight: 22, paddingHorizontal: spacing.lg },
  stepTitle: { fontSize: 24, fontWeight: "500", marginTop: spacing.xl, marginHorizontal: spacing.lg, letterSpacing: -0.5 },
  stepSub: { fontSize: 13, marginHorizontal: spacing.lg, marginBottom: spacing.lg, marginTop: spacing.xs },
  currencyRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.sm },
  currencySymbol: { fontSize: 22, width: 44, textAlign: "center" },
  footerBtns: { padding: spacing.lg, gap: spacing.sm },
});
