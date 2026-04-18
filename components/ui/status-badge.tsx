import { StatusColors } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type StatusType = "danger" | "warning" | "success" | "info" | "neutral";

interface StatusBadgeProps {
  label: string;
  status: StatusType;
}

const statusMap: Record<StatusType, { bg: string; text: string }> = {
  danger: { bg: StatusColors.dangerBg, text: StatusColors.danger },
  warning: { bg: StatusColors.warningBg, text: StatusColors.warning },
  success: { bg: StatusColors.successBg, text: StatusColors.success },
  info: { bg: StatusColors.infoBg, text: StatusColors.info },
  neutral: { bg: StatusColors.neutralBg, text: StatusColors.neutral },
};

export function StatusBadge({ label, status }: StatusBadgeProps) {
  const { bg, text } = statusMap[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
