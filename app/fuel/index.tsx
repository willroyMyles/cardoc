import { EmptyState } from "@/components/ui/empty-state";
import { Header } from "@/components/ui/header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Spacing, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { FUEL_TYPE_LABELS, type FuelEntry } from "@/models/fuel-log";
import { useFuelStore, useVehiclesStore } from "@/store";
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

export default function FuelListScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const entries = useFuelStore((s) => s.entries);
  const vehicles = useVehiclesStore((s) => s.vehicles);

  const getVehicleName = (id: string) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.year} ${v.make} ${v.model}` : "Unknown Vehicle";
  };

  // Compute average consumption per vehicle
  const avgConsumptionMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    vehicles.forEach((v) => {
      const vEntries = entries
        .filter((e) => e.vehicleId === v.id && e.fullTank)
        .sort((a, b) => a.mileageAtFill - b.mileageAtFill);
      if (vEntries.length >= 2) {
        const totalDist =
          vEntries[vEntries.length - 1].mileageAtFill -
          vEntries[0].mileageAtFill;
        const totalFuel = vEntries
          .slice(1)
          .reduce((sum, e) => sum + e.quantity, 0);
        if (totalDist > 0 && totalFuel > 0) {
          map[v.id] = (totalFuel / totalDist) * 100; // L/100km
        }
      }
    });
    return map;
  }, [entries, vehicles]);

  const renderItem = ({ item }: { item: FuelEntry }) => (
    <View
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.icon}>
          <IconSymbol name="fuelpump.fill" size={18} color="#F59E0B" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.fuelType, { color: c.text }]}>
            {FUEL_TYPE_LABELS[item.fuelType]}
          </Text>
          <Text style={[styles.vehicleName, { color: c.subtext }]}>
            {getVehicleName(item.vehicleId)}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.cost, { color: c.text }]}>
            {item.currency}
            {item.totalCost.toFixed(2)}
          </Text>
          <Text style={[styles.date, { color: c.subtext }]}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <Text style={[styles.detail, { color: c.subtext }]}>
          {item.quantity} {item.unit} @ {item.currency}
          {item.pricePerUnit}/{item.unit === "liters" ? "L" : "gal"}
        </Text>
        <Text style={[styles.detail, { color: c.subtext }]}>
          {item.mileageAtFill.toLocaleString()} km
          {item.fullTank ? " · Full" : ""}
        </Text>
      </View>
      {item.station ? (
        <Text style={[styles.detail, { color: c.subtext }]}>
          @ {item.station}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <Header
        title="Fuel Log"
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={() => router.push("/fuel/add")}>
            <IconSymbol name="plus" size={22} color={c.tint} />
          </TouchableOpacity>
        }
      />

      {/* Avg consumption cards */}
      {Object.entries(avgConsumptionMap).length > 0 && (
        <View style={styles.statsRow}>
          {Object.entries(avgConsumptionMap).map(([id, avg]) => {
            const v = vehicles.find((v) => v.id === id);
            return (
              <View
                key={id}
                style={[
                  styles.statCard,
                  { backgroundColor: c.card, borderColor: c.border },
                ]}
              >
                <Text style={[styles.statValue, { color: c.tint }]}>
                  {avg.toFixed(1)}
                </Text>
                <Text style={[styles.statLabel, { color: c.subtext }]}>
                  L/100km
                </Text>
                <Text
                  style={[styles.statDesc, { color: c.text }]}
                  numberOfLines={1}
                >
                  {v?.make} {v?.model}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          entries.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={
          <EmptyState
            icon="fuelpump.fill"
            title="No Fuel Records"
            subtitle="Start tracking your fuel by tapping +"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.rowGap,
    paddingHorizontal: Spacing.page,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: Radius.surface,
    borderWidth: 1,
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { ...Type.caption, fontWeight: "700" },
  statDesc: { ...Type.caption, marginTop: 2 },
  list: { padding: Spacing.page, gap: Spacing.rowGap, paddingBottom: 40 },
  emptyList: { flex: 1, padding: Spacing.page },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.cardPadding,
    gap: 8,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: Radius.tile,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1 },
  cardRight: { alignItems: "flex-end" },
  fuelType: Type.title,
  vehicleName: { ...Type.caption, marginTop: 2 },
  cost: Type.title,
  date: { ...Type.caption, marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  detail: Type.caption,
});
