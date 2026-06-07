import { type Href, router } from "expo-router";
import React, { type ReactNode } from "react";
import {
    StyleSheet,
    View,
    type ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  fallbackHref?: Href;
  right?: ReactNode;
  style?: ViewStyle;
}

export function Header({
  title,
  onBack,
  showBackButton = true,
  fallbackHref = "/(tabs)",
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

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  }

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: c.background, borderBottomColor: "transparent" },
        style,
      ]}
    >
      {showBackButton ? (
        <AnimatedPressable
          style={[styles.backButton, { backgroundColor: c.card }]}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          pressedScale={0.92}
        >
          <IconSymbol name="arrow.left" size={20} color={c.text} />
        </AnimatedPressable>
      ) : (
        <View style={styles.spacer} />
      )}

      <ThemedText
        type="subtitle"
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.title, { color: c.text }]}
      >
        {title}
      </ThemedText>

      {right ? (
        <View style={[styles.right, { backgroundColor: c.card }]}>{right}</View>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.page,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: {
    width: 40,
    height: 40,
  },
  right: {
    minWidth: 40,
    minHeight: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0,
    marginHorizontal: 8,
  },
});
