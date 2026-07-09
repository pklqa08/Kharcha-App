import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";

import { useTheme, spacing, radius, mono } from "@/src/shared/theme/theme";
import { useSettings } from "@/src/application/providers/AppProviders";
import { useTransactionProvider } from "@/src/application/providers";
import { CURRENCIES, getCurrency } from "@/src/domain/services/currencies";
import { ScreenHeader } from "@/src/presentation/widgets/ui";
import { clearPin, savePin } from "@/src/domain/services/pin";
import { PinPad } from "@/src/presentation/widgets/PinPad";

type Modal = null | "theme" | "currency" | "about" | "privacy" | "pin_set" | "pin_confirm" | "clear_confirm";

export default function Settings() {
  const { palette, isDark } = useTheme();
  const { themeMode, setThemeMode, currency, setCurrency, pinSet, biometricEnabled, setBiometricEnabled, refresh } = useSettings();
  const { clearTransactions } = useTransactionProvider();
  const router = useRouter();
  const [modal, setModal] = useState<Modal>(null);
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cur = getCurrency(currency);

  const handleBiometricToggle = async (v: boolean) => {
    if (v) {
      const hw = await LocalAuthentication.hasHardwareAsync();
      const en = await LocalAuthentication.isEnrolledAsync();
      if (!hw || !en) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
    }
    setBiometricEnabled(v);
  };

  const handleSetPin = async (confirmValue?: string) => {
    const confirm = confirmValue ?? pin2;
    if (pin1 !== confirm) {
      setError("PINs do not match");
      setPin2("");
      return;
    }
    await savePin(pin1);
    await refresh();
    setPin1(""); setPin2(""); setError(null);
    setModal(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRemovePin = async () => {
    await clearPin();
    await setBiometricEnabled(false);
    await refresh();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleClearData = async () => {
    await clearTransactions();
    setModal(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }} edges={["top"]} testID="settings-screen">
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: spacing.lg }}>
        {/* Preferences */}
        <Section title="Preferences" palette={palette}>
          <Row
            palette={palette}
            icon="dollar-sign"
            label="Currency"
            value={`${cur.symbol}  ${cur.code}`}
            onPress={() => setModal("currency")}
            testID="row-currency"
          />
          <Row
            palette={palette}
            icon={isDark ? "moon" : "sun"}
            label="Theme"
            value={themeMode === "system" ? "System" : themeMode === "dark" ? "Dark" : "Light"}
            onPress={() => setModal("theme")}
            testID="row-theme"
          />
        </Section>

        {/* Security */}
        <Section title="Security" palette={palette}>
          <Row
            palette={palette}
            icon="lock"
            label="App Lock (PIN)"
            value={pinSet ? "Enabled" : "Disabled"}
            onPress={() => (pinSet ? handleRemovePin() : setModal("pin_set"))}
            testID="row-pin"
            action={pinSet ? "Remove" : "Set"}
          />
          <RowSwitch
            palette={palette}
            icon="unlock"
            label="Biometric Unlock"
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
            disabled={!pinSet}
            testID="row-biometric"
          />
        </Section>

        {/* Data */}
        <Section title="Data" palette={palette}>
          <Row palette={palette} icon="tag" label="Categories" value="Manage" onPress={() => router.push("/categories")} testID="row-categories" />
          <Row palette={palette} icon="file-text" label="Reports" value="Open" onPress={() => router.push("/reports")} testID="row-reports" />
          <Row palette={palette} icon="cloud" label="Cloud Backup" value="Coming Soon" testID="row-backup" disabled />
          <Row palette={palette} icon="bell" label="Notifications" value="Coming Soon" testID="row-notifications" disabled />
          <Row palette={palette} icon="trash-2" label="Clear All Transactions" value="Danger" onPress={() => setModal("clear_confirm")} testID="row-clear" danger />
        </Section>

        {/* About */}
        <Section title="About" palette={palette}>
          <Row palette={palette} icon="info" label="About Kharcha" value="v1.0.0" onPress={() => setModal("about")} testID="row-about" />
          <Row palette={palette} icon="shield" label="Privacy" value="Read" onPress={() => setModal("privacy")} testID="row-privacy" />
        </Section>
      </ScrollView>

      {/* Modals */}
      {modal === "theme" && (
        <ModalSheet onClose={() => setModal(null)} palette={palette} title="Theme">
          {(["light", "dark", "system"] as const).map((m) => (
            <Pressable
              key={m}
              testID={`theme-option-${m}`}
              onPress={() => { setThemeMode(m); setModal(null); Haptics.selectionAsync(); }}
              style={[styles.modalRow, { borderColor: palette.border }]}
            >
              <Feather name={m === "light" ? "sun" : m === "dark" ? "moon" : "smartphone"} size={18} color={palette.onSurface} />
              <Text style={{ flex: 1, color: palette.onSurface, fontSize: 15 }}>{m.charAt(0).toUpperCase() + m.slice(1)}</Text>
              {themeMode === m && <Feather name="check" size={18} color={palette.brandPrimary} />}
            </Pressable>
          ))}
        </ModalSheet>
      )}

      {modal === "currency" && (
        <ModalSheet onClose={() => setModal(null)} palette={palette} title="Currency">
          <ScrollView style={{ maxHeight: 400 }}>
            {CURRENCIES.map((c) => (
              <Pressable
                key={c.code}
                testID={`currency-set-${c.code}`}
                onPress={() => { setCurrency(c.code); setModal(null); Haptics.selectionAsync(); }}
                style={[styles.modalRow, { borderColor: palette.border }]}
              >
                <Text style={{ width: 44, fontFamily: mono, color: palette.onSurface, fontSize: 16 }}>{c.symbol}</Text>
                <Text style={{ flex: 1, color: palette.onSurface, fontSize: 15 }}>{c.name}</Text>
                {currency === c.code && <Feather name="check" size={18} color={palette.brandPrimary} />}
              </Pressable>
            ))}
          </ScrollView>
        </ModalSheet>
      )}

      {(modal === "pin_set" || modal === "pin_confirm") && (
        <ModalSheet onClose={() => { setModal(null); setPin1(""); setPin2(""); setError(null); }} palette={palette} title={modal === "pin_set" ? "Set PIN" : "Confirm PIN"}>
          <View style={{ paddingVertical: spacing.lg }}>
            <PinPad
              value={modal === "pin_set" ? pin1 : pin2}
              onChange={(v) => { if (modal === "pin_set") setPin1(v); else setPin2(v); if (error) setError(null); }}
              onSubmit={(v) => { if (modal === "pin_set") { setModal("pin_confirm"); } else { handleSetPin(v); } }}
              error={error}
              testIDPrefix={modal === "pin_set" ? "set-pin" : "confirm-pin"}
            />
          </View>
        </ModalSheet>
      )}

      {modal === "clear_confirm" && (
        <ModalSheet onClose={() => setModal(null)} palette={palette} title="Clear all transactions?">
          <Text style={{ color: palette.muted, marginBottom: spacing.lg }}>
            This will permanently delete all transaction data. Categories and settings will be kept.
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Pressable testID="clear-cancel" onPress={() => setModal(null)} style={[styles.confirmBtn, { backgroundColor: palette.surfaceTertiary }]}>
              <Text style={{ color: palette.onSurface, fontWeight: "500" }}>Cancel</Text>
            </Pressable>
            <Pressable testID="clear-confirm" onPress={handleClearData} style={[styles.confirmBtn, { backgroundColor: palette.error }]}>
              <Text style={{ color: palette.onError, fontWeight: "500" }}>Delete All</Text>
            </Pressable>
          </View>
        </ModalSheet>
      )}

      {modal === "about" && (
        <ModalSheet onClose={() => setModal(null)} palette={palette} title="About Kharcha">
          <Text style={{ color: palette.onSurface, lineHeight: 20 }}>
            Kharcha is an AI-powered personal finance manager built for offline-first use. Track income, expenses, categorize spend, and analyse insights — all stored locally on your device.
          </Text>
          <Text style={{ color: palette.muted, marginTop: spacing.md, fontSize: 12, fontFamily: mono }}>Version 1.0.0 \u00B7 MVP</Text>
        </ModalSheet>
      )}

      {modal === "privacy" && (
        <ModalSheet onClose={() => setModal(null)} palette={palette} title="Privacy">
          <Text style={{ color: palette.onSurface, lineHeight: 20 }}>
            Your financial data never leaves your device. Kharcha stores all transactions in a local SQLite database, encrypted at rest by the OS. We do not collect, transmit, or share any personal information.
          </Text>
        </ModalSheet>
      )}
    </SafeAreaView>
  );
}

const Section: React.FC<{ title: string; palette: any; children: React.ReactNode }> = ({ title, palette, children }) => (
  <View style={{ marginTop: spacing.lg }}>
    <Text style={{ color: palette.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginLeft: spacing.sm, marginBottom: spacing.sm }}>{title}</Text>
    <View style={{ backgroundColor: palette.surfaceSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, overflow: "hidden" }}>
      {children}
    </View>
  </View>
);

const Row: React.FC<{
  palette: any; icon: keyof typeof Feather.glyphMap; label: string; value?: string;
  onPress?: () => void; testID?: string; action?: string; danger?: boolean; disabled?: boolean;
}> = ({ palette, icon, label, value, onPress, testID, danger, disabled }) => (
  <Pressable
    testID={testID}
    disabled={disabled || !onPress}
    onPress={onPress}
    style={({ pressed }) => [styles.row, { backgroundColor: pressed ? palette.surfaceTertiary : "transparent" }]}
  >
    <View style={[styles.iconBox, { backgroundColor: danger ? `${palette.error}22` : palette.surfaceTertiary }]}>
      <Feather name={icon} size={16} color={danger ? palette.error : palette.onSurface} />
    </View>
    <Text style={{ flex: 1, color: danger ? palette.error : palette.onSurface, fontSize: 14, fontWeight: "500" }}>{label}</Text>
    {value && <Text style={{ color: palette.muted, fontSize: 13, marginRight: spacing.xs }}>{value}</Text>}
    {onPress && !disabled && <Feather name="chevron-right" size={16} color={palette.muted} />}
  </Pressable>
);

const RowSwitch: React.FC<{
  palette: any; icon: keyof typeof Feather.glyphMap; label: string; value: boolean;
  onValueChange: (v: boolean) => void; disabled?: boolean; testID?: string;
}> = ({ palette, icon, label, value, onValueChange, disabled, testID }) => (
  <View style={[styles.row, { opacity: disabled ? 0.5 : 1 }]}>
    <View style={[styles.iconBox, { backgroundColor: palette.surfaceTertiary }]}>
      <Feather name={icon} size={16} color={palette.onSurface} />
    </View>
    <Text style={{ flex: 1, color: palette.onSurface, fontSize: 14, fontWeight: "500" }}>{label}</Text>
    <Switch testID={testID} value={value} onValueChange={onValueChange} disabled={disabled} thumbColor={value ? palette.brandPrimary : palette.surfaceInverse} trackColor={{ false: palette.surfaceTertiary, true: palette.brandTertiary }} />
  </View>
);

const ModalSheet: React.FC<{ onClose: () => void; palette: any; title: string; children: React.ReactNode }> = ({ onClose, palette, title, children }) => (
  <>
    <Pressable testID="modal-backdrop" style={styles.backdrop} onPress={onClose} />
    <View style={[styles.sheet, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
        <Text style={{ color: palette.onSurface, fontSize: 18, fontWeight: "500" }}>{title}</Text>
        <Pressable testID="modal-close" onPress={onClose} hitSlop={12}>
          <Feather name="x" size={20} color={palette.onSurface} />
        </Pressable>
      </View>
      {children}
    </View>
  </>
);

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  iconBox: { width: 32, height: 32, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, padding: spacing.xl, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, paddingBottom: spacing["2xl"] },
  modalRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  confirmBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: "center" },
});
