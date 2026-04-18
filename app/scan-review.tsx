import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    CAR_DOCUMENT_TYPE_LABELS,
    CarDocument,
    CarDocumentType,
    DynamicDriverLicense,
    Vehicle,
} from "@/models";
import {
    getDocumentSpecs,
    getDriverLicenseSpec,
    type DocSpec,
} from "@/services/docs-registry";
import { scheduleDocumentExpiryReminders } from "@/services/notifications/expiry-reminders";
import {
    useDocumentsStore,
    useLicenseStore,
    useSettingsStore,
    useVehiclesStore,
} from "@/store";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function inferDocumentType(specType: string): CarDocumentType {
  if (specType.includes("registration")) return "registration";
  if (specType.includes("insurance")) return "insurance";
  if (specType.includes("fitness") || specType.includes("inspection"))
    return "inspection";
  if (specType.includes("title")) return "title";
  if (specType.includes("roadworthy")) return "roadworthy";
  if (specType.includes("emission")) return "emission";
  return "other";
}

function pickDocumentNumber(fields: Record<string, string>): string {
  return (
    fields.registration_number ??
    fields.certificate_number ??
    fields.policy_number ??
    fields.title_number ??
    fields.permit_number ??
    ""
  );
}

function pickExpiryDate(fields: Record<string, string>): string {
  return fields.expiry_date ?? fields.expiryDate ?? fields.valid_until ?? "";
}

function pickIssueDate(fields: Record<string, string>): string {
  return fields.date_issued ?? fields.issue_date ?? fields.issueDate ?? "";
}

export default function ScanReviewScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const country = useSettingsStore((s) => s.country);
  const { setLicense } = useLicenseStore();
  const { addDocument } = useDocumentsStore();
  const { vehicles, addVehicle } = useVehiclesStore();

  const {
    category,
    specType,
    label,
    issuingAuthority,
    fields: fieldsParam,
    imageUri,
  } = useLocalSearchParams<{
    category: string;
    specType: string;
    label: string;
    issuingAuthority: string;
    fields: string;
    imageUri: string;
  }>();

  const spec: DocSpec | null = useMemo(() => {
    try {
      if (category === "driver_license") {
        return getDriverLicenseSpec(country);
      }
      const specs = getDocumentSpecs(country);
      return specs?.find((s) => s.type === specType) ?? specs?.[0] ?? null;
    } catch {
      return null;
    }
  }, [category, specType, country]);

  const initialFields = useMemo((): Record<string, string> => {
    try {
      return JSON.parse(fieldsParam ?? "{}");
    } catch {
      return {};
    }
  }, [fieldsParam]);

  const [fields, setFields] = useState<Record<string, string>>(initialFields);
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    vehicles[0]?.id ?? "",
  );
  const [saving, setSaving] = useState(false);

  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  /** Lifts make/model/year out of scanned fields to create a minimal vehicle. */
  function createVehicleFromFields(): string {
    const make = fields.make ?? "";
    const model = fields.model ?? fields["model_mfg_type"] ?? "";
    const yearRaw = fields.year ?? fields.year_of_manufacture ?? "";
    const year = parseInt(yearRaw, 10) || new Date().getFullYear();
    const color = fields.color ?? fields.colour ?? "";
    const vin = fields.chassis_number ?? fields.vin ?? "";
    const plate = fields.registration_number ?? "";
    const vehicle: Vehicle = {
      id: generateId(),
      make: make || "Unknown",
      model: model || "Unknown",
      year,
      vin,
      licensePlate: plate,
      color,
      bodyType: fields.body_type ?? "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addVehicle(vehicle);
    return vehicle.id;
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (category === "driver_license") {
        const license: DynamicDriverLicense = {
          id: generateId(),
          country,
          fields,
          imageUriFront: imageUri ?? "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setLicense(license);
        router.replace("/license");
      } else {
        const docType = inferDocumentType(specType ?? "");
        const expiryRaw = pickExpiryDate(fields);
        const issueRaw = pickIssueDate(fields);

        if (!expiryRaw) {
          Alert.alert(
            "Missing Expiry Date",
            "Please fill in the expiry date before saving.",
          );
          setSaving(false);
          return;
        }

        // No vehicle selected — lift vehicle info from document fields
        const vehicleId = selectedVehicleId || createVehicleFromFields();

        const doc: CarDocument = {
          id: generateId(),
          vehicleId,
          type: docType,
          title: label ?? CAR_DOCUMENT_TYPE_LABELS[docType],
          documentNumber: pickDocumentNumber(fields),
          issuingAuthority: issuingAuthority ?? "",
          issueDate: issueRaw
            ? new Date(issueRaw).toISOString()
            : new Date().toISOString(),
          expiryDate: new Date(expiryRaw).toISOString(),
          imageUri: imageUri ?? "",
          notes: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addDocument(doc);
        await scheduleDocumentExpiryReminders(doc).catch(() => {});
        router.replace({
          pathname: "/vehicle/[id]/related",
          params: { id: vehicleId },
        });
      }
    } catch (e: any) {
      Alert.alert("Save Error", String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: c.card, borderColor: c.border, color: c.text },
  ];
  const labelStyle = [styles.fieldLabel, { color: c.subtext }];
  const specFields = spec?.fields ?? {};

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Detected document type header */}
          <View style={[styles.docTypeCard, { backgroundColor: c.tint }]}>
            <Text style={styles.docTypeDetectedLabel}>Detected Document</Text>
            <Text style={styles.docTypeName}>{label ?? specType}</Text>
            {issuingAuthority ? (
              <Text style={styles.docTypeIssuer}>{issuingAuthority}</Text>
            ) : null}
          </View>

          {/* Vehicle picker — only for non-license documents */}
          {category === "document" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>
                Vehicle
              </Text>
              {vehicles.length === 0 ? (
                <Text style={{ color: c.subtext, fontSize: 14, marginTop: 6 }}>
                  No vehicles yet — one will be created from the document
                  fields.
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 8 }}
                >
                  {vehicles.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[
                        styles.vehicleChip,
                        {
                          backgroundColor:
                            selectedVehicleId === v.id ? c.tint : c.card,
                          borderColor:
                            selectedVehicleId === v.id ? c.tint : c.border,
                        },
                      ]}
                      onPress={() => setSelectedVehicleId(v.id)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={{
                          color: selectedVehicleId === v.id ? "#fff" : c.text,
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        {v.year} {v.make} {v.model}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Extracted fields */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>
              Document Fields
            </Text>
            <Text style={[styles.sectionHint, { color: c.subtext }]}>
              Review and correct any errors before saving.
            </Text>

            {Object.entries(specFields).map(([key, fieldSpec]) => (
              <View key={key} style={styles.fieldRow}>
                <Text style={labelStyle}>
                  {fieldSpec.label ?? key}
                  {fieldSpec.required ? (
                    <Text style={{ color: "#EF4444" }}> *</Text>
                  ) : null}
                </Text>
                <TextInput
                  style={inputStyle}
                  value={fields[key] ?? ""}
                  onChangeText={(v) => setField(key, v)}
                  placeholder={fieldSpec.label ?? key}
                  placeholderTextColor={c.subtext}
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Save button */}
        <View
          style={[
            styles.footer,
            { backgroundColor: c.background, borderTopColor: c.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: c.tint },
              saving && { opacity: 0.6 },
            ]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>
              {saving ? "Saving…" : "Save Document"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 24 },
  docTypeCard: {
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  docTypeDetectedLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  docTypeName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  docTypeIssuer: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  sectionHint: { fontSize: 13, marginBottom: 12 },
  vehicleChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  fieldRow: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "500", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 9,
    fontSize: 15,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
