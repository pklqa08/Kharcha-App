export interface AppSettingValue {
  key: string;
  value: string | null;
}

export interface UserPreferences {
  themeMode: "light" | "dark" | "system";
  currency: string;
  onboarded: boolean;
  biometricEnabled: boolean;
  pinSet: boolean;
}
