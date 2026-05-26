import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { configureGoogleSignIn } from "@/services/firebase/auth-service";
import { syncAllStores } from "@/services/firebase/sync-manager";
import { useAuthStore, useSettingsStore } from "@/store";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

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
      <SafeAreaView style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
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
            options={{ title: "Edit Vehicle", headerBackTitle: "Back" }}
          />
          {/* Document */}
          <Stack.Screen
            name="document/add"
            options={{ title: "Add Document", headerBackTitle: "Back" }}
          />
          <Stack.Screen
            name="document/[id]"
            options={{ title: "Document", headerBackTitle: "Back" }}
          />
          {/* Ticket */}
          <Stack.Screen
            name="ticket/[id]"
            options={{ title: "Ticket", headerBackTitle: "Back" }}
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
            options={{
              title: "Driver's License",
              headerBackTitle: "Back",
            }}
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
            options={{ title: "Review Scan", headerBackTitle: "Back" }}
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
            options={{ title: "Settings", headerBackTitle: "Back" }}
          />
          <Stack.Screen
            name="emergency"
            options={{ presentation: "modal", title: "Emergency Card" }}
          />
          {/* Maintenance */}
          <Stack.Screen
            name="maintenance/index"
            options={{ title: "Maintenance Log", headerBackTitle: "Back" }}
          />
          <Stack.Screen
            name="maintenance/add"
            options={{ title: "Add Service Entry", headerBackTitle: "Back" }}
          />
          {/* Fuel */}
          <Stack.Screen
            name="fuel/index"
            options={{ title: "Fuel Log", headerBackTitle: "Back" }}
          />
          <Stack.Screen
            name="fuel/add"
            options={{ title: "Add Fuel Entry", headerBackTitle: "Back" }}
          />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaView>
    </ThemeProvider>
  );
}
