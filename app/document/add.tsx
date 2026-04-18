import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    CAR_DOCUMENT_TYPE_LABELS,
    CarDocument,
    CarDocumentType,
} from "@/models";
import { scheduleDocumentExpiryReminders } from "@/services/notifications/expiry-reminders";
import { useDocumentsStore, useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from "react-native";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const DOC_TYPES = Object.entries(CAR_DOCUMENT_TYPE_LABELS) as [
  CarDocumentType,
  string,
][];

export default function AddDocumentScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const addDocument = useDocumentsStore((s) => s.addDocument);
  const vehicles = useVehiclesStore((s) => s.vehicles);

  const [type, setType] = useState<CarDocumentType>("registration");
  const [title, setTitle] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [notes, setNotes] = useState("");

  const inputStyle = [
    styles.input,
    { backgroundColor: c.card, borderColor: c.border, color: c.text },
  ];
  const labelStyle = [styles.label, { color: c.subtext }];

  async function handleSave() {
    if (!docNumber || !expiryDate) {
      Alert.alert(
        "Missing Fields",
        "Document number and expiry date are required.",
      );
      return;
    }
    if (!vehicleId) {
      Alert.alert("No Vehicle", "Please add a vehicle first.");
      return;
    }
    const doc: CarDocument = {
      id: generateId(),
      vehicleId,
      type,
      title: title || CAR_DOCUMENT_TYPE_LABELS[type],
      documentNumber: docNumber,
      issuingAuthority: issuer,
      issueDate: issueDate
        ? new Date(issueDate).toISOString()
        : new Date().toISOString(),
      expiryDate: new Date(expiryDate).toISOString(),
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addDocument(doc);
    await scheduleDocumentExpiryReminders(doc).catch(() => {});
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Document Type */}
        <Text style={labelStyle}>Document Type</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeScroll}
        >
          {DOC_TYPES.map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.typeChip,
                {
                  backgroundColor: type === key ? c.tint : c.card,
                  borderColor: type === key ? c.tint : c.border,
                },
              ]}
              onPress={() => setType(key)}
            >
              <Text
                style={[
                  styles.typeChipText,
                  { color: type === key ? "#fff" : c.text },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Vehicle */}
        {vehicles.length > 0 ? (
          <>
            <Text style={labelStyle}>Vehicle</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.typeScroll}
            >
              {vehicles.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: vehicleId === v.id ? c.tint : c.card,
                      borderColor: vehicleId === v.id ? c.tint : c.border,
                    },
                  ]}
                  onPress={() => setVehicleId(v.id)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: vehicleId === v.id ? "#fff" : c.text },
                    ]}
                  >
                    {v.year} {v.make} {v.model}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : null}

        <Text style={labelStyle}>Title (optional)</Text>
        <TextInput
          style={inputStyle}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Comprehensive Insurance"
          placeholderTextColor={c.subtext}
        />

        <Text style={labelStyle}>Document Number *</Text>
        <TextInput
          style={inputStyle}
          value={docNumber}
          onChangeText={setDocNumber}
          placeholder="e.g. INS-123456"
          placeholderTextColor={c.subtext}
          autoCapitalize="characters"
        />

        <Text style={labelStyle}>Issuing Authority</Text>
        <TextInput
          style={inputStyle}
          value={issuer}
          onChangeText={setIssuer}
          placeholder="e.g. State DMV"
          placeholderTextColor={c.subtext}
        />

        <Text style={labelStyle}>Issue Date (YYYY-MM-DD)</Text>
        <TextInput
          style={inputStyle}
          value={issueDate}
          onChangeText={setIssueDate}
          placeholder="2024-01-01"
          placeholderTextColor={c.subtext}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={labelStyle}>Expiry Date * (YYYY-MM-DD)</Text>
        <TextInput
          style={inputStyle}
          value={expiryDate}
          onChangeText={setExpiryDate}
          placeholder="2025-12-31"
          placeholderTextColor={c.subtext}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={labelStyle}>Notes</Text>
        <TextInput
          style={[inputStyle, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any extra notes..."
          placeholderTextColor={c.subtext}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: c.tint }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>Save Document</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 4, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: "600", marginTop: 12, marginBottom: 4 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  textArea: { height: 80, textAlignVertical: "top" },
  typeScroll: { marginBottom: 4 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  typeChipText: { fontSize: 13, fontWeight: "600" },
  saveBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
