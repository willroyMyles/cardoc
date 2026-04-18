import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? "light";
  const isDark = scheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[scheme].tint,
        tabBarInactiveTintColor: Colors[scheme].icon,
        tabBarStyle: {
          position: "absolute",
          bottom: 28,
          left: 24,
          right: 24,
          height: 64,
          borderRadius: 32,
          borderTopWidth: 0,
          backgroundColor: "transparent",
          elevation: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.4 : 0.12,
          shadowRadius: 24,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={isDark ? 60 : 70}
            tint={isDark ? "dark" : "light"}
            style={[StyleSheet.absoluteFill, styles.blurPill]}
            experimentalBlurMethod="dimezisBlurView"
          />
        ),
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        tabBarItemStyle: { paddingVertical: 8 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: "Tickets",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={26}
              name="exclamationmark.circle.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="ellipsis" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  blurPill: {
    borderRadius: 32,
    overflow: "hidden",
  },
});
