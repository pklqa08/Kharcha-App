import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Appearance } from "react-native";
import { ThemeContext, ThemeMode, LightPalette, DarkPalette, Palette } from "../core/theme";
import { settingsRepo } from "../data/repos";

const SETTINGS_KEYS = {
  themeMode: "theme_mode",
  currency: "currency",
  pinHash: "pin_hash",
  biometric: "biometric_enabled",
  onboarded: "onboarded",
};

interface AppSettings {
  ready: boolean;
  themeMode: ThemeMode;
  currency: string;
  onboarded: boolean;
  pinSet: boolean;
  biometricEnabled: boolean;
  setThemeMode: (m: ThemeMode) => Promise<void>;
  setCurrency: (c: string) => Promise<void>;
  setBiometricEnabled: (v: boolean) => Promise<void>;
  markOnboarded: () => Promise<void>;
  refresh: () => Promise<void>;
}

const defaultCtx: AppSettings = {
  ready: false,
  themeMode: "system",
  currency: "INR",
  onboarded: false,
  pinSet: false,
  biometricEnabled: false,
  setThemeMode: async () => {},
  setCurrency: async () => {},
  setBiometricEnabled: async () => {},
  markOnboarded: async () => {},
  refresh: async () => {},
};

const SettingsContext = createContext<AppSettings>(defaultCtx);
export const useSettings = () => useContext(SettingsContext);

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [currency, setCurrencyState] = useState<string>("INR");
  const [onboarded, setOnboarded] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [systemScheme, setSystemScheme] = useState<"light" | "dark">(Appearance.getColorScheme() === "light" ? "light" : "dark");

  const loadAll = useCallback(async () => {
    try {
      const [tm, cur, ob, pin, bio] = await Promise.all([
        settingsRepo.get(SETTINGS_KEYS.themeMode),
        settingsRepo.get(SETTINGS_KEYS.currency),
        settingsRepo.get(SETTINGS_KEYS.onboarded),
        settingsRepo.get(SETTINGS_KEYS.pinHash),
        settingsRepo.get(SETTINGS_KEYS.biometric),
      ]);
      setThemeModeState((tm as ThemeMode) ?? "system");
      setCurrencyState(cur ?? "INR");
      setOnboarded(ob === "1");
      setPinSet(!!pin);
      setBiometricEnabledState(bio === "1");
    } catch (e) {
      // storage not available (e.g. web preview) - fall through with defaults
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === "light" ? "light" : "dark");
    });
    return () => sub.remove();
  }, [loadAll]);

  const setThemeMode = async (m: ThemeMode) => {
    await settingsRepo.set(SETTINGS_KEYS.themeMode, m);
    setThemeModeState(m);
  };
  const setCurrency = async (c: string) => {
    await settingsRepo.set(SETTINGS_KEYS.currency, c);
    setCurrencyState(c);
  };
  const setBiometricEnabled = async (v: boolean) => {
    await settingsRepo.set(SETTINGS_KEYS.biometric, v ? "1" : "0");
    setBiometricEnabledState(v);
  };
  const markOnboarded = async () => {
    await settingsRepo.set(SETTINGS_KEYS.onboarded, "1");
    setOnboarded(true);
  };

  const isDark = themeMode === "system" ? systemScheme === "dark" : themeMode === "dark";
  const palette: Palette = isDark ? DarkPalette : LightPalette;

  return (
    <SettingsContext.Provider
      value={{
        ready,
        themeMode,
        currency,
        onboarded,
        pinSet,
        biometricEnabled,
        setThemeMode,
        setCurrency,
        setBiometricEnabled,
        markOnboarded,
        refresh: loadAll,
      }}
    >
      <ThemeContext.Provider value={{ mode: themeMode, isDark, palette, setMode: setThemeMode }}>
        {children}
      </ThemeContext.Provider>
    </SettingsContext.Provider>
  );
};

export { SETTINGS_KEYS };
