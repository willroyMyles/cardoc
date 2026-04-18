import { EmptyState } from "@/components/ui/empty-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    MAINTENANCE_TYPE_LABELS,
    type MaintenanceEntry,
} from "@/models/maintenance";
import { useMaintenanceStore, useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function MaintenanceListScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const entries = useMaintenanceStore((s) => s.entries);
  const vehicles = useVehiclesStore((s) => s.vehicles);

  const getVehicleName = (id: string) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.year} ${v.make} ${v.model}` : "Unknown Vehicle";
  };

  const renderItem = ({ item }: { item: MaintenanceEntry }) => (
    <View
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: c.tint + "18" }]}>
          <IconSymbol
            name="wrench.and.screwdriver.fill"
            size={18}
            color={c.tint}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.typeLabel, { color: c.text }]}>
            {MAINTENANCE_TYPE_LABELS[item.type]}
          </Text>
          <Text style={[styles.vehicleName, { color: c.subtext }]}>
            {getVehicleName(item.vehicleId)}
          </Text>
        </View>
        <View style={styles.cardRight}>
          {item.cost != null && (
            <Text style={[styles.cost, { color: c.text }]}>
              {item.currency}
              {item.cost.toFixed(2)}
            </Text>
          )}
          <Text style={[styles.date, { color: c.subtext }]}>{item.date}</Text>
        </View>
      </View>
      {item.description ? (
        <Text style={[styles.description, { color: c.subtext }]}>
          {item.description}
        </Text>
      ) : null}
      {item.mileage != null ? (
        <Text style={[styles.mileage, { color: c.subtext }]}>
          <IconSymbol name="speedometer" size={12} color={c.subtext} />{" "}
          {item.mileage.toLocaleString()} km
        </Text>
      ) : null}
      {item.workshop ? (
        <Text style={[styles.mileage, { color: c.subtext }]}>
          @ {item.workshop}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={22} color={c.tint} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: c.text }]}>
          Maintenance Log
        </Text>
        <TouchableOpacity onPress={() => router.push("/maintenance/add")}>
          <IconSymbol name="plus" size={22} color={c.tint} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="wrench.and.screwdriver.fill"
            title="No Maintenance Records"
            subtitle="Track your service history by tapping +"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pageTitle: { fontSize: 20, fontWeight: "700" },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1 },
  cardRight: { alignItems: "flex-end" },
  typeLabel: { fontSize: 15, fontWeight: "600" },
  vehicleName: { fontSize: 12, marginTop: 2 },
  cost: { fontSize: 15, fontWeight: "700" },
  date: { fontSize: 12, marginTop: 2 },
  description: { fontSize: 13, lineHeight: 18 },
  mileage: { fontSize: 12 },
});
