import { DocumentCard } from "@/components/documents/document-card";
import { LicenseCard } from "@/components/license/license-card";
import { ThemedText } from "@/components/themed-text";
import { Header } from "@/components/ui/header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Spacing, Type } from "@/constants/theme";
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
        <Header title="Related Documents" />
        <ThemedText style={{ padding: Spacing.page }}>Vehicle not found.</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <Header
        title="Related Documents"
        right={
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: c.border }]}
            onPress={() =>
              router.push({
                pathname: "/vehicle/edit/[id]",
                params: { id },
              })
            }
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Edit vehicle"
          >
            <IconSymbol name="pencil" size={16} color={c.tint} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <ThemedText type="title">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </ThemedText>
            {vehicle.licensePlate ? (
              <Text style={[styles.plate, { color: c.subtext }]}>
                {vehicle.licensePlate}
              </Text>
            ) : null}
            <Text
              style={[
                {
                  color: vehicle.color
                    ? `${vehicle.color.toLocaleLowerCase()}`
                    : c.subtext,
                },
              ]}
            >
              {vehicle.color ? vehicle.color : "No color specified"}
            </Text>
          </View>
        </View>

        {!hasRelated ? (
          <View style={styles.empty}>
            <IconSymbol name="doc.fill" size={40} color={c.subtext} />
            <Text style={[styles.emptyText, { color: c.subtext }]}>
              No related documents yet
            </Text>
            <Text style={[styles.emptyHint, { color: c.subtext }]}>
              {"Add a document or driver's license to see them here."}
            </Text>
          </View>
        ) : null}

        {/* Driver's License */}
        {license ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.subtext }]}>
              {"DRIVER'S LICENSE"}
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
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing.stackGap,
    paddingBottom: 8,
    gap: 12,
  },
  titleBlock: { gap: 2 },
  plate: Type.body,
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  section: { marginTop: 24 },
  sectionTitle: {
    ...Type.sectionLabel,
    marginHorizontal: Spacing.page,
    marginBottom: 8,
  },
  licenseWrap: { paddingHorizontal: Spacing.page },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
    paddingHorizontal: 32,
  },
  emptyText: { ...Type.title, textAlign: "center" },
  emptyHint: { ...Type.body, textAlign: "center" },
});
