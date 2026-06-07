import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Colors, Spacing, StatusColors, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ticket, TICKET_STATUS_LABELS, TicketStatus } from "@/models";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const statusMap: Record<TicketStatus, StatusType> = {
  unpaid: "danger",
  paid: "success",
  disputed: "warning",
  dismissed: "neutral",
};

const accentMap: Record<TicketStatus, string> = {
  unpaid: StatusColors.danger,
  paid: StatusColors.success,
  disputed: StatusColors.warning,
  dismissed: StatusColors.neutral,
};

interface TicketCardProps {
  ticket: Ticket;
  vehicleName?: string;
  onPress?: () => void;
}

export function TicketCard({ ticket, vehicleName, onPress }: TicketCardProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const badgeStatus = statusMap[ticket.status];
  const issuedDate = new Date(ticket.date.split(" ")[0]);
  const dateLabel = isNaN(issuedDate.getTime())
    ? ticket.date
    : issuedDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  return (
    <AnimatedPressable
      onPress={
        onPress ??
        (() =>
          router.push({ pathname: "/ticket/[id]", params: { id: ticket.id } }))
      }
      style={[
        styles.card,
        { backgroundColor: c.card, borderColor: c.border },
      ]}
    >
      <View
        style={[
          styles.statusRail,
          { backgroundColor: accentMap[ticket.status] },
        ]}
      />
      <View style={styles.topRow}>
        <Text style={[styles.number, { color: c.subtext }]} numberOfLines={1}>
          #{ticket.ticketNumber}
        </Text>
        <StatusBadge
          label={TICKET_STATUS_LABELS[ticket.status]}
          status={badgeStatus}
        />
      </View>

      <View style={styles.mainRow}>
        <View style={styles.info}>
          <Text style={[styles.violation, { color: c.text }]} numberOfLines={2}>
            {ticket.violation}
          </Text>
        </View>
        <Text
          style={[styles.amount, { color: c.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {ticket.currency} {ticket.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </View>

      <Text style={[styles.sub, { color: c.subtext }]} numberOfLines={1}>
        {vehicleName ? `${vehicleName} / ${dateLabel}` : dateLabel}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.page,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "hidden",
  },
  statusRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 5,
  },
  mainRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  info: { flex: 1, gap: 2, minWidth: 0 },
  number: {
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  violation: { fontSize: 13, lineHeight: 17, fontWeight: "700" },
  sub: Type.caption,
  amount: {
    maxWidth: 106,
    minWidth: 66,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
  },
});
