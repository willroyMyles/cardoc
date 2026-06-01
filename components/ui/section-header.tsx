import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  const scheme = useColorScheme() ?? "light";
  return (
    <View
      style={[styles.container, { backgroundColor: Colors[scheme].background }]}
    >
      <Text style={[styles.title, { color: Colors[scheme].subtext }]}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
  },
});
