import {
    SAVED_TICKET_FIELDS,
    TicketAggregator,
} from "@/components/tickets/ticket-aggregator";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { StatusBadge } from "@/components/ui/status-badge";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ticket, TICKET_STATUS_LABELS, TicketStatus } from "@/models";
import { useTicketsStore, useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

const STATUS_BADGE_MAP: Record<
  TicketStatus,
  "danger" | "success" | "warning" | "neutral"
> = {
  unpaid: "danger",
  paid: "success",
  disputed: "warning",
  dismissed: "neutral",
};

const FILTERS: Array<{ key: TicketStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "paid", label: "Paid" },
  { key: "disputed", label: "Disputed" },
  { key: "dismissed", label: "Dismissed" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Saved Ticket Card ────────────────────────────────────────────────────────

interface SavedTicketCardProps {
  ticket: Ticket;
  vehicleName?: string;
  c: (typeof Colors)["light"];
}

function SavedTicketCard({ ticket, vehicleName, c }: SavedTicketCardProps) {
  const badgeStatus = STATUS_BADGE_MAP[ticket.status];
  return (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: "/ticket/[id]", params: { id: ticket.id } })
      }
      activeOpacity={0.75}
      style={styles.cardWrapper}
    >
      <Card style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={[styles.ticketNo, { color: c.subtext }]}>
            #{ticket.ticketNumber}
          </Text>
          <StatusBadge
            label={TICKET_STATUS_LABELS[ticket.status]}
            status={badgeStatus}
          />
        </View>
        <Text style={[styles.offence, { color: c.text }]}>
          {ticket.violation}
        </Text>
        <View style={styles.resultMeta}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: c.subtext }]}>Fine</Text>
            <Text style={[styles.metaValue, { color: c.text }]}>
              {ticket.currency} {ticket.amount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: c.subtext }]}>Issued</Text>
            <Text style={[styles.metaValue, { color: c.text }]}>
              {formatDate(ticket.date)}
            </Text>
          </View>
          {ticket.dueDate ? (
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: c.subtext }]}>Due</Text>
              <Text style={[styles.metaValue, { color: c.text }]}>
                {formatDate(ticket.dueDate)}
              </Text>
            </View>
          ) : null}
          {ticket.demeritPoints ? (
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: c.subtext }]}>
                Demerit pts
              </Text>
              <Text style={[styles.metaValue, { color: c.text }]}>
                {ticket.demeritPoints}
              </Text>
            </View>
          ) : null}
        </View>
        {vehicleName ? (
          <Text style={[styles.courtInfo, { color: c.subtext }]}>
            Vehicle: {vehicleName}
          </Text>
        ) : null}
        {ticket.issuingAuthority ? (
          <Text style={[styles.courtInfo, { color: c.subtext }]}>
            {ticket.issuingAuthority}
          </Text>
        ) : null}
      </Card>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TicketsTab() {
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
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol name="xmark" size={22} color={c.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>
          Saved Tickets
        </Text>
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
      </View>

      {/* Outstanding balance banner */}
      {unpaidTotal > 0 ? (
        <View style={styles.balanceBanner}>
          <Text style={styles.balanceLabel}>Unpaid Balance</Text>
          <Text style={styles.balanceAmount}>
            {tickets.find((t) => t.status === "unpaid")?.currency ?? "JMD"}{" "}
            {unpaidTotal.toFixed(2)}
          </Text>
        </View>
      ) : null}

      {/* Aggregator */}
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

      {/* Filter chips */}
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

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => {
          const v = item.vehicleId ? getVehicle(item.vehicleId) : undefined;
          return (
            <SavedTicketCard
              ticket={item}
              vehicleName={v ? `${v.year} ${v.make} ${v.model}` : undefined}
              c={c}
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
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  lookupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  lookupBtnText: { fontSize: 13, fontWeight: "600" },

  balanceBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: "600" },

  list: { paddingBottom: 24 },
  emptyList: { flex: 1 },

  cardWrapper: { marginHorizontal: 16, marginBottom: 12 },
  resultCard: { marginHorizontal: 0 },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  ticketNo: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  offence: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 10,
  },
  resultMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  metaItem: { gap: 2 },
  metaLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  metaValue: { fontSize: 13, fontWeight: "600" },
  courtInfo: { fontSize: 12, marginTop: 2 },
});
