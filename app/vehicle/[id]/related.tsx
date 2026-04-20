import { DocumentCard } from "@/components/documents/document-card";
import { LicenseCard } from "@/components/license/license-card";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDocumentsStore, useLicenseStore, useVehiclesStore } from "@/store";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RelatedDocumentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const vehicle = useVehiclesStore((s) => s.vehicles.find((v) => v.id === id));
  const allDocs = useDocumentsStore((s) => s.documents);
  const docs = useMemo(
    () => allDocs.filter((d) => d.vehicleId === id),
    [allDocs, id],
  );
  const license = useLicenseStore((s) => s.license);

  const hasRelated = docs.length > 0 || !!license;

  if (!vehicle) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.background }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={20} color={c.tint} />
          <Text style={[styles.backLabel, { color: c.tint }]}>Back</Text>
        </TouchableOpacity>
        <ThemedText style={{ padding: 16 }}>Vehicle not found.</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={20} color={c.tint} />

            <Text style={[styles.backLabel, { color: c.tint }]}>Back</Text>
          </TouchableOpacity>
          <View style={styles.titleBlock}>
            <ThemedText type="title">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </ThemedText>
            {vehicle.licensePlate ? (
              <Text style={[styles.plate, { color: c.subtext }]}>
                {vehicle.licensePlate}
              </Text>
            ) : null}
          </View>
          <View
            className="row flex-row"
            style={{
              gap: 6,
              flex: 1,
              justifyContent: "flex-start",
              flexDirection: "row",
            }}
          >
            <TouchableOpacity
              style={[styles.addDocBtn, { backgroundColor: c.tint }]}
              onPress={() =>
                router.push({
                  pathname: "/document/add",
                  params: { vehicleId: id },
                })
              }
              activeOpacity={0.8}
            >
              <IconSymbol name="plus" size={16} color="#fff" />
              <Text style={styles.addDocLabel}>Add Document</Text>
            </TouchableOpacity>
            {/* Edit Vehicle Button */}
            <TouchableOpacity
              style={[styles.addDocBtn, { backgroundColor: c.border }]}
              onPress={() =>
                router.push({
                  pathname: "/vehicle/edit/[id]",
                  params: { id },
                })
              }
              activeOpacity={0.8}
            >
              <IconSymbol name="pencil" size={16} color={c.tint} />
              <Text style={[styles.addDocLabel, { color: c.tint }]}>
                Edit Vehicle
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!hasRelated ? (
          <View style={styles.empty}>
            <IconSymbol name="doc.text" size={40} color={c.subtext} />
            <Text style={[styles.emptyText, { color: c.subtext }]}>
              No related documents yet
            </Text>
            <Text style={[styles.emptyHint, { color: c.subtext }]}>
              Add a document or driver's license to see them here.
            </Text>
          </View>
        ) : null}

        {/* Driver's License */}
        {license ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.subtext }]}>
              DRIVER'S LICENSE
            </Text>
            <View style={styles.licenseWrap}>
              <LicenseCard
                license={license}
                onPress={() => router.push("/license")}
              />
            </View>
          </View>
        ) : null}

        {/* Car Documents */}
        {docs.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.subtext }]}>
              DOCUMENTS
            </Text>
            {docs.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  backLabel: { fontSize: 16 },
  titleBlock: { gap: 2 },
  plate: { fontSize: 14 },
  addDocBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addDocLabel: { color: "#fff", fontSize: 14, fontWeight: "600" },
  section: { marginTop: 24 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  licenseWrap: { paddingHorizontal: 16 },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
    paddingHorizontal: 32,
  },
  emptyText: { fontSize: 17, fontWeight: "600", textAlign: "center" },
  emptyHint: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
