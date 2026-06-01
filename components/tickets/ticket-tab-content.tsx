import { SAVED_TICKET_FIELDS, TicketAggregator } from "@/components/tickets/ticket-aggregator";
import { TicketCard } from "@/components/tickets/ticket-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Header } from "@/components/ui/header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ticket, TicketStatus } from "@/models";
import { useTicketsStore, useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    FlatList,
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

function formatDate(raw: string | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw.split(" ")[0]);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TicketTabContent() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const tickets = useTicketsStore((s) => s.tickets);
  const getVehicle = useVehiclesStore((s) => s.getVehicle);
  const [filter, setFilter] = useState<TicketStatus | "all">("all");

  const filtered =
    filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  const unpaidTotal = tickets
    .filter((t) => t.status === "unpaid")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <View style={styles.container}>
      <Header
        title="Tickets"
        showBackButton={false}
        right={
          <TouchableOpacity
            style={[
              styles.lookupBtn,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
            onPress={() => router.push("/ticket/lookup")}
          >
            <IconSymbol name="magnifyingglass" size={16} color={c.tint} />
            <Text style={[styles.lookupBtnText, { color: c.tint }]}>Lookup</Text>
          </TouchableOpacity>
        }
      />

      {unpaidTotal > 0 ? (
        <View style={styles.balanceBanner}>
          <Text style={styles.balanceLabel}>Unpaid Balance</Text>
          <Text style={styles.balanceAmount}>
            {tickets.find((t) => t.status === "unpaid")?.currency ?? "JMD"}{" "}
            {unpaidTotal.toFixed(2)}
          </Text>
        </View>
      ) : null}

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

      <View style={styles.chipRow}>
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
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(ticket) => ticket.id}
        renderItem={({ item }) => {
          const vehicle = item.vehicleId ? getVehicle(item.vehicleId) : undefined;
          return (
            <TicketCard
              ticket={item}
              vehicleName={
                vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : undefined
              }
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  lookupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
  lookupBtnText: { fontSize: 13, fontWeight: "600" },
  balanceBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: { color: "#EF4444", fontWeight: "600", fontSize: 14 },
  balanceAmount: { color: "#EF4444", fontWeight: "700", fontSize: 18 },
  chipRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  list: { paddingTop: 8, paddingBottom: 100 },
  emptyList: { flex: 1 },
});
