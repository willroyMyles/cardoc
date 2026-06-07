import { DocumentCard } from "@/components/documents/document-card";
import { DocumentDetailSheet } from "@/components/documents/document-detail-sheet";
import {
  DocumentSource,
  DocumentSourceSheet,
} from "@/components/documents/document-source-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Colors, Radius, Spacing, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CarDocument } from "@/models";
import { cancelDocumentExpiryReminders } from "@/services/notifications/expiry-reminders";
import { useDocumentsStore, useVehiclesStore } from "@/store";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface DocVaultScreenProps {
  onScroll?: ScrollViewProps["onScroll"];
  scrollEventThrottle?: ScrollViewProps["scrollEventThrottle"];
}

export function DocVaultScreen({
  onScroll,
  scrollEventThrottle = 16,
}: DocVaultScreenProps = {}) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const documents = useDocumentsStore((s) => s.documents);
  const deleteDocument = useDocumentsStore((s) => s.deleteDocument);
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const getVehicle = useVehiclesStore((s) => s.getVehicle);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [importingSource, setImportingSource] = useState<DocumentSource | null>(
    null,
  );
  const [uploadSheetInstanceKey, setUploadSheetInstanceKey] = useState(0);
  const uploadSheetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const galleryLabel = Platform.OS === "ios" ? "Photos" : "Gallery";

  const activeVehicle = vehicles[0];
  const documentsForVehicle = activeVehicle
    ? documents.filter((doc) => doc.vehicleId === activeVehicle.id)
    : documents;
  const selectedDocument = selectedDocumentId
    ? documents.find((document) => document.id === selectedDocumentId) ?? null
    : null;

  useEffect(() => {
    return () => {
      if (uploadSheetTimeoutRef.current !== null) {
        clearTimeout(uploadSheetTimeoutRef.current);
      }
    };
  }, []);

  const getVehicleName = (document: CarDocument) => {
    const vehicle = getVehicle(document.vehicleId);
    return vehicle
      ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      : undefined;
  };

  async function handleDeleteDocument(id: string) {
    await cancelDocumentExpiryReminders(id).catch(() => {});
    deleteDocument(id);
  }

  const openUploadSheet = useCallback(() => {
    if (uploadSheetTimeoutRef.current !== null) {
      clearTimeout(uploadSheetTimeoutRef.current);
    }

    setUploadSheetVisible(false);
    uploadSheetTimeoutRef.current = setTimeout(() => {
      uploadSheetTimeoutRef.current = null;
      setUploadSheetInstanceKey((key) => key + 1);
      setUploadSheetVisible(true);
    }, 0);
  }, []);

  async function handleScanSource(source: DocumentSource) {
    setUploadSheetVisible(false);
    setImportingSource(source);

    if (source === "gallery") {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.9,
          allowsEditing: false,
          allowsMultipleSelection: true,
        });
        if (result.canceled || !result.assets?.length) return;

        router.push({
          pathname: "/scan",
          params: {
            files: JSON.stringify(
              result.assets.map((asset) => ({
                uri: asset.uri,
                mimeType: asset.mimeType ?? "image/jpeg",
              })),
            ),
          },
        });
      } catch (error: any) {
        Alert.alert("Photos Error", String(error?.message ?? error));
      } finally {
        setImportingSource(null);
      }
      return;
    }

    if (source === "files") {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "image/*"],
          copyToCacheDirectory: true,
          multiple: true,
        });
        if (result.canceled || !result.assets?.length) return;

        router.push({
          pathname: "/scan",
          params: {
            files: JSON.stringify(
              result.assets.map((asset) => ({
                uri: asset.uri,
                mimeType: asset.mimeType ?? "image/jpeg",
              })),
            ),
          },
        });
      } catch (error: any) {
        Alert.alert("Files Error", String(error?.message ?? error));
      } finally {
        setImportingSource(null);
      }
      return;
    }

    router.push({
      pathname: "/scan",
      params: { source },
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}> 
      <ScrollView
        contentContainerStyle={styles.scroll}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        {/* <Text style={[styles.sectionLabel, { color: c.subtext }]}>ACTIVE REMINDERS & WARNINGS</Text>

        <Card style={styles.reminderCard}>
          <View style={styles.reminderRow}>
            <View style={[styles.reminderIcon, { backgroundColor: reminderIconBg }] }>
              <IconSymbol name={reminderIcon as any} size={18} color={reminderIconColor} />
            </View>
            <View style={styles.reminderCopy}>
              <Text style={[styles.reminderTitle, { color: c.text }]}>{reminderTitle}</Text>
              <Text style={[styles.reminderBody, { color: c.subtext }]}>{reminderText}</Text>
            </View>
          </View>
        </Card> */}

        <Card style={styles.uploadCard}>
          <Text style={[styles.uploadTitle, { color: c.text }]}>Scan & Upload Center</Text>
          <Text style={[styles.uploadSubtitle, { color: c.subtext }]}>Instantly analyze paper documents with Gemini Vision OCR. Supports JPEG & PNG slips.</Text>

          <View style={styles.uploadActions}>
            <Button
              label="File Upload"
              icon="square.and.arrow.up"
              onPress={openUploadSheet}
              disabled={importingSource !== null}
              loading={importingSource === "gallery" || importingSource === "files"}
              style={styles.uploadButton}
            />
            <Button
              label="Camera Live"
              icon="camera.fill"
              variant="secondary"
              onPress={() => handleScanSource("camera")}
              disabled={importingSource !== null}
              loading={importingSource === "camera"}
              style={styles.uploadButton}
            />
          </View>

          {/* <View style={styles.simulatedSection}>
            <Text style={[styles.simulatedLabel, { color: c.subtext }]}>Simulate Gemini Analyser Slips</Text>
            <View style={styles.simulatedRow}>
              {SIMULATED_SLIPS.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={[styles.simulatedChip, { backgroundColor: c.card, borderColor: c.border }]}
                  onPress={() => router.push("/scan")}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.simulatedText, { color: c.text }]}>⚡ {name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View> */}
        </Card>

        <Button
          label="Add Manual Policy Slip"
          icon="plus"
          variant="secondary"
          onPress={() => router.push("/document/add")}
          style={styles.manualButton}
        />

        {documentsForVehicle.length > 0 ? (
          <View style={styles.documentList}>
            {documentsForVehicle.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                vehicleName={getVehicleName(document)}
                onPress={() => setSelectedDocumentId(document.id)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="doc.text.fill"
            title="No documents yet"
            subtitle="Scan a document, upload a file, or add a policy slip manually to start building your vault."
            actionLabel="Upload File"
            onAction={openUploadSheet}
            secondaryActionLabel="Add Manually"
            onSecondaryAction={() => router.push("/document/add")}
          />
        )}
      </ScrollView>

      <DocumentDetailSheet
        document={selectedDocument}
        vehicleName={
          selectedDocument ? getVehicleName(selectedDocument) : undefined
        }
        visible={selectedDocument !== null}
        onClose={() => setSelectedDocumentId(null)}
        onDelete={handleDeleteDocument}
      />

      <DocumentSourceSheet
        key={uploadSheetInstanceKey}
        visible={uploadSheetVisible}
        title="Upload document"
        subtitle="Choose where to import the document from."
        options={[
          {
            source: "gallery",
            label: galleryLabel,
            description: "Choose one or more images",
          },
          {
            source: "files",
            label: "Files",
            description: "Choose a document or image",
          },
        ]}
        onClose={() => setUploadSheetVisible(false)}
        onSelect={handleScanSource}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 48 },
  sectionLabel: {
    marginTop: 24,
    marginHorizontal: Spacing.section,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  reminderCard: {
    marginTop: 16,
    marginHorizontal: Spacing.section,
    borderRadius: Radius.card,
    padding: Spacing.cardPadding,
  },
  reminderRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  reminderIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.tileLg,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderCopy: { flex: 1 },
  reminderTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  reminderBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  uploadCard: {
    marginTop: 16,
    marginHorizontal: Spacing.section,
    borderRadius: Radius.card,
    padding: Spacing.cardPadding,
  },
  uploadTitle: {
    ...Type.title,
    marginBottom: 8,
  },
  uploadSubtitle: {
    ...Type.body,
    marginBottom: 16,
  },
  uploadActions: {
    flexDirection: "row",
    gap: 8,
  },
  uploadButton: {
    flex: 1,
  },
  simulatedSection: {
    borderTopWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    paddingTop: 16,
  },
  simulatedLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  simulatedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  simulatedChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  simulatedText: {
    fontSize: 11,
    fontWeight: "700",
  },
  manualButton: {
    marginTop: 16,
    marginHorizontal: Spacing.section,
  },
  documentList: { marginTop: 16 },
});
