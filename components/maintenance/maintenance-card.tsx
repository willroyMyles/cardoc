import { IconSymbol } from "@/components/ui/icon-symbol";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    MAINTENANCE_TYPE_LABELS,
    type MaintenanceEntry,
} from "@/models/maintenance";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface MaintenanceCardProps {
  entry: MaintenanceEntry;
  vehicleName: string;
  onPress?: () => void;
}

export function MaintenanceCard({ entry, vehicleName, onPress }: MaintenanceCardProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
    > 
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: "#1A1A1A" }]}> 
          <IconSymbol
            name="wrench.and.screwdriver.fill"
            size={18}
            color="#f59e0b"
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.typeLabel, { color: c.text }]}> 
            {MAINTENANCE_TYPE_LABELS[entry.type]}
          </Text>
          <Text style={[styles.vehicleName, { color: c.subtext }]}> 
            {vehicleName}
          </Text>
        </View>
        <View style={styles.cardRight}>
          {entry.cost != null ? (
            <Text style={[styles.cost, { color: c.text }]}> 
              {entry.currency}
              {entry.cost.toFixed(2)}
            </Text>
          ) : null}
          <Text style={[styles.date, { color: c.subtext }]}>{entry.date}</Text>
        </View>
      </View>

      {entry.description ? (
        <Text style={[styles.description, { color: c.subtext }]}> 
          {entry.description}
        </Text>
      ) : null}

      {entry.mileage != null ? (
        <Text style={[styles.mileage, { color: c.subtext }]}> 
          <IconSymbol name="speedometer" size={12} color={c.subtext} /> {entry.mileage.toLocaleString()} km
        </Text>
      ) : null}

      {entry.workshop ? (
        <Text style={[styles.mileage, { color: c.subtext }]}> 
          @ {entry.workshop}
        </Text>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
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
