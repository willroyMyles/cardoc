import { ThemedText } from "@/components/themed-text";
import { TicketCard } from "@/components/tickets/ticket-card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { TicketStatus } from "@/models";
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

const FILTERS: Array<{ key: TicketStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "paid", label: "Paid" },
  { key: "disputed", label: "Disputed" },
  { key: "dismissed", label: "Dismissed" },
];

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
      <View style={styles.header}>
        <ThemedText type="title">Tickets</ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.lookupBtn,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
            onPress={() => router.push("/ticket/lookup")}
          >
            <IconSymbol name="magnifyingglass" size={16} color={c.tint} />
            <Text style={[styles.lookupBtnText, { color: c.tint }]}>
              Lookup
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: c.tint }]}
            onPress={() => router.push("/ticket/add")}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Outstanding balance */}
      {unpaidTotal > 0 ? (
        <View style={styles.balanceBanner}>
          <Text style={styles.balanceLabel}>Unpaid Balance</Text>
          <Text style={styles.balanceAmount}>
            {tickets.find((t) => t.status === "unpaid")?.currency ?? "USD"}{" "}
            {unpaidTotal.toFixed(2)}
          </Text>
        </View>
      ) : null}

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

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => {
          const v = item.vehicleId ? getVehicle(item.vehicleId) : undefined;
          return (
            <TicketCard
              ticket={item}
              vehicleName={v ? `${v.year} ${v.make} ${v.model}` : undefined}
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
            subtitle="No traffic fines here"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: 8,
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
});
