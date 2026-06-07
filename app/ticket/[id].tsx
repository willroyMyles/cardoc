import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Header } from "@/components/ui/header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Colors, Radius, Spacing, Type } from "@/constants/theme";
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
  View,
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

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const ticket = useTicketsStore((s) => s.getTicket(id));
  const deleteTicket = useTicketsStore((s) => s.deleteTicket);
  const getVehicle = useVehiclesStore((s) => s.getVehicle);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    setDeleting(true);
    try {
      deleteTicket(id);
      router.back();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <Header title={`#${ticket.ticketNumber}`} onBack={() => router.back()} />
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
        loadingLabel="Deleting"
        loading={deleting}
        destructive
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setShowDelete(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.page, gap: 8, paddingBottom: 40 },
  card: { gap: 8 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ticketNum: Type.sectionLabel,
  violation: { ...Type.title, marginTop: 2 },
  amount: { fontSize: 28, fontWeight: "800" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(128,128,128,0.15)",
  },
  fieldLabel: Type.body,
  fieldValue: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
  },
  notes: { ...Type.body, marginTop: 4 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.pill,
    backgroundColor: "#EF4444",
    marginTop: 8,
  },
  deleteBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
