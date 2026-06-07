import { DocumentCard } from "@/components/documents/document-card";
import {
  DocumentImportSheet,
  type DocumentSource,
} from "@/components/documents/document-import-sheet";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { EmptyState } from "@/components/ui/empty-state";
import { Header } from "@/components/ui/header";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CarDocumentType } from "@/models";
import { haptics } from "@/services/haptics";
import { useDocumentsStore, useVehiclesStore } from "@/store";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";

const FILTERS: Array<{ key: CarDocumentType | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "registration", label: "Reg." },
  { key: "insurance", label: "Insur." },
  { key: "inspection", label: "Insp." },
  { key: "title", label: "Title" },
  { key: "roadworthy", label: "RWC" },
];

export default function DocumentsTab() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { backTo } = useLocalSearchParams<{ backTo?: string }>();
  const documents = useDocumentsStore((s) => s.documents);
  const getVehicle = useVehiclesStore((s) => s.getVehicle);
  const [filter, setFilter] = useState<CarDocumentType | "all">("all");
  const [importSheetVisible, setImportSheetVisible] = useState(false);

  const filtered =
    filter === "all" ? documents : documents.filter((d) => d.type === filter);

  function handleBackToSettings() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/settings");
  }

  function handleImportSource(source: DocumentSource) {
    setImportSheetVisible(false);
    router.push({
      pathname: "/scan",
      params: { source },
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <Header
        title="Documents"
        onBack={
          () => router.back()
        }
      />

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {FILTERS.map((f) => (
          <AnimatedPressable
            key={f.key}
            style={[
              styles.chip,
              {
                backgroundColor: filter === f.key ? c.tint : c.card,
                borderColor: filter === f.key ? c.tint : c.border,
              },
            ]}
            onPress={() => {
              if (filter !== f.key) void haptics.selection();
              setFilter(f.key);
            }}
            pressedScale={0.95}
          >
            <Text
              style={[
                styles.chipText,
                { color: filter === f.key ? "#fff" : c.subtext },
              ]}
            >
              {f.label}
            </Text>
          </AnimatedPressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => {
          const v = getVehicle(item.vehicleId);
          return (
            <DocumentCard
              document={item}
              vehicleName={v ? `${v.year} ${v.make} ${v.model}` : undefined}
            />
          );
        }}
        contentContainerStyle={
          filtered.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={
          <EmptyState
            icon="doc.text.fill"
            title={
              documents.length === 0
                ? "No documents saved"
                : `No ${FILTERS.find((item) => item.key === filter)?.label ?? "matching"} documents`
            }
            subtitle={
              documents.length === 0
                ? "Scan a document, upload a file, or choose photos to start your vault."
                : "Switch filters to see saved documents in another category."
            }
            actionLabel={documents.length === 0 ? "Add Document" : "Show All"}
            onAction={
              documents.length === 0
                ? () => setImportSheetVisible(true)
                : () => setFilter("all")
            }
          />
        }
      />

      <DocumentImportSheet
        visible={importSheetVisible}
        onClose={() => setImportSheetVisible(false)}
        onSelect={handleImportSource}
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
  chipRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.page,
    gap: 8,
    marginBottom: 0,
    marginTop: 8,
    flexWrap: "nowrap",
    height: 32,
    
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  list: { paddingTop: 8, paddingBottom: 100 },
  emptyList: { flex: 1 },
});
