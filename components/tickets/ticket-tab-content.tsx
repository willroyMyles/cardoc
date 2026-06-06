import { SAVED_TICKET_FIELDS, TicketAggregator } from "@/components/tickets/ticket-aggregator";
import { TicketCard } from "@/components/tickets/ticket-card";
import { TicketDetailSheet } from "@/components/tickets/ticket-detail-sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Spacing, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ticket, TicketStatus } from "@/models";
import { useTicketsStore, useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const FILTERS: Array<{ key: TicketStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "paid", label: "Paid" },
  { key: "disputed", label: "Disputed" },
  { key: "dismissed", label: "Dismissed" },
];

function formatMoney(currency: string, amount: number): string {
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function TicketTabContent() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const tickets = useTicketsStore((s) => s.tickets);
  const deleteTicket = useTicketsStore((s) => s.deleteTicket);
  const getVehicle = useVehiclesStore((s) => s.getVehicle);
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const filtered =
    filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const selectedTicket =
    selectedTicketId ? tickets.find((ticket) => ticket.id === selectedTicketId) ?? null : null;

  const unpaidTotal = tickets
    .filter((t) => t.status === "unpaid")
    .reduce((sum, t) => sum + t.amount, 0);
  const unpaidCurrency =
    tickets.find((t) => t.status === "unpaid")?.currency ??
    tickets[0]?.currency ??
    "JMD";
  const getVehicleName = (ticket: Ticket) => {
    const vehicle = ticket.vehicleId ? getVehicle(ticket.vehicleId) : undefined;
    return vehicle
      ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      : undefined;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: c.subtext }]}>TICKETS</Text>
        <TouchableOpacity
          style={[styles.lookupBtn, { backgroundColor: c.text }]}
          onPress={() => router.push("/ticket/lookup")}
          activeOpacity={0.85}
        >
          <Text style={[styles.lookupBtnText, { color: c.background }]}>Lookup</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: c.background }]}>
            <IconSymbol name="ticket.fill" size={15} color={c.tint} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={[styles.summaryLabel, { color: c.subtext }]}>Saved Tickets</Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>{tickets.length}</Text>
          </View>
        </View>
        <View style={[styles.summarySep, { backgroundColor: c.border }]} />
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: "#FEF2F2" }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={15} color="#ef4444" />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={[styles.summaryLabel, { color: c.subtext }]}>Unpaid Balance</Text>
            <Text
              style={[styles.summaryValue, styles.summaryMoney, { color: c.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatMoney(unpaidCurrency, unpaidTotal)}
            </Text>
          </View>
        </View>
      </View>

      <TicketAggregator
        items={filtered}
        fields={SAVED_TICKET_FIELDS}
        getFieldValue={(ticket: Ticket, key) => {
          switch (key) {
            case "amount":
              return ticket.amount;
            case "status":
              return ticket.status;
            case "violation":
              return ticket.violation;
            case "date":
              return ticket.date;
            case "dueDate":
              return ticket.dueDate;
            case "demeritPoints":
              return ticket.demeritPoints;
            case "issuingAuthority":
              return ticket.issuingAuthority;
            case "region":
              return ticket.region;
            default:
              return null;
          }
        }}
        getDateValue={(ticket: Ticket) => ticket.date}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.chip,
              {
                backgroundColor: filter === f.key ? c.tint : c.card,
                borderColor: filter === f.key ? c.tint : c.border,
              },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.chipText,
                { color: filter === f.key ? "#fff" : c.subtext },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(ticket) => ticket.id}
        renderItem={({ item }) => {
          return (
            <TicketCard
              ticket={item}
              vehicleName={getVehicleName(item)}
              onPress={() => setSelectedTicketId(item.id)}
            />
          );
        }}
        contentContainerStyle={
          filtered.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={
          <EmptyState
            icon="exclamationmark.circle.fill"
            title="No tickets"
            subtitle="Use Lookup to find and save traffic fines"
          />
        }
      />

      <TicketDetailSheet
        ticket={selectedTicket}
        vehicleName={selectedTicket ? getVehicleName(selectedTicket) : undefined}
        visible={selectedTicket !== null}
        onClose={() => setSelectedTicketId(null)}
        onDelete={deleteTicket}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  lookupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  lookupBtnText: { fontSize: 13, fontWeight: "700" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.section,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionTitle: {
    ...Type.sectionLabel,
  },
  summaryCard: {
    flexDirection: "row",
    marginHorizontal: Spacing.section,
    marginBottom: 14,
    borderRadius: Radius.surface,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.tile,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  summaryCopy: { flex: 1, minWidth: 0, gap: 2 },
  summaryLabel: { fontSize: 11, fontWeight: "600" },
  summaryValue: { fontSize: 18, fontWeight: "800", letterSpacing: 0 },
  summaryMoney: { fontSize: 16 },
  summarySep: { width: 1, marginHorizontal: 12 },
  chipScroll: {
    flexGrow: 0,
    marginBottom: 8,
    overflow: "visible",
  },
  chipRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.page,
    gap: 8,
    paddingVertical: 5,
  },
  chip: {
    minWidth: 72,
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: "700", letterSpacing: 0 },
  list: { paddingTop: 10, paddingBottom: 100 },
  emptyList: { flex: 1 },
});
