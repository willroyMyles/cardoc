import {
  DocumentSource,
  DocumentSourceSheet,
} from "@/components/documents/document-source-sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { Header } from "@/components/ui/header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { Colors, Radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useVehiclesStore } from "@/store";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
} from "react-native";

export default function VehiclesTab() {
  const scheme = useColorScheme() ?? "light";
  const { backTo } = useLocalSearchParams<{ backTo?: string }>();
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const [scannerSheetVisible, setScannerSheetVisible] = useState(false);
  const galleryLabel =
    Platform.OS === "ios" ? "Choose from Photos" : "Choose from Gallery";

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
          <AnimatedPressable
            style={[styles.addBtn, { backgroundColor: Colors[scheme].tint }]}
            onPress={() => setScannerSheetVisible(true)}
            pressedScale={0.92}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
          </AnimatedPressable>
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
            subtitle="Create your first vehicle by scanning a registration, insurance slip, or other vehicle document."
            actionLabel="Scan Document"
            onAction={() => setScannerSheetVisible(true)}
            secondaryActionLabel="Add Manually"
            onSecondaryAction={() => router.push("/vehicle/add")}
          />
        }
      />

      <DocumentSourceSheet
        visible={scannerSheetVisible}
        title="Add vehicle"
        subtitle="Vehicles are created from an accompanying document."
        options={[
          { source: "camera", label: "Scan Document" },
          { source: "gallery", label: galleryLabel },
          { source: "files", label: "Choose Files" },
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
