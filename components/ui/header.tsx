import { router } from "expo-router";
import React, { type ReactNode } from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View,
    type ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  right?: ReactNode;
  style?: ViewStyle;
}

export function Header({
  title,
  onBack,
  showBackButton = true,
  right,
  style,
}: HeaderProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }

    router.back();
  }

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: c.card, borderBottomColor: c.border },
        style,
      ]}
    >
      {showBackButton ? (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <IconSymbol name="arrow.left" size={20} color={c.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      <ThemedText type="subtitle" style={[styles.title, { color: c.text }]}> 
        {title}
      </ThemedText>

      {right ? <View style={styles.right}>{right}</View> : <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: {
    width: 40,
    height: 40,
  },
  right: {
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "300",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});
