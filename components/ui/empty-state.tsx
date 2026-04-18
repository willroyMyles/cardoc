import { Colors } from "@/constants/theme";
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
      <IconSymbol name={icon as any} size={48} color={Colors[scheme].icon} />
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
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
