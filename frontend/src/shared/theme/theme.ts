import { createContext, useContext } from "react";
import { Platform } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

export const LightPalette = {
  surface: "#FAFAFA",
  onSurface: "#111111",
  surfaceSecondary: "#F0F0F0",
  onSurfaceSecondary: "#222222",
  surfaceTertiary: "#E5E5E5",
  onSurfaceTertiary: "#333333",
  surfaceInverse: "#111111",
  onSurfaceInverse: "#FFFFFF",
  brand: "#FF5E00",
  brandPrimary: "#FF5E00",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#CC4B00",
  brandTertiary: "#FFF0E5",
  onBrandTertiary: "#FF5E00",
  success: "#00B359",
  onSuccess: "#FFFFFF",
  warning: "#FFC200",
  onWarning: "#111111",
  error: "#E60000",
  onError: "#FFFFFF",
  info: "#8C7366",
  border: "#E0E0E0",
  borderStrong: "#111111",
  divider: "#EEEEEE",
  muted: "#6B6B6B",
};

export const DarkPalette: typeof LightPalette = {
  surface: "#0A0A0A",
  onSurface: "#FDFDFD",
  surfaceSecondary: "#1A1A1A",
  onSurfaceSecondary: "#EAEAEA",
  surfaceTertiary: "#2A2A2A",
  onSurfaceTertiary: "#D4D4D4",
  surfaceInverse: "#FAFAFA",
  onSurfaceInverse: "#111111",
  brand: "#FF5E00",
  brandPrimary: "#FF5E00",
  onBrandPrimary: "#111111",
  brandSecondary: "#FF8533",
  brandTertiary: "#331600",
  onBrandTertiary: "#FF5E00",
  success: "#00E673",
  onSuccess: "#111111",
  warning: "#FFD633",
  onWarning: "#111111",
  error: "#FF3333",
  onError: "#111111",
  info: "#A69286",
  border: "#333333",
  borderStrong: "#FDFDFD",
  divider: "#222222",
  muted: "#8A8A8A",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };

export const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });
export const displayFont = Platform.select({ ios: "System", android: "sans-serif", default: "System" });

export type Palette = typeof LightPalette;

export interface ThemeCtx {
  mode: ThemeMode;
  isDark: boolean;
  palette: Palette;
  setMode: (m: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeCtx>({
  mode: "system",
  isDark: true,
  palette: DarkPalette,
  setMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);
