import { Card } from "@/components/ui/card";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { Colors } from "@/constants/theme";
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
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  info: { flex: 1, gap: 2 },
  number: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  violation: { fontSize: 15, fontWeight: "600" },
  sub: { fontSize: 13 },
  right: { alignItems: "flex-end", gap: 6 },
  amount: { fontSize: 16, fontWeight: "700" },
});
