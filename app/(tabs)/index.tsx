import { EmptyState } from "@/components/ui/empty-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const [refreshing, setRefreshing] = useState(false);

  const vehicles = useVehiclesStore((s) => s.vehicles);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.tint}
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.heroRow}>
            <TouchableOpacity
              style={[styles.heroCard, { backgroundColor: c.tint }]}
              onPress={() => router.push("/scan")}
              activeOpacity={0.85}
            >
              <IconSymbol name="doc.text.viewfinder" size={34} color="#fff" />
              <Text style={styles.heroCardLabelPrimary}>Scan to begin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.heroCard,
                styles.heroCardOutlined,
                { backgroundColor: c.card, borderColor: c.tint + "66" },
              ]}
              onPress={() => router.push("/ticket/lookup")}
              activeOpacity={0.75}
            >
              <IconSymbol name="magnifyingglass" size={34} color={c.tint} />
              <Text style={[styles.heroCardLabelSecondary, { color: c.tint }]}>
                Ticket Lookup
              </Text>
            </TouchableOpacity>
          </View>

          {vehicles.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>
                  My Vehicles
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/vehicles")}
                >
                  <Text style={[styles.sectionAction, { color: c.tint }]}>
                    See all
                  </Text>
                </TouchableOpacity>
              </View>
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="car.fill"
              title="No vehicles yet"
              subtitle="Scan a document or add a vehicle to get started."
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40 },
  content: {
    paddingHorizontal: 14,
    paddingTop: 20,
    gap: 16,
  },
  heroRow: {
    flexDirection: "row",
    gap: 12,
  },
  heroCard: {
    flex: 1,
    paddingVertical: 28,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  heroCardOutlined: {
    borderWidth: 1.5,
  },
  heroCardLabelPrimary: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  heroCardLabelSecondary: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  section: {
    gap: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  sectionAction: { fontSize: 14, fontWeight: "600" },
});
