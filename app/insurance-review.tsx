import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, StatusColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CarDocument, Vehicle } from "@/models";
import { getDocumentSpecs } from "@/services/docs-registry";
import { scheduleDocumentExpiryReminders } from "@/services/notifications/expiry-reminders";
import { useDocumentsStore, useSettingsStore, useVehiclesStore } from "@/store";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
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

function normalizeForMatch(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Attempts to find an existing vehicle that matches the scanned insurance fields. */
function findMatchingVehicle(
  vehicles: Vehicle[],
  fields: Record<string, string>,
): Vehicle | undefined {
  // Accept both VIN and chassis number from fields
  const scannedVin = normalizeForMatch(fields.engine_number ?? "");
  const scannedChassis = normalizeForMatch(fields.chassis_number ?? "");
  const scannedMake = normalizeForMatch(fields.make ?? "");
  const scannedModel = normalizeForMatch(fields.model ?? "");
  const scannedYear = parseInt(fields.year ?? "", 10);

  // 1. Strict: VIN or chassis must match, and if both exist, both must match
  if (scannedVin || scannedChassis) {
    const byVinChassis = vehicles.find((v) => {
      const vehicleVin = normalizeForMatch(v.vin ?? "");
      const vehicleChassis = normalizeForMatch(v.chassis ?? ""); // If you add chassis_number to Vehicle model
      // If both scanned and vehicle have both fields, both must match
      if (scannedVin && vehicleVin && scannedChassis && vehicleChassis) {
        return scannedVin === vehicleVin && scannedChassis === vehicleChassis;
      }
      // If only VIN present, match VIN
      if (scannedVin && vehicleVin && scannedVin === vehicleVin) return true;
      // If only chassis present, match chassis
      if (scannedChassis && vehicleChassis && scannedChassis === vehicleChassis)
        return true;
      return false;
    });
    if (byVinChassis) return byVinChassis;
  }

  // 2. Make + Model + Year match
  if (scannedMake && scannedModel && !isNaN(scannedYear)) {
    const byDetail = vehicles.find(
      (v) =>
        normalizeForMatch(v.make) === scannedMake &&
        normalizeForMatch(v.model) === scannedModel &&
        v.year === scannedYear,
    );
    if (byDetail) return byDetail;
  }

  // 3. Make + Year match (looser)
  if (scannedMake && !isNaN(scannedYear)) {
    const byMakeYear = vehicles.find(
      (v) =>
        normalizeForMatch(v.make) === scannedMake && v.year === scannedYear,
    );
    if (byMakeYear) return byMakeYear;
  }

  return undefined;
}

const INSURANCE_FIELD_ORDER = [
  "certificate_number",
  "policy_number",
  "insurer_name",
  "policyholder_name",
  "cover_type",
  "effective_date",
  "expiry_date",
  "issue_date",
  "make",
  "model",
  "year",
  "chassis_number",
  "engine_number",
  "permitted_uses",
  "excluded_uses",
  "entitled_drivers",
  "transaction_number",
  "sum_insured",
  "annual_premium",
];

export default function InsuranceReviewScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const country = useSettingsStore((s) => s.country);
  const { addDocument } = useDocumentsStore();
  const { vehicles, addVehicle } = useVehiclesStore();

  const {
    label,
    issuingAuthority,
    fields: fieldsParam,
    fileUri,
  } = useLocalSearchParams<{
    label: string;
    issuingAuthority: string;
    fields: string;
    fileUri: string;
    fileType: string;
  }>();

  const spec = useMemo(() => {
    try {
      const specs = getDocumentSpecs(country);
      return specs?.find((s) => s.type === "insurance_certificate") ?? null;
    } catch {
      return null;
    }
  }, [country]);

  const initialFields = useMemo((): Record<string, string> => {
    try {
      return JSON.parse(fieldsParam ?? "{}");
    } catch {
      return {};
    }
  }, [fieldsParam]);

  const [fields, setFields] = useState<Record<string, string>>(initialFields);
  const [saving, setSaving] = useState(false);

  // Auto-detected vehicle match
  const [matchedVehicle, setMatchedVehicle] = useState<Vehicle | null>(null);
  const [matchSource, setMatchSource] = useState<
    "vin" | "make_model_year" | "make_year" | "none"
  >("none");
  const [overrideVehicleId, setOverrideVehicleId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const match = findMatchingVehicle(vehicles, fields);
    if (match) {
      setMatchedVehicle(match);
      const scannedVin = normalizeForMatch(fields.chassis_number ?? "");
      if (scannedVin && normalizeForMatch(match.vin) === scannedVin) {
        setMatchSource("vin");
      } else if (
        normalizeForMatch(match.make) ===
          normalizeForMatch(fields.make ?? "") &&
        normalizeForMatch(match.model) ===
          normalizeForMatch(fields.model ?? "") &&
        match.year === parseInt(fields.year ?? "", 10)
      ) {
        setMatchSource("make_model_year");
      } else {
        setMatchSource("make_year");
      }
    } else {
      setMatchedVehicle(null);
      setMatchSource("none");
    }
  }, [fields, vehicles]);

  const setField = useCallback((key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  function createVehicleFromFields(): string {
    const make = fields.make ?? "";
    const model = fields.model ?? "";
    const year = parseInt(fields.year ?? "", 10) || new Date().getFullYear();
    const vin = fields.chassis_number ?? "";
    const vehicle: Vehicle = {
      id: generateId(),
      make: make || "Unknown",
      model: model || "Unknown",
      chassis: vin,
      year,
      vin,
      licensePlate: "",
      color: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addVehicle(vehicle);
    return vehicle.id;
  }

  async function handleSave() {
    const expiryRaw = fields.expiry_date ?? fields.effective_date ?? "";
    const issueRaw = fields.issue_date ?? fields.effective_date ?? "";

    if (!expiryRaw) {
      Alert.alert(
        "Missing Expiry Date",
        "Please fill in the expiry date before saving.",
      );
      return;
    }

    setSaving(true);
    try {
      let vehicleId: string;

      if (overrideVehicleId) {
        vehicleId = overrideVehicleId;
      } else if (matchedVehicle) {
        vehicleId = matchedVehicle.id;
      } else {
        // No match — auto-create from scanned fields
        vehicleId = createVehicleFromFields();
      }

      const doc: CarDocument = {
        id: generateId(),
        vehicleId,
        type: "insurance",
        title: label ?? "Certificate of Insurance",
        documentNumber: fields.certificate_number ?? fields.policy_number ?? "",
        issuingAuthority: issuingAuthority ?? "",
        issueDate: issueRaw
          ? new Date(issueRaw).toISOString()
          : new Date().toISOString(),
        expiryDate: new Date(expiryRaw).toISOString(),
        imageUri: "",
        pdfUri: fileUri ?? "",
        notes: [
          fields.cover_type ? `Cover: ${fields.cover_type}` : "",
          fields.insurer_name ? `Insurer: ${fields.insurer_name}` : "",
          fields.permitted_uses ? `Uses: ${fields.permitted_uses}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addDocument(doc);
      await scheduleDocumentExpiryReminders(doc).catch(() => {});
      router.replace({
        pathname: "/vehicle/[id]/related",
        params: { id: vehicleId },
      });
    } catch (e: any) {
      Alert.alert("Save Error", String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  const specFields = spec?.fields ?? {};
  const orderedKeys = [
    ...INSURANCE_FIELD_ORDER.filter((k) => k in specFields),
    ...Object.keys(specFields).filter(
      (k) => !INSURANCE_FIELD_ORDER.includes(k),
    ),
  ];

  const inputStyle = [
    styles.input,
    { backgroundColor: c.card, borderColor: c.border, color: c.text },
  ];
  const labelStyle = [styles.fieldLabel, { color: c.subtext }];

  const matchLabel: Record<string, string> = {
    vin: "Matched by VIN / Chassis Number",
    make_model_year: "Matched by Make, Model & Year",
    make_year: "Matched by Make & Year",
    none: "",
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <IconSymbol name="chevron.left" size={20} color={c.tint} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: c.text }]}>
            Review Insurance
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Document type badge */}
          <View style={[styles.badge, { backgroundColor: "#8B5CF6" }]}>
            <IconSymbol name="shield.fill" size={16} color="#fff" />
            <View>
              <Text style={styles.badgeTitle}>
                {label ?? "Certificate of Insurance"}
              </Text>
              {issuingAuthority ? (
                <Text style={styles.badgeIssuer}>{issuingAuthority}</Text>
              ) : null}
            </View>
          </View>

          {/* Vehicle match card */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>
              Vehicle
            </Text>

            {matchedVehicle && !overrideVehicleId ? (
              <View
                style={[
                  styles.matchCard,
                  {
                    backgroundColor: StatusColors.successBg,
                    borderColor: StatusColors.success,
                  },
                ]}
              >
                <View style={styles.matchCardRow}>
                  <IconSymbol
                    name="checkmark.circle.fill"
                    size={20}
                    color={StatusColors.success}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.matchVehicleName, { color: c.text }]}>
                      {matchedVehicle.year} {matchedVehicle.make}{" "}
                      {matchedVehicle.model}
                    </Text>
                    <Text
                      style={[
                        styles.matchSource,
                        { color: StatusColors.success },
                      ]}
                    >
                      {matchLabel[matchSource]}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setOverrideVehicleId("")}>
                    <Text style={{ color: c.tint, fontSize: 13 }}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : overrideVehicleId !== null && vehicles.length > 0 ? (
              <View style={styles.vehiclePickerList}>
                <Text style={[styles.helperText, { color: c.subtext }]}>
                  Select a vehicle:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {vehicles.map((v) => {
                    const selected = overrideVehicleId === v.id;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        style={[
                          styles.vehicleChip,
                          {
                            backgroundColor: selected ? c.tint : c.card,
                            borderColor: selected ? c.tint : c.border,
                          },
                        ]}
                        onPress={() => setOverrideVehicleId(v.id)}
                      >
                        <Text
                          style={{
                            color: selected ? "#fff" : c.text,
                            fontWeight: selected ? "700" : "500",
                            fontSize: 13,
                          }}
                        >
                          {v.year} {v.make} {v.model}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              <View
                style={[
                  styles.matchCard,
                  {
                    backgroundColor: StatusColors.warningBg,
                    borderColor: StatusColors.warning,
                  },
                ]}
              >
                <View style={styles.matchCardRow}>
                  <IconSymbol
                    name="exclamationmark.triangle.fill"
                    size={20}
                    color={StatusColors.warning}
                  />
                  <Text
                    style={[
                      styles.matchVehicleName,
                      { color: c.text, flex: 1 },
                    ]}
                  >
                    No matching vehicle found
                  </Text>
                </View>
                <Text style={[styles.helperText, { color: c.subtext }]}>
                  A new vehicle will be created from the scanned fields (
                  {fields.year} {fields.make} {fields.model}).
                </Text>
                {vehicles.length > 0 && (
                  <TouchableOpacity
                    style={{ marginTop: 8 }}
                    onPress={() => setOverrideVehicleId("")}
                  >
                    <Text style={{ color: c.tint, fontSize: 13 }}>
                      Link to an existing vehicle instead
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Fields */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>
              Document Fields
            </Text>

            {orderedKeys.map((key) => {
              const fs = specFields[key];
              if (!fs) return null;
              return (
                <View key={key} style={styles.fieldRow}>
                  <Text style={labelStyle}>
                    {fs.label ?? key}
                    {fs.required ? (
                      <Text style={{ color: StatusColors.danger }}> *</Text>
                    ) : null}
                  </Text>
                  <TextInput
                    style={inputStyle}
                    value={fields[key] ?? ""}
                    onChangeText={(v) => setField(key, v)}
                    placeholder={fs.label ?? key}
                    placeholderTextColor={c.subtext}
                    keyboardType={fs.type === "number" ? "numeric" : "default"}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: c.border }]}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: "#8B5CF6" }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Insurance Document</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, alignItems: "flex-start" },
  title: { fontSize: 17, fontWeight: "600" },
  scroll: { padding: 16, paddingBottom: 32 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  badgeTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  badgeIssuer: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 1 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  matchCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  matchCardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  matchVehicleName: { fontSize: 15, fontWeight: "600" },
  matchSource: { fontSize: 12, marginTop: 1 },
  helperText: { fontSize: 13, lineHeight: 18 },
  vehiclePickerList: { gap: 8 },
  vehicleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
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
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
