import { StatusColors } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type StatusType = "danger" | "warning" | "success" | "info" | "neutral";

interface StatusBadgeProps {
  label: string;
  status: StatusType;
}

const statusMap: Record<StatusType, { bg: string; text: string; border: string }> = {
  danger: { bg: StatusColors.dangerBg, text: StatusColors.danger, border: StatusColors.danger + "33" },
  warning: { bg: StatusColors.warningBg, text: StatusColors.warning, border: StatusColors.warning + "33" },
  success: { bg: StatusColors.successBg, text: StatusColors.success, border: StatusColors.success + "33" },
  info: { bg: StatusColors.infoBg, text: StatusColors.info, border: StatusColors.info + "33" },
  neutral: { bg: StatusColors.neutralBg, text: StatusColors.neutral, border: StatusColors.neutral + "33" },
};

export function StatusBadge({ label, status }: StatusBadgeProps) {
  const { bg, text, border } = statusMap[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.label, { color: text }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
});
