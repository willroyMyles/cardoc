import { ThemedText } from "@/components/themed-text";
import { EmptyState } from "@/components/ui/empty-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

export default function VehiclesTab() {
  const scheme = useColorScheme() ?? "light";
  const vehicles = useVehiclesStore((s) => s.vehicles);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors[scheme].background }]}
    >
      <View style={styles.header}>
        <ThemedText type="title">Vehicles</ThemedText>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: Colors[scheme].tint }]}
          onPress={() => router.push("/vehicle/add")}
        >
          <IconSymbol name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        renderItem={({ item }) => <VehicleCard vehicle={item} />}
        contentContainerStyle={
          vehicles.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={
          <EmptyState
            icon="car.fill"
            title="No vehicles yet"
            subtitle="Tap + to add your first vehicle"
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingBottom: 24 },
  emptyList: { flex: 1 },
});
