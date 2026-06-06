import { IconSymbol } from "@/components/ui/icon-symbol";
import { Header } from "@/components/ui/header";
import { Colors, Radius, Spacing, StatusColors, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLicenseStore, useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function EmergencyScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const license = useLicenseStore((s) => s.license);
  const vehicles = useVehiclesStore((s) => s.vehicles);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Header title="Emergency Card" onBack={() => router.back()} />

        {/* Driver info */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.subtext }]}>Driver Information</Text>
          {license ? (
            <>
              <Row label="Full Name" value={license.fields.fullName ?? "—"} />
              <Row
                label="Date of Birth"
                value={license.fields.dateOfBirth ?? "—"}
              />
              <Row
                label="License Number"
                value={license.fields.licenseNumber ?? "—"}
              />
              <Row
                label="License Class"
                value={license.fields.licenseClass ?? "—"}
              />
              <Row label="Issuing Region" value={"—"} />
              {license.fields.address ? (
                <Row label="Address" value={license.fields.address} />
              ) : null}
            </>
          ) : (
            <Text style={[styles.empty, { color: c.subtext }]}>
              {"No driver's license saved. Add it in the License section."}
            </Text>
          )}
        </View>

        {/* Vehicles */}
        {vehicles.length > 0 && (
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.sectionTitle, { color: c.subtext }]}>Registered Vehicles</Text>
            {vehicles.map((v) => (
              <View key={v.id} style={styles.vehicleRow}>
                <View style={styles.iconTile}>
                  <IconSymbol name="car.fill" size={16} color="#F59E0B" />
                </View>
                <View>
                  <Text style={[styles.vehicleName, { color: c.text }]}>
                    {v.year} {v.make} {v.model}
                  </Text>
                  <Text style={[styles.vehiclePlate, { color: c.subtext }]}>
                    {v.licensePlate}
                    {v.vin ? ` · ${v.vin}` : ""}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Emergency note */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: StatusColors.dangerBg,
              borderColor: StatusColors.danger,
            },
          ]}
        >
          <View style={styles.noteRow}>
            <IconSymbol
              name="exclamationmark.triangle.fill"
              size={18}
              color={StatusColors.danger}
            />
            <Text style={[styles.noteText, { color: StatusColors.danger }]}>
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
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: c.subtext }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.page, paddingBottom: 40, gap: Spacing.rowGap },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sosLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  sosText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.cardPadding,
    gap: 8,
  },
  sectionTitle: {
    ...Type.sectionLabel,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  rowLabel: Type.body,
  rowValue: {
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
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: Radius.tile,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleName: Type.title,
  vehiclePlate: Type.caption,
  empty: Type.body,
  noteRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  noteText: { ...Type.body, flex: 1, fontWeight: "600" },
});
