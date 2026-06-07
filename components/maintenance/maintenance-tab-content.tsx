import { MaintenanceCard } from "@/components/maintenance/maintenance-card";
import { MaintenanceDetailSheet } from "@/components/maintenance/maintenance-detail-sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { MaintenanceEntry } from "@/models/maintenance";
import { useMaintenanceStore, useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

export function MaintenanceTabContent() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const entries = useMaintenanceStore((s) => s.entries);
  const deleteEntry = useMaintenanceStore((s) => s.deleteEntry);
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const [selectedEntry, setSelectedEntry] = useState<MaintenanceEntry | null>(null);

  const getVehicleName = (id: string) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.year} ${v.make} ${v.model}` : "Unknown Vehicle";
  };

  const totalCost = entries.reduce((sum, e) => sum + (e.cost ?? 0), 0);

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: c.subtext }]}>
          SERVICES LEDGER{entries.length > 0 ? ` (${entries.length})` : ""}
        </Text>
        <AnimatedPressable
          style={[styles.logBtn, { backgroundColor: c.text }]}
          onPress={() => router.push("/maintenance/add")}
          pressedScale={0.96}
        >
          <Text style={[styles.logBtnText, { color: c.background }]}>
            LOG RECORD
          </Text>
        </AnimatedPressable>
      </View>

      {/* Summary pill */}
      {entries.length > 0 && (
        <View style={[styles.summaryPill, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.summaryItem}>
            <IconSymbol name="wrench.and.screwdriver.fill" size={14} color="#f59e0b" />
            <Text style={[styles.summaryLabel, { color: c.subtext }]}>
              Total Services
            </Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {entries.length}
            </Text>
          </View>
          <View style={[styles.summarySep, { backgroundColor: c.border }]} />
          <View style={styles.summaryItem}>
            <IconSymbol name="dollarsign.circle" size={14} color="#f59e0b" />
            <Text style={[styles.summaryLabel, { color: c.subtext }]}>
              Total Spent
            </Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {entries[0]?.currency ?? "$"}{totalCost.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MaintenanceCard
            entry={item}
            vehicleName={getVehicleName(item.vehicleId)}
            onPress={() => setSelectedEntry(item)}
          />
        )}
        contentContainerStyle={
          entries.length === 0 ? styles.emptyList : styles.list
        }
        scrollEnabled={false}
        ListEmptyComponent={
          <EmptyState
            icon="wrench.and.screwdriver.fill"
            title="No Maintenance Records"
            subtitle="Log service work as it happens so costs, dates, and vehicle history stay searchable."
            actionLabel="Log Record"
            onAction={() => router.push("/maintenance/add")}
          />
        }
      />

      <MaintenanceDetailSheet
        entry={selectedEntry}
        vehicleName={selectedEntry ? getVehicleName(selectedEntry.vehicleId) : ""}
        visible={selectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
        onDelete={deleteEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  logBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logBtnText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  summaryPill: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryLabel: { fontSize: 12, flex: 1 },
  summaryValue: { fontSize: 13, fontWeight: "700" },
  summarySep: { width: 1 },
  list: { paddingHorizontal: 16, gap: 12, paddingBottom: 120 },
  emptyList: { paddingHorizontal: 16, paddingTop: 8 },
});
