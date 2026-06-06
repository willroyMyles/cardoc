import { AccentColor, Colors, Radius, Spacing, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "./icon-symbol";

interface ScanPromptCardProps {
  header?: string;
  subtitle?: string;
}

export function ScanPromptCard({
  header = "Documents",
  subtitle = "Upload or photograph a vehicle document to get started.",
}: ScanPromptCardProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: c.card, borderColor: c.border },
      ]}
    >
      <Text style={[styles.header, { color: c.subtext }]}>{header}</Text>

      <View style={styles.iconTile}>
        <IconSymbol name="camera.fill" size={22} color={AccentColor} />
      </View>

      <Text style={[styles.title, { color: c.text }]}>
        Scan a document to begin
      </Text>

      <Text style={[styles.subtitle, { color: c.subtext }]}>{subtitle}</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: c.tint }]}
        onPress={() => router.push("/scan")}
        activeOpacity={0.85}
      >
        <IconSymbol name="doc.text.viewfinder" size={14} color={AccentColor} />
        <Text style={styles.buttonText}>SCAN NOW</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 24,
    alignItems: "center",
    gap: 10,
    marginHorizontal: Spacing.page,
    marginVertical: 8,
  },
  header: {
    ...Type.label,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: Radius.tileLg,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 220,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    marginTop: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});
