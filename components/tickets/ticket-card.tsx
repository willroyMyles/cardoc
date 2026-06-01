import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { AccentColor, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ticket, TICKET_STATUS_LABELS, TicketStatus } from "@/models";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const statusMap: Record<TicketStatus, StatusType> = {
  unpaid: "danger",
  paid: "success",
  disputed: "warning",
  dismissed: "neutral",
};

interface TicketCardProps {
  ticket: Ticket;
  vehicleName?: string;
}

export function TicketCard({ ticket, vehicleName }: TicketCardProps) {
  const scheme = useColorScheme() ?? "light";
  const badgeStatus = statusMap[ticket.status];

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: "/ticket/[id]", params: { id: ticket.id } })
      }
      activeOpacity={0.75}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconTile, { backgroundColor: "#1A1A1A" }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color={AccentColor} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.number, { color: Colors[scheme].subtext }]}>
              #{ticket.ticketNumber}
            </Text>
            <Text style={[styles.violation, { color: Colors[scheme].text }]}>
              {ticket.violation}
            </Text>
            {vehicleName ? (
              <Text style={[styles.sub, { color: Colors[scheme].subtext }]}>
                {vehicleName}
              </Text>
            ) : null}
          </View>
          <View style={styles.right}>
            <Text style={[styles.amount, { color: Colors[scheme].text }]}>
              {ticket.currency} {ticket.amount.toFixed(2)}
            </Text>
            <StatusBadge
              label={TICKET_STATUS_LABELS[ticket.status]}
              status={badgeStatus}
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: { flex: 1, gap: 2 },
  number: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.2 },
  violation: { fontSize: 14, fontWeight: "700" },
  sub: { fontSize: 11 },
  right: { alignItems: "flex-end", gap: 6 },
  amount: { fontSize: 15, fontWeight: "700" },
});
