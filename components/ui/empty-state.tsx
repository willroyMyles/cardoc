import { AccentColor, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { IconSymbol } from "./icon-symbol";

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({
  icon = "doc.fill",
  title,
  subtitle,
}: EmptyStateProps) {
  const scheme = useColorScheme() ?? "light";
  return (
    <View style={styles.container}>
      <View style={styles.iconTile}>
        <IconSymbol name={icon as any} size={28} color={AccentColor} />
      </View>
      <Text style={[styles.title, { color: Colors[scheme].text }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: Colors[scheme].subtext }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});
