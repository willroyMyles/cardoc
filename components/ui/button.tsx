import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Spacing, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  icon?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  icon,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const backgroundColor = disabled
    ? c.border
    : isPrimary || isDanger
      ? isDanger
        ? "#EF4444"
        : c.tint
      : c.card;
  const foreground = isPrimary || isDanger ? "#fff" : c.text;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[size],
        {
          backgroundColor,
          borderColor: isPrimary || isDanger ? backgroundColor : c.border,
          opacity: disabled && !loading ? 0.7 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : (
        <>
          {icon ? (
            <IconSymbol name={icon as any} size={size === "sm" ? 14 : 16} color={foreground} />
          ) : null}
          <Text style={[styles.label, { color: foreground }]} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  sm: {
    minHeight: 36,
    paddingHorizontal: Spacing.page,
    paddingVertical: 8,
  },
  md: {
    minHeight: 48,
    paddingHorizontal: Spacing.page,
    paddingVertical: 12,
  },
  label: {
    ...Type.body,
    fontWeight: "700",
  },
});
