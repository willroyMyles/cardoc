import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
        {/* Vehicle */}
        <Stack.Screen
          name="vehicle/add"
          options={{ title: "Add Vehicle", headerBackTitle: "Back" }}
        />
        <Stack.Screen
          name="vehicle/[id]"
          options={{ title: "Vehicle", headerBackTitle: "Back" }}
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
          name="ticket/add"
          options={{ title: "Add Ticket", headerBackTitle: "Back" }}
        />
        <Stack.Screen
          name="ticket/[id]"
          options={{ title: "Ticket", headerBackTitle: "Back" }}
        />
        <Stack.Screen
          name="ticket/lookup"
          options={{ title: "Ticket Lookup", headerBackTitle: "Back" }}
        />
        {/* Misc */}
        <Stack.Screen
          name="license"
          options={{ title: "Driver's License", headerBackTitle: "Back" }}
        />
        <Stack.Screen
          name="scan"
          options={{ presentation: "modal", title: "Scan Document" }}
        />
        <Stack.Screen
          name="scan-review"
          options={{ title: "Review Scan", headerBackTitle: "Back" }}
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
    </ThemeProvider>
  );
}
