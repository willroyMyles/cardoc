import { DocumentCard } from "@/components/documents/document-card";
import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, StatusColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CAR_DOCUMENT_TYPE_LABELS } from "@/models";
import { useDocumentsStore, useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SIMULATED_SLIPS = [
  "Progressive Platinum",
  "State Farm Auto Premium",
  "GEICO Gold Coverage",
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DocVaultScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const documents = useDocumentsStore((s) => s.documents);
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const getVehicle = useVehiclesStore((s) => s.getVehicle);

  const expiringDocuments = useMemo(() => {
    const now = new Date();
    return documents
      .map((doc) => ({
        doc,
        expiry: new Date(doc.expiryDate),
      }))
      .filter(({ expiry }) => expiry >= now)
      .sort((a, b) => a.expiry.getTime() - b.expiry.getTime())
      .map(({ doc }) => doc);
  }, [documents]);

  const reminder = expiringDocuments[0];
  const reminderText = reminder
    ? `Reminder for your upcoming ${CAR_DOCUMENT_TYPE_LABELS[reminder.type]} “${
        reminder.title ?? reminder.documentNumber
      }” at ${reminder.issuingAuthority ?? "Service Center"} scheduled for ${formatDate(
        reminder.expiryDate,
      )}.`
    : "Scan a document to start receiving expiry reminders, appointments, and coverage warnings.";
  const reminderTitle = reminder ? "Upcoming Appt tomorrow!" : "No active reminders";
  const reminderIcon = reminder ? "exclamationmark.triangle.fill" : "info.circle.fill";
  const reminderIconColor = reminder ? StatusColors.danger : StatusColors.info;
  const reminderIconBg = reminder ? StatusColors.dangerBg : StatusColors.infoBg;

  const activeVehicle = vehicles[0];
  const documentsForVehicle = activeVehicle
    ? documents.filter((doc) => doc.vehicleId === activeVehicle.id)
    : documents;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}> 
      <ScrollView contentContainerStyle={styles.scroll}>
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
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: "#1A1A1A" }]}
              onPress={() => router.push("/scan")}
              activeOpacity={0.85}
            >
              <IconSymbol name="square.and.arrow.up" size={14} color="#fff" />
              <Text style={styles.uploadButtonText}>FILE UPLOAD</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: c.card, borderColor: c.border, borderWidth: 1 }]}
              onPress={() => router.push("/scan")}
              activeOpacity={0.85}
            >
              <IconSymbol name="camera.fill" size={14} color={c.text} />
              <Text style={[styles.uploadButtonText, { color: c.text }]}>CAMERA LIVE</Text>
            </TouchableOpacity>
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

        <TouchableOpacity
          style={[styles.manualButton, { borderColor: c.text }]}
          onPress={() => router.push("/document/add")}
          activeOpacity={0.85}
        >
          <IconSymbol name="plus" size={16} color={c.text} />
          <Text style={[styles.manualText, { color: c.text }]}>ADD MANUAL POLICY SLIP</Text>
        </TouchableOpacity>

        {documentsForVehicle.length > 0 ? (
          <View style={styles.documentList}>
            {documentsForVehicle.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                vehicleName={activeVehicle ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}` : undefined}
              />
            ))}
          </View>
        ) : (
          <Card style={styles.emptyStateCard}>
            <Text style={[styles.emptyTitle, { color: c.text }]}>No documents yet</Text>
            <Text style={[styles.emptyText, { color: c.subtext }]}>Add a policy slip, scan a document, or upload a file to start building your vault.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 48 },
  sectionLabel: {
    marginTop: 24,
    marginHorizontal: 20,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  reminderCard: {
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 20,
  },
  reminderRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  reminderIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
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
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 24,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 18,
  },
  uploadActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  uploadButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
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
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: "dashed",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    opacity: 0.8,
  },
  manualText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  documentList: { marginTop: 20 },
  emptyStateCard: {
    marginTop: 20,
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 28,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
