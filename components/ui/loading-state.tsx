import { Colors, Radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

interface ButtonLoadingContentProps {
  loading: boolean;
  loadingLabel?: string;
  label: string;
  color?: string;
  children?: React.ReactNode;
}

export function ButtonLoadingContent({
  loading,
  loadingLabel,
  label,
  color = "#fff",
  children,
}: ButtonLoadingContentProps) {
  if (loading) {
    return (
      <>
        <ActivityIndicator color={color} size="small" />
        <Text style={[styles.buttonLabel, { color }]}>
          {loadingLabel ?? label}
        </Text>
      </>
    );
  }

  return children ? (
    <>{children}</>
  ) : (
    <Text style={[styles.buttonLabel, { color }]}>{label}</Text>
  );
}

interface SkeletonBlockProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBlock({
  width = "100%",
  height = 14,
  radius = Radius.sm,
  style,
}: SkeletonBlockProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: c.border,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  buttonLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  skeleton: {
    opacity: 0.72,
  },
});
