import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, StatusColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLicenseStore, useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function EmergencyScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const license = useLicenseStore((s) => s.license);
  const vehicles = useVehiclesStore((s) => s.vehicles);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#0f172a" }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="xmark" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.sosLabel}>
            <IconSymbol
              name="heart.fill"
              size={18}
              color={StatusColors.danger}
            />
            <Text style={styles.sosText}>Emergency Card</Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        {/* Driver info */}
        <View style={[styles.card, { backgroundColor: "#1e293b" }]}>
          <Text style={styles.sectionTitle}>Driver Information</Text>
          {license ? (
            <>
              <Row label="Full Name" value={license.fullName} />
              <Row label="Date of Birth" value={license.dateOfBirth} />
              <Row label="License Number" value={license.licenseNumber} />
              <Row label="License Class" value={license.licenseClass ?? "—"} />
              <Row
                label="Issuing Region"
                value={license.issuingRegion ?? "—"}
              />
              {license.address ? (
                <Row label="Address" value={license.address} />
              ) : null}
            </>
          ) : (
            <Text style={styles.empty}>
              No driver's license saved. Add it in the License section.
            </Text>
          )}
        </View>

        {/* Vehicles */}
        {vehicles.length > 0 && (
          <View style={[styles.card, { backgroundColor: "#1e293b" }]}>
            <Text style={styles.sectionTitle}>Registered Vehicles</Text>
            {vehicles.map((v) => (
              <View key={v.id} style={styles.vehicleRow}>
                <IconSymbol name="car.fill" size={16} color="#94a3b8" />
                <View>
                  <Text style={styles.vehicleName}>
                    {v.year} {v.make} {v.model}
                  </Text>
                  <Text style={styles.vehiclePlate}>
                    {v.licensePlate}
                    {v.vin ? ` · ${v.vin}` : ""}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Emergency note */}
        <View style={[styles.card, { backgroundColor: "#7f1d1d" }]}>
          <View style={styles.noteRow}>
            <IconSymbol
              name="exclamationmark.triangle.fill"
              size={18}
              color={StatusColors.danger}
            />
            <Text style={styles.noteText}>
              Show this screen to emergency services or law enforcement when
              requested.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sosLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  sosText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  card: { borderRadius: 14, padding: 16, gap: 8 },
  sectionTitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  rowLabel: { color: "#94a3b8", fontSize: 14 },
  rowValue: {
    color: "#f1f5f9",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  vehicleName: { color: "#f1f5f9", fontSize: 14, fontWeight: "600" },
  vehiclePlate: { color: "#94a3b8", fontSize: 12 },
  empty: { color: "#64748b", fontSize: 14 },
  noteRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  noteText: { color: "#fca5a5", fontSize: 13, flex: 1, lineHeight: 20 },
});
