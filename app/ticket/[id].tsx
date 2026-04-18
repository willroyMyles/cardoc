import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { StatusBadge } from "@/components/ui/status-badge";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { TICKET_STATUS_LABELS, TicketStatus } from "@/models";
import { useTicketsStore, useVehiclesStore } from "@/store";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const statusBadgeMap: Record<
  TicketStatus,
  "danger" | "success" | "warning" | "neutral"
> = {
  unpaid: "danger",
  paid: "success",
  disputed: "warning",
  dismissed: "neutral",
};

const STATUSES: TicketStatus[] = ["unpaid", "paid", "disputed", "dismissed"];

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const ticket = useTicketsStore((s) => s.getTicket(id));
  const updateTicket = useTicketsStore((s) => s.updateTicket);
  const deleteTicket = useTicketsStore((s) => s.deleteTicket);
  const getVehicle = useVehiclesStore((s) => s.getVehicle);
  const [showDelete, setShowDelete] = useState(false);

  if (!ticket) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.background }]}
      >
        <ThemedText>Ticket not found.</ThemedText>
      </SafeAreaView>
    );
  }

  const vehicle = ticket.vehicleId ? getVehicle(ticket.vehicleId) : undefined;

  function handleDelete() {
    deleteTicket(id);
    router.back();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.ticketNum, { color: c.subtext }]}>
                #{ticket.ticketNumber}
              </Text>
              <Text style={[styles.violation, { color: c.text }]}>
                {ticket.violation}
              </Text>
            </View>
            <StatusBadge
              label={TICKET_STATUS_LABELS[ticket.status]}
              status={statusBadgeMap[ticket.status]}
            />
          </View>

          <Text style={[styles.amount, { color: c.text }]}>
            {ticket.currency} {ticket.amount.toFixed(2)}
          </Text>

          {vehicle ? (
            <View style={styles.row}>
              <Text style={[styles.fieldLabel, { color: c.subtext }]}>
                Vehicle
              </Text>
              <Text style={[styles.fieldValue, { color: c.text }]}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
            </View>
          ) : null}

          {ticket.issuingAuthority ? (
            <View style={styles.row}>
              <Text style={[styles.fieldLabel, { color: c.subtext }]}>
                Authority
              </Text>
              <Text style={[styles.fieldValue, { color: c.text }]}>
                {ticket.issuingAuthority}
              </Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <Text style={[styles.fieldLabel, { color: c.subtext }]}>Date</Text>
            <Text style={[styles.fieldValue, { color: c.text }]}>
              {new Date(ticket.date).toLocaleDateString()}
            </Text>
          </View>

          {ticket.dueDate ? (
            <View style={styles.row}>
              <Text style={[styles.fieldLabel, { color: c.subtext }]}>Due</Text>
              <Text style={[styles.fieldValue, { color: c.text }]}>
                {new Date(ticket.dueDate).toLocaleDateString()}
              </Text>
            </View>
          ) : null}

          {ticket.region ? (
            <View style={styles.row}>
              <Text style={[styles.fieldLabel, { color: c.subtext }]}>
                Region
              </Text>
              <Text style={[styles.fieldValue, { color: c.text }]}>
                {ticket.region}
              </Text>
            </View>
          ) : null}

          {ticket.notes ? (
            <Text style={[styles.notes, { color: c.subtext }]}>
              {ticket.notes}
            </Text>
          ) : null}
        </Card>

        {/* Update status */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>
          Update Status
        </Text>
        <View style={styles.chipRow}>
          {STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.chip,
                {
                  backgroundColor: ticket.status === s ? c.tint : c.card,
                  borderColor: ticket.status === s ? c.tint : c.border,
                },
              ]}
              onPress={() => updateTicket(id, { status: s })}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: ticket.status === s ? "#fff" : c.text },
                ]}
              >
                {TICKET_STATUS_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => setShowDelete(true)}
        >
          <IconSymbol name="trash.fill" size={16} color="#fff" />
          <Text style={styles.deleteBtnText}>Delete Ticket</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmDialog
        visible={showDelete}
        title="Delete Ticket"
        message="Permanently delete this ticket?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 8, paddingBottom: 40 },
  card: { gap: 8 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ticketNum: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  violation: { fontSize: 18, fontWeight: "700", marginTop: 2 },
  amount: { fontSize: 28, fontWeight: "800" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(128,128,128,0.15)",
  },
  fieldLabel: { fontSize: 13 },
  fieldValue: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
  },
  notes: { fontSize: 13, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginTop: 8 },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    marginTop: 8,
  },
  deleteBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
