import { SAVED_TICKET_FIELDS, TicketAggregator } from "@/components/tickets/ticket-aggregator";
import { TicketCard } from "@/components/tickets/ticket-card";
import { TicketDetailSheet } from "@/components/tickets/ticket-detail-sheet";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Colors, Radius, Spacing, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ticket, TicketStatus } from "@/models";
import { haptics } from "@/services/haptics";
import { useTicketsStore, useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  FlatListProps,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const FILTERS: { key: TicketStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "paid", label: "Paid" },
  { key: "disputed", label: "Disputed" },
  { key: "dismissed", label: "Dismissed" },
];

interface TicketTabContentProps {
  onScroll?: FlatListProps<Ticket>["onScroll"];
  scrollEventThrottle?: FlatListProps<Ticket>["scrollEventThrottle"];
}

export function TicketTabContent({
  onScroll,
  scrollEventThrottle = 16,
}: TicketTabContentProps = {}) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const tickets = useTicketsStore((s) => s.tickets);
  const deleteTicket = useTicketsStore((s) => s.deleteTicket);
  const getVehicle = useVehiclesStore((s) => s.getVehicle);
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [showInsights, setShowInsights] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const filtered =
    filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const selectedTicket =
    selectedTicketId ? tickets.find((ticket) => ticket.id === selectedTicketId) ?? null : null;

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
        <View style={styles.headerActions}>
          <Button
            label="Insight"
            icon="chart.bar.fill"
            variant="secondary"
            size="sm"
            onPress={() => {
              void haptics.selection();
              setShowInsights(true);
            }}
          />
          <Button
            label="Lookup"
            icon="magnifyingglass"
            size="sm"
            onPress={() => {
              void haptics.selection();
              router.push("/ticket/lookup");
            }}
          />
        </View>
      </View>

      {/* <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}>
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
      </View> */}

      <TicketAggregator
        items={filtered}
        fields={SAVED_TICKET_FIELDS}
        expanded={showInsights}
        onExpandedChange={setShowInsights}
        showCollapsedControl={false}
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
          <AnimatedPressable
            key={f.key}
            style={[
              styles.chip,
              {
                backgroundColor: filter === f.key ? c.tint : c.card,
                borderColor: filter === f.key ? c.tint : c.border,
              },
            ]}
            onPress={() => {
              if (filter !== f.key) void haptics.selection();
              setFilter(f.key);
            }}
            pressedScale={0.95}
          >
            <Text
              style={[
                styles.chipText,
                { color: filter === f.key ? "#fff" : c.subtext },
              ]}
            >
              {f.label}
            </Text>
          </AnimatedPressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
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
            title={
              tickets.length === 0
                ? "No tickets saved"
                : `No ${filter} tickets`
            }
            subtitle={
              tickets.length === 0
                ? "Look up traffic fines and save any matches to keep payment status, due dates, and court details in one place."
                : "Try another filter or look up a ticket if you expected to see one here."
            }
            actionLabel="Look Up Ticket"
            onAction={() => router.push("/ticket/lookup")}
            secondaryActionLabel={tickets.length === 0 ? undefined : "Show All"}
            onSecondaryAction={
              tickets.length === 0 ? undefined : () => setFilter("all")
            }
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.section,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    ...Type.sectionLabel,
  },
  summaryCard: {
    flexDirection: "row",
    marginHorizontal: Spacing.section,
    marginBottom: 16,
    borderRadius: Radius.surface,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.tile,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  summaryCopy: { flex: 1, minWidth: 0, gap: 2 },
  summaryLabel: { fontSize: 11, fontWeight: "600" },
  summaryValue: { fontSize: 18, fontWeight: "800", letterSpacing: 0 },
  summaryMoney: { fontSize: 16 },
  summarySep: { width: 1, marginHorizontal: 16 },
  chipScroll: {
    flexGrow: 0,
    marginBottom: 8,
    overflow: "visible",
  },
  chipRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.page,
    gap: 8,
    paddingVertical: 8,
  },
  chip: {
    minWidth: 72,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: "700", letterSpacing: 0 },
  list: { paddingTop: 10, paddingBottom: 100 },
  emptyList: { flex: 1 },
});
