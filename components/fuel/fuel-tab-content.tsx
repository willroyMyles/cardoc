import { EmptyState } from "@/components/ui/empty-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { FUEL_TYPE_LABELS, type FuelEntry } from "@/models/fuel-log";
import { useFuelStore, useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

function getVehicleName(vehicleId: string, vehicles: Array<{ id: string; year: number; make: string; model: string }>) {
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  return vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Unknown Vehicle";
}

export function FuelTabContent() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const entries = useFuelStore((s) => s.entries);
  const vehicles = useVehiclesStore((s) => s.vehicles);

  const recentEntries = React.useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [entries]);

  const totalFuelCost = React.useMemo(
    () => entries.reduce((sum, item) => sum + item.totalCost, 0),
    [entries]
  );

  const consumption = React.useMemo(() => {
    const fullTankEntries = entries
      .filter((e) => e.fullTank)
      .sort((a, b) => a.mileageAtFill - b.mileageAtFill);

    if (fullTankEntries.length < 2) return undefined;

    const distance =
      fullTankEntries[fullTankEntries.length - 1].mileageAtFill -
      fullTankEntries[0].mileageAtFill;
    const fuel = fullTankEntries
      .slice(1)
      .reduce((sum, item) => sum + item.quantity, 0);

    return distance > 0 && fuel > 0 ? (fuel / distance) * 100 : undefined;
  }, [entries]);

  const renderEntry = ({ item }: { item: FuelEntry }) => (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}> 
      <View style={styles.cardHeader}>
        <View style={[styles.icon, { backgroundColor: "#06B6D418" }]}> 
          <IconSymbol name="fuelpump.fill" size={18} color="#06B6D4" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.fuelType, { color: c.text }]}>
            {FUEL_TYPE_LABELS[item.fuelType]}
          </Text>
          <Text style={[styles.vehicleName, { color: c.subtext }]}> 
            {getVehicleName(item.vehicleId, vehicles)}
          </Text>
        </View>
        <Text style={[styles.cost, { color: c.text }]}> 
          {item.currency}{item.totalCost.toFixed(2)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.detail, { color: c.subtext }]}> 
          {item.quantity} {item.unit} @ {item.currency}{item.pricePerUnit.toFixed(2)}
        </Text>
        <Text style={[styles.detail, { color: c.subtext }]}> 
          {item.mileageAtFill.toLocaleString()} km{item.fullTank ? " · Full" : ""}
        </Text>
      </View>

      {item.station ? (
        <Text style={[styles.detail, { color: c.subtext }]}>@ {item.station}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: c.subtext }]}>FUEL LEDGER{entries.length > 0 ? ` (${entries.length})` : ""}</Text>
        <AnimatedPressable
          style={[styles.logBtn, { backgroundColor: c.text }]}
          onPress={() => router.push("/fuel/add")}
          pressedScale={0.96}
        >
          <Text style={[styles.logBtnText, { color: c.background }]}>LOG REFILL</Text>
        </AnimatedPressable>
      </View>

      {entries.length > 0 && (
        <View style={[styles.summaryPill, { backgroundColor: c.card, borderColor: c.border }]}> 
          <View style={styles.summaryItem}>
            <IconSymbol name="fuelpump.fill" size={14} color="#06B6D4" />
            <Text style={[styles.summaryLabel, { color: c.subtext }]}>Total Refills</Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>{entries.length}</Text>
          </View>
          <View style={[styles.summarySep, { backgroundColor: c.border }]} />
          <View style={styles.summaryItem}>
            <IconSymbol name="dollarsign.circle" size={14} color="#06B6D4" />
            <Text style={[styles.summaryLabel, { color: c.subtext }]}>Total Spent</Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>{entries[0]?.currency ?? "$"}{totalFuelCost.toFixed(2)}</Text>
          </View>
        </View>
      )}

      <View style={styles.summaryRow}>
        <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.border }]}> 
          <Text style={[styles.statValue, { color: c.tint }]}> 
            {totalFuelCost.toFixed(2)}
          </Text>
          <Text style={[styles.statLabel, { color: c.subtext }]}>Fuel Cost</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.border }]}> 
          <Text style={[styles.statValue, { color: c.tint }]}> 
            {consumption ? consumption.toFixed(1) : "—"}
          </Text>
          <Text style={[styles.statLabel, { color: c.subtext }]}>L/100km</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Fill-ups</Text>
        {entries.length > 0 ? (
          <AnimatedPressable onPress={() => router.push("/fuel")} pressedScale={0.98}>
            <Text style={[styles.sectionLink, { color: c.tint }]}>View all</Text>
          </AnimatedPressable>
        ) : null}
      </View>

      <FlatList
        data={recentEntries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        contentContainerStyle={entries.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="fuelpump.fill"
            title="No Fuel Records"
            subtitle="Log your first refill to track fuel cost, mileage, and economy trends over time."
            actionLabel="Log Refill"
            onAction={() => router.push("/fuel/add")}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
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
    marginHorizontal: 16,
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "700",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  emptyList: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
  },
  fuelType: {
    fontSize: 15,
    fontWeight: "600",
  },
  vehicleName: {
    fontSize: 12,
    marginTop: 2,
  },
  cost: {
    fontSize: 15,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detail: {
    fontSize: 12,
  },
});
