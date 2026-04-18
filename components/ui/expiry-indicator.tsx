import { StatusColors } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { IconSymbol } from "./icon-symbol";

interface ExpiryIndicatorProps {
  expiryDate: string;
}

function getDaysRemaining(expiryDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function ExpiryIndicator({ expiryDate }: ExpiryIndicatorProps) {
  const days = getDaysRemaining(expiryDate);

  let color: string;
  let bgColor: string;
  let label: string;

  if (days < 0) {
    color = StatusColors.danger;
    bgColor = StatusColors.dangerBg;
    label = `Expired ${Math.abs(days)}d ago`;
  } else if (days <= 7) {
    color = StatusColors.danger;
    bgColor = StatusColors.dangerBg;
    label = days === 0 ? "Expires today" : `${days}d left`;
  } else if (days <= 30) {
    color = StatusColors.warning;
    bgColor = StatusColors.warningBg;
    label = `${days}d left`;
  } else {
    color = StatusColors.success;
    bgColor = StatusColors.successBg;
    label = `${days}d left`;
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <IconSymbol name="calendar" size={12} color={color} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
  },
});
