import { AccentColor, Colors, Radius, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from "react-native";
import { IconSymbol } from "./icon-symbol";

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: (event: GestureResponderEvent) => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: (event: GestureResponderEvent) => void;
}

export function EmptyState({
  icon = "doc.fill",
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  return (
    <View style={styles.container}>
      <View style={[styles.iconTile, { backgroundColor: c.text }]}>
        <IconSymbol name={icon as any} size={28} color={AccentColor} />
      </View>
      <Text style={[styles.title, { color: c.text }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: c.subtext }]}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: c.text }]}
          onPress={onAction}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={[styles.actionText, { color: c.background }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
      {secondaryActionLabel && onSecondaryAction ? (
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: c.border }]}
          onPress={onSecondaryAction}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={[styles.secondaryText, { color: c.text }]}>
            {secondaryActionLabel}
          </Text>
        </TouchableOpacity>
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
    borderRadius: Radius.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    ...Type.title,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtitle: {
    ...Type.body,
    textAlign: "center",
    maxWidth: 280,
  },
  actionButton: {
    marginTop: 8,
    minWidth: 148,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  actionText: {
    ...Type.body,
    fontWeight: "700",
  },
  secondaryButton: {
    minWidth: 148,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondaryText: {
    ...Type.body,
    fontWeight: "700",
  },
});
