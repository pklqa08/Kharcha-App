import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { LogBox, View, ActivityIndicator, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import { useIconFonts } from "@/src/application/hooks/use-icon-fonts";
import { AppProviders, useSettings } from "@/src/application/providers/AppProviders";
import { useTheme } from "@/src/shared/theme/theme";
import { getDb } from "@/src/infrastructure/database/db";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, onboarded, pinSet } = useSettings();
  const { palette } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!ready) return;
    const first = segments[0] as string | undefined;

    if (!onboarded) {
      if (first !== "onboarding") router.replace("/onboarding");
      return;
    }
    // onboarded but pin is set and we are not on lock yet -> lock
    if (pinSet && first !== "lock" && first !== "onboarding") {
      // Only redirect on cold start (very first render post-ready)
      // We'll rely on lock being explicit entry
    }
  }, [ready, onboarded, pinSet, segments, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.surface }}>
        <ActivityIndicator color={palette.brandPrimary} />
      </View>
    );
  }
  return <>{children}</>;
}

function ThemedRoot() {
  const { isDark, palette } = useTheme();
  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={palette.surface} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.surface },
          animation: "fade",
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const [dbReady, setDbReady] = React.useState(false);

  useEffect(() => {
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
    Promise.race([getDb().catch(() => null), timeout]).finally(() => setDbReady(true));
  }, []);

  useEffect(() => {
    if ((loaded || error) && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, dbReady]);

  if ((!loaded && !error) || !dbReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders>
          <BottomSheetModalProvider>
            <AuthGate>
              <ThemedRoot />
            </AuthGate>
          </BottomSheetModalProvider>
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
