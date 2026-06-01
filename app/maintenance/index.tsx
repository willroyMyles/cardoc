import { MaintenanceCard } from "@/components/maintenance/maintenance-card";
import { MaintenanceDetailSheet } from "@/components/maintenance/maintenance-detail-sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { Header } from "@/components/ui/header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { MaintenanceEntry } from "@/models/maintenance";
import { useMaintenanceStore, useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

export default function MaintenanceListScreen() {
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

  const renderItem = ({ item }: { item: MaintenanceEntry }) => (
    <MaintenanceCard
      entry={item}
      vehicleName={getVehicleName(item.vehicleId)}
      onPress={() => setSelectedEntry(item)}
    />
  );

  return (
    <SafeAreaView
      style={[styles.container, { flex: 1, backgroundColor: c.background }]}
    >
      <Header
        title={`Services Ledger${entries.length > 0 ? ` (${entries.length})` : ""}`}
        onBack={() => router.back()}
        right={
          <TouchableOpacity
            style={[styles.logBtn, { backgroundColor: c.text }]}
            onPress={() => router.push("/maintenance/add")}
            activeOpacity={0.85}
          >
            <Text style={[styles.logBtnText, { color: c.background }]}>Log Record</Text>
          </TouchableOpacity>
        }
      />
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          entries.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={
          <EmptyState
            icon="wrench.and.screwdriver.fill"
            title="No Maintenance Records"
            subtitle="Track your service history by tapping Log Record"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  emptyList: { flex: 1, padding: 16 },
  logBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
