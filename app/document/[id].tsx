import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ExpiryIndicator } from "@/components/ui/expiry-indicator";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import {
  DocTypeColors,
  Colors as ThemeColors,
  Radius,
  Spacing,
  Type,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CAR_DOCUMENT_TYPE_LABELS as LABELS } from "@/models";
import { cancelDocumentExpiryReminders } from "@/services/notifications/expiry-reminders";
import { useDocumentsStore, useVehiclesStore } from "@/store";
import { router, useLocalSearchParams } from "expo-router";
import { Header } from "@/components/ui/header";
import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? "light";
  const c = ThemeColors[scheme];

  const doc = useDocumentsStore((s) => s.getDocument(id));
  const deleteDocument = useDocumentsStore((s) => s.deleteDocument);
  const getVehicle = useVehiclesStore((s) => s.getVehicle);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  if (!doc) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.background }]}
      >
        <ThemedText>Document not found.</ThemedText>
      </SafeAreaView>
    );
  }

  const vehicle = getVehicle(doc.vehicleId);
  const accentColor = DocTypeColors[doc.type] ?? DocTypeColors.other;

  async function handleDelete() {
    setDeleting(true);
    try {
      await cancelDocumentExpiryReminders(doc!.id).catch(() => {});
      deleteDocument(id);
      router.back();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Header title={doc.title ?? LABELS[doc.type]} onBack={() => router.back()} />
        <View style={[styles.typeBar, { backgroundColor: accentColor }]}>
          <Text style={styles.typeBarText}>{LABELS[doc.type]}</Text>
        </View>

        <Card style={styles.infoCard}>
          <Text style={[styles.title, { color: c.text }]}>
            {doc.title ?? LABELS[doc.type]}
          </Text>

          <View style={styles.row}>
            <Text style={[styles.fieldLabel, { color: c.subtext }]}>
              Document No.
            </Text>
            <Text style={[styles.fieldValue, { color: c.text }]}>
              {doc.documentNumber}
            </Text>
          </View>

          {vehicle ? (
            <View style={styles.row}>
              <Text style={[styles.fieldLabel, { color: c.subtext }]}>
                Vehicle
              </Text>
              <Text style={[styles.fieldValue, { color: c.text }]}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
            </View>
          ) : null}

          {doc.issuingAuthority ? (
            <View style={styles.row}>
              <Text style={[styles.fieldLabel, { color: c.subtext }]}>
                Issued by
              </Text>
              <Text style={[styles.fieldValue, { color: c.text }]}>
                {doc.issuingAuthority}
              </Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <Text style={[styles.fieldLabel, { color: c.subtext }]}>
              Issue Date
            </Text>
            <Text style={[styles.fieldValue, { color: c.text }]}>
              {new Date(doc.issueDate).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.fieldLabel, { color: c.subtext }]}>
              Expiry Date
            </Text>
            <View style={styles.expiryRow}>
              <Text style={[styles.fieldValue, { color: c.text }]}>
                {new Date(doc.expiryDate).toLocaleDateString()}
              </Text>
              <ExpiryIndicator expiryDate={doc.expiryDate} />
            </View>
          </View>

          {doc.notes ? (
            <View style={styles.notesBox}>
              <Text style={[styles.fieldLabel, { color: c.subtext }]}>
                Notes
              </Text>
              <Text style={[styles.notes, { color: c.text }]}>{doc.notes}</Text>
            </View>
          ) : null}
        </Card>

        {/* Document image */}
        {doc.imageUri ? (
          <TouchableOpacity
            onPress={() => setViewerUri(doc.imageUri!)}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: doc.imageUri }}
              style={styles.docImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.deleteBtn]}
            onPress={() => setShowDelete(true)}
          >
            <IconSymbol name="trash.fill" size={16} color="#fff" />
            <Text style={styles.deleteBtnText}>Delete Document</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showDelete}
        title="Delete Document"
        message="This will permanently delete this document."
        confirmLabel="Delete"
        loadingLabel="Deleting"
        loading={deleting}
        destructive
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setShowDelete(false);
        }}
      />

      <ImageViewerModal
        visible={!!viewerUri}
        uri={viewerUri}
        onClose={() => setViewerUri(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40 },
  typeBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.page,
    paddingVertical: 10,
    gap: 8,
  },
  backBtn: {
    padding: 2,
  },
  typeBarText: {
    color: "#fff",
    ...Type.sectionLabel,
  },
  infoCard: { margin: Spacing.page, gap: 10 },
  title: { ...Type.title, marginBottom: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(128,128,128,0.15)",
  },
  expiryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fieldLabel: Type.body,
  fieldValue: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
  },
  notesBox: { gap: 4, paddingTop: 4 },
  notes: Type.body,
  docImage: {
    marginHorizontal: Spacing.page,
    height: 200,
    borderRadius: Radius.surface,
  },
  actions: { margin: Spacing.page },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.pill,
    backgroundColor: "#EF4444",
  },
  deleteBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
