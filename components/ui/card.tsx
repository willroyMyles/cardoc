import { Colors, Radius, Shadows, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

export function Card({ children, style, padding = Spacing.cardPadding }: CardProps) {
  const scheme = useColorScheme() ?? "light";
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: Colors[scheme].card,
          borderColor: Colors[scheme].border,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    ...Shadows.card,
  },
});
