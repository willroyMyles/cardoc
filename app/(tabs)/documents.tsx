import { DocumentCard } from "@/components/documents/document-card";
import { ThemedText } from "@/components/themed-text";
import { EmptyState } from "@/components/ui/empty-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CarDocumentType } from "@/models";
import { useDocumentsStore, useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
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
  const documents = useDocumentsStore((s) => s.documents);
  const getVehicle = useVehiclesStore((s) => s.getVehicle);
  const [filter, setFilter] = useState<CarDocumentType | "all">("all");

  const filtered =
    filter === "all" ? documents : documents.filter((d) => d.type === filter);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <ThemedText type="title">Documents</ThemedText>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: c.tint }]}
          onPress={() => router.push("/document/add")}
        >
          <IconSymbol name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.chip,
              {
                backgroundColor: filter === f.key ? c.tint : c.card,
                borderColor: filter === f.key ? c.tint : c.border,
              },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.chipText,
                { color: filter === f.key ? "#fff" : c.subtext },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
            icon="doc.fill"
            title="No documents"
            subtitle="Tap + to add a document"
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
  chipRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
  list: { paddingBottom: 24 },
  emptyList: { flex: 1 },
});
