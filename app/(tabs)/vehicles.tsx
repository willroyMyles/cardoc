import {
  DocumentSource,
  DocumentSourceSheet,
} from "@/components/documents/document-source-sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { Header } from "@/components/ui/header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { Colors, Radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useVehiclesStore } from "@/store";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function VehiclesTab() {
  const scheme = useColorScheme() ?? "light";
  const { backTo } = useLocalSearchParams<{ backTo?: string }>();
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const [scannerSheetVisible, setScannerSheetVisible] = useState(false);

  function handleScannerSource(source: DocumentSource) {
    setScannerSheetVisible(false);
    router.push({
      pathname: "/scan",
      params: { source },
    });
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors[scheme].background }]}
    >
      <Header
        title="Vehicles"
        onBack={
          backTo === "/settings"
            ? () => router.replace("/settings")
            : undefined
        }
        right={
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: Colors[scheme].tint }]}
            onPress={() => setScannerSheetVisible(true)}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        }
      />

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
            subtitle="Tap + to scan a document for your first vehicle"
          />
        }
      />

      <DocumentSourceSheet
        visible={scannerSheetVisible}
        title="Add vehicle"
        subtitle="Vehicles are created from an accompanying document."
        options={[
          { source: "camera", label: "Scan Document" },
          { source: "gallery", label: "Choose from Gallery" },
          { source: "files", label: "Choose File" },
        ]}
        onClose={() => setScannerSheetVisible(false)}
        onSelect={handleScannerSource}
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
    paddingHorizontal: 40,
    paddingTop: 16,
    paddingBottom: 8,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingTop: 8, paddingBottom: 100 },
  emptyList: { flex: 1 },
});
