import { LicenseCard } from "@/components/license/license-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DynamicDriverLicense } from "@/models";
import {
  getDriverLicenseSpec,
  type DriverLicenseSpec,
} from "@/services/docs-registry";
import { extractLicenseFieldsWithAI } from "@/services/firebase/ai-license";
import { useLicenseStore, useSettingsStore } from "@/store";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

function initFields(
  spec: DriverLicenseSpec,
  license: DynamicDriverLicense | null,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(spec.fields)) {
    const raw = license?.fields[key];
    if (raw && spec.fields[key].type === "date") {
      out[key] = raw.split("T")[0];
    } else {
      out[key] = raw ?? "";
    }
  }
  return out;
}

export default function LicenseScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { license, setLicense, deleteLicense } = useLicenseStore();
  const country = useSettingsStore((s) => s.country);
  const spec: DriverLicenseSpec = useMemo(
    () => getDriverLicenseSpec(country),
    [country],
  );

  const [editing, setEditing] = useState(!license);
  const [showDelete, setShowDelete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  const [frontUri, setFrontUri] = useState(license?.imageUriFront ?? "");
  const [backUri, setBackUri] = useState(license?.imageUriBack ?? "");
  const [fields, setFields] = useState<Record<string, string>>(() =>
    initFields(spec, license),
  );

  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: c.card, borderColor: c.border, color: c.text },
  ];
  const labelStyle = [styles.label, { color: c.subtext }];

  async function pickImage(side: "front" | "back") {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      if (side === "front") setFrontUri(result.assets[0].uri);
      else setBackUri(result.assets[0].uri);
    }
  }

  async function captureImage(side: "front" | "back") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Camera access is needed to take a photo.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      if (side === "front") setFrontUri(result.assets[0].uri);
      else setBackUri(result.assets[0].uri);
    }
  }

  function showImageOptions(side: "front" | "back") {
    Alert.alert(
      side === "front" ? "License Front" : "License Back",
      "Choose image source",
      [
        { text: "Camera", onPress: () => captureImage(side) },
        { text: "Photo Library", onPress: () => pickImage(side) },
        { text: "Cancel", style: "cancel" },
      ],
    );
  }

  async function handleProcessWithAI() {
    if (!frontUri && !backUri) {
      Alert.alert("No Images", "Add at least one image to process.");
      return;
    }
    setAiProcessing(true);
    try {
      const parsed = await extractLicenseFieldsWithAI(
        country,
        frontUri || undefined,
        backUri || undefined,
      );
      setFields((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(parsed)) {
          if (v !== undefined) {
            next[k] = spec.fields[k]?.type === "date" ? v.split("T")[0] : v;
          }
        }
        return next;
      });
      Alert.alert(
        "Done",
        "Fields filled with AI. Please review and correct any errors.",
      );
    } catch (e: any) {
      Alert.alert("AI Error", String(e?.message ?? e));
    } finally {
      setAiProcessing(false);
    }
  }

  // async function handleProcessWithMLKit() {
  //   if (!frontUri && !backUri) {
  //     Alert.alert("No Images", "Add at least one image to process.");
  //     return;
  //   }
  //   setProcessing(true);
  //   try {
  //     let frontInfo = null;
  //     let backInfo = null;
  //     if (frontUri) frontInfo = await recognizeFromUri(frontUri);
  //     if (backUri) backInfo = await recognizeFromUri(backUri);
  //     const combined = (frontInfo?.text ?? "") + (backInfo?.text ?? "");

  //     if (!combined.trim()) {
  //       Alert.alert(
  //         "No Text Found",
  //         "Could not detect text. Try clearer images with good lighting.",
  //       );
  //       return;
  //     }

  //     const parsed = parseLicenseByCountry(combined, country);
  //     if (parsed) {
  //       setFields((prev) => {
  //         const next = { ...prev };
  //         for (const [k, v] of Object.entries(parsed)) {
  //           if (v !== undefined) {
  //             next[k] = spec.fields[k]?.type === "date" ? v.split("T")[0] : v;
  //           }
  //         }
  //         return next;
  //       });
  //       Alert.alert(
  //         "Done",
  //         "Fields filled from scan. Please review and correct any errors.",
  //       );
  //     } else {
  //       Alert.alert(
  //         "Not Recognised",
  //         "Could not parse licence for this country. Try AI scan instead.",
  //       );
  //     }
  //   } catch (e: any) {
  //     const msg = String(e?.message ?? e);
  //     if (
  //       msg.includes("ML Kit") ||
  //       msg.includes("not available") ||
  //       msg.includes("Expo development build")
  //     ) {
  //       Alert.alert(
  //         "OCR Not Available",
  //         "On-device OCR requires an Expo dev build and cannot run in Expo Go.\n\nRun: npx expo run:ios  or  npx expo run:android",
  //       );
  //     } else {
  //       Alert.alert("Processing Error", msg);
  //     }
  //   } finally {
  //     setProcessing(false);
  //   }
  // }

  function handleSave() {
    const missingRequired = Object.entries(spec.fields)
      .filter(([key, fs]) => fs.required && !fields[key])
      .map(([, fs]) => fs.label ?? "");
    if (missingRequired.length > 0) {
      Alert.alert("Missing Fields", `Required: ${missingRequired.join(", ")}`);
      return;
    }

    const normalized: Record<string, string | undefined> = {};
    for (const [key, fieldSpec] of Object.entries(spec.fields)) {
      const val = fields[key];
      if (!val) {
        normalized[key] = undefined;
        continue;
      }
      if (fieldSpec.type === "date") {
        try {
          normalized[key] = new Date(val).toISOString();
        } catch {
          normalized[key] = val;
        }
      } else {
        normalized[key] = val;
      }
    }

    const data: DynamicDriverLicense = {
      id: license?.id ?? generateId(),
      country,
      fields: normalized,
      imageUriFront: frontUri || undefined,
      imageUriBack: backUri || undefined,
      createdAt: license?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLicense(data);
    setEditing(false);
  }

  function handleDelete() {
    deleteLicense();
    setEditing(true);
    setFrontUri("");
    setBackUri("");
    setFields(initFields(spec, null));
  }

  if (!editing && license) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.background }]}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <LicenseCard license={license} spec={spec} />

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.tint }]}
              onPress={() => {
                setFrontUri(license.imageUriFront ?? "");
                setBackUri(license.imageUriBack ?? "");
                setFields(initFields(spec, license));
                setEditing(true);
              }}
            >
              <IconSymbol name="pencil" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#EF4444" }]}
              onPress={() => setShowDelete(true)}
            >
              <IconSymbol name="trash.fill" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <ConfirmDialog
          visible={showDelete}
          title="Delete License"
          message="This will remove your saved driver's license information."
          confirmLabel="Delete"
          destructive
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      </SafeAreaView>
    );
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
        {/* ── License Images ─────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>
          License Images
        </Text>
        <View style={styles.imageRow}>
          {/* Front */}
          <TouchableOpacity
            style={[
              styles.imageSlot,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
            onPress={() => showImageOptions("front")}
            activeOpacity={0.7}
          >
            {frontUri ? (
              <Image
                source={{ uri: frontUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <IconSymbol name="camera" size={28} color={c.subtext} />
                <Text
                  style={[styles.imagePlaceholderText, { color: c.subtext }]}
                >
                  Front
                </Text>
              </View>
            )}
            <View style={[styles.imageLabel, { backgroundColor: c.tint }]}>
              <Text style={styles.imageLabelText}>FRONT</Text>
            </View>
          </TouchableOpacity>

          {/* Back */}
          <TouchableOpacity
            style={[
              styles.imageSlot,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
            onPress={() => showImageOptions("back")}
            activeOpacity={0.7}
          >
            {backUri ? (
              <Image
                source={{ uri: backUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <IconSymbol name="camera" size={28} color={c.subtext} />
                <Text
                  style={[styles.imagePlaceholderText, { color: c.subtext }]}
                >
                  Back
                </Text>
              </View>
            )}
            <View
              style={[
                styles.imageLabel,
                {
                  backgroundColor: c.card,
                  borderColor: c.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.imageLabelText, { color: c.subtext }]}>
                BACK
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Process buttons ────────────────────────────────────────── */}
        <View style={styles.processRow}>
          {/* <TouchableOpacity
            style={[
              styles.mlBtn,
              styles.mlBtnHalf,
              {
                backgroundColor: frontUri || backUri ? c.tint : c.card,
                borderColor: c.border,
              },
              processing && styles.mlBtnDisabled,
            ]}
            onPress={handleProcessWithMLKit}
            disabled={processing || aiProcessing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <IconSymbol
                name="doc.text.viewfinder"
                size={18}
                color={frontUri || backUri ? "#fff" : c.subtext}
              />
            )}
            <Text
              style={[
                styles.mlBtnText,
                { color: frontUri || backUri ? "#fff" : c.subtext },
              ]}
            >
              {processing ? "Processing…" : "ML Kit"}
            </Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[
              styles.mlBtn,
              styles.mlBtnHalf,
              {
                backgroundColor: frontUri || backUri ? "#8B5CF6" : c.card,
                borderColor: c.border,
              },
              aiProcessing && styles.mlBtnDisabled,
            ]}
            onPress={handleProcessWithAI}
            disabled={processing || aiProcessing}
          >
            {aiProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <IconSymbol
                name="sparkles"
                size={18}
                color={frontUri || backUri ? "#fff" : c.subtext}
              />
            )}
            <Text
              style={[
                styles.mlBtnText,
                { color: frontUri || backUri ? "#fff" : c.subtext },
              ]}
            >
              {aiProcessing ? "Processing…" : "Enhance with AI"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Dynamic Fields ─────────────────────────────────────────── */}
        {Object.entries(spec.fields).map(([key, fieldSpec]) => {
          const fieldLabel =
            (fieldSpec.label ?? key) + (fieldSpec.required ? " *" : "");

          if (fieldSpec.type === "enum" && fieldSpec.values) {
            return (
              <React.Fragment key={key}>
                <Text style={labelStyle}>{fieldLabel}</Text>
                <View style={styles.segmentRow}>
                  {fieldSpec.values.map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.segmentBtn,
                        { borderColor: c.border, backgroundColor: c.card },
                        fields[key] === val && {
                          backgroundColor: c.tint,
                          borderColor: c.tint,
                        },
                      ]}
                      onPress={() => setField(key, val)}
                    >
                      <Text
                        style={[
                          styles.segmentBtnText,
                          { color: c.subtext },
                          fields[key] === val && { color: "#fff" },
                        ]}
                      >
                        {val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={key}>
              <Text style={labelStyle}>{fieldLabel}</Text>
              <TextInput
                style={inputStyle}
                value={fields[key] ?? ""}
                onChangeText={(v) => setField(key, v)}
                placeholder={fieldSpec.type === "date" ? "YYYY-MM-DD" : ""}
                placeholderTextColor={c.subtext}
                keyboardType={
                  fieldSpec.type === "date"
                    ? "numbers-and-punctuation"
                    : "default"
                }
              />
            </React.Fragment>
          );
        })}

        <View style={styles.formActions}>
          {license ? (
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: c.border }]}
              onPress={() => setEditing(false)}
            >
              <Text style={[styles.cancelBtnText, { color: c.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: c.tint }]}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>Save License</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 4, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 4,
  },
  imageRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  imageSlot: {
    flex: 1,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  imagePlaceholderText: { fontSize: 12, fontWeight: "600" },
  imageLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 3,
    alignItems: "center",
  },
  imageLabelText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  mlBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  mlBtnHalf: { flex: 1 },
  processRow: { flexDirection: "row", gap: 8, marginBottom: 0 },
  mlBtnDisabled: { opacity: 0.6 },
  mlBtnText: { fontSize: 15, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600", marginTop: 12, marginBottom: 4 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  segmentRow: { flexDirection: "row", gap: 8 },
  segmentBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  segmentBtnText: { fontWeight: "600", fontSize: 14 },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
    marginHorizontal: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  formActions: { flexDirection: "row", gap: 8, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelBtnText: { fontWeight: "600", fontSize: 15 },
  saveBtn: {
    flex: 2,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
