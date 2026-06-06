import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { configureGoogleSignIn } from "@/services/firebase/auth-service";
import { syncAllStores } from "@/services/firebase/sync-manager";
import { useAuthStore, useSettingsStore } from "@/store";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "react-native-get-random-values";
import "react-native-reanimated";

// Use the app's core sans font for every Text component by default.
const defaultTextStyle = { fontFamily: Fonts.sans };
const TextAny = Text as any;
if (TextAny.defaultProps == null) {
  TextAny.defaultProps = {};
}
TextAny.defaultProps = {
  ...TextAny.defaultProps,
  style: [defaultTextStyle, TextAny.defaultProps.style],
};

// Replace with your Firebase Web Client ID (from Firebase Console →
// Authentication → Sign-in method → Google → Web SDK configuration)
const GOOGLE_WEB_CLIENT_ID =
  "988380567626-6bi2i7c0h7dvv3gl022n0huorestkegc.apps.googleusercontent.com";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function Layout() {
  const colorScheme = useColorScheme();
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);
  const user = useAuthStore((s) => s.user);
  const syncMode = useSettingsStore((s) => s.syncMode);
  const hasSynced = useRef(false);

  useEffect(() => {
    configureGoogleSignIn(GOOGLE_WEB_CLIENT_ID);
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  // Auto-sync on startup once auth is ready and online mode is selected
  useEffect(() => {
    if (initialized && user && syncMode === "online" && !hasSynced.current) {
      hasSynced.current = true;
      syncAllStores().catch(() => {});
    }
  }, [initialized, user, syncMode]);
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <SafeAreaView style={{ flex: 1 }}>
            <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Vehicle */}
          <Stack.Screen
            name="vehicle/add"
            options={{
              title: "Add Vehicle",
              headerBackTitle: "Back",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="vehicle/[id]"
            options={{
              title: "Vehicle",
              headerBackTitle: "Back",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="vehicle/[id]/related"
            options={{
              title: "Vehicle",
              headerBackTitle: "Back",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="vehicle/edit/[id]"
            options={{ headerShown: false }}
          />
          {/* Document */}
          <Stack.Screen
            name="document/add"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="document/[id]"
            options={{ headerShown: false }}
          />
          {/* Ticket */}
          <Stack.Screen
            name="ticket/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ticket/lookup"
            options={{
              title: "Ticket Lookup",
              headerBackTitle: "Back",
              headerBackVisible: false,
              headerShown: false,
            }}
          />
          {/* Misc */}
          <Stack.Screen
            name="license"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="scan"
            options={{
              presentation: "modal",
              title: "Scan Document",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="scan-review"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="insurance-scan"
            options={{
              presentation: "modal",
              title: "Scan Insurance",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="insurance-review"
            options={{ title: "Review Insurance", headerShown: false }}
          />
          <Stack.Screen
            name="settings"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="emergency"
            options={{ presentation: "modal", headerShown: false }}
          />
          {/* Maintenance */}
          <Stack.Screen
            name="maintenance/index"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="maintenance/add"
            options={{ headerShown: false }}
          />
          {/* Fuel */}
          <Stack.Screen
            name="fuel/index"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="fuel/add"
            options={{ headerShown: false }}
          />
        </Stack>
        <StatusBar style="auto" />
          </SafeAreaView>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
