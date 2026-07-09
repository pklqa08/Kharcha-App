import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSettings } from "@/src/application/providers/AppProviders";
import { useTheme } from "@/src/shared/theme/theme";

export default function Index() {
  const { ready, onboarded, pinSet } = useSettings();
  const { palette } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    // During development we keep onboarding first for easier flow verification.
    if (__DEV__ || !onboarded) {
      router.replace("/onboarding");
    } else if (pinSet) {
      router.replace("/lock");
    } else {
      router.replace("/(tabs)");
    }
  }, [ready, onboarded, pinSet, router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.surface }} testID="splash-screen">
      <ActivityIndicator color={palette.brandPrimary} />
    </View>
  );
}
