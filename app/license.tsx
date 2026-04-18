import { LicenseCard } from "@/components/license/license-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { JamaicanDriverLicense } from "@/models";
import { recognizeFromUri } from "@/services/ocr/ml-kit";
import { Text as Tex } from "@infinitered/react-native-mlkit-text-recognition";

import { extractLicenseFieldsWithAI } from "@/services/firebase/ai-license";
import {
  isJamaicanLicenseText,
  parseJamaicanLicenseFromText,
  parseLicenseFromText,
} from "@/services/ocr/parsers/license-parser";
import { useLicenseStore } from "@/store";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
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

export default function LicenseScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { license, setLicense, updateLicense, deleteLicense } =
    useLicenseStore();

  const [editing, setEditing] = useState(!license);
  const [showDelete, setShowDelete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  const [frontUri, setFrontUri] = useState(license?.imageUriFront ?? "");
  const [backUri, setBackUri] = useState(license?.imageUriBack ?? "");

  // Base fields
  const [fullName, setFullName] = useState(license?.fullName ?? "");
  const [licenseNumber, setLicenseNumber] = useState(
    license?.licenseNumber ?? "",
  );
  const [dob, setDob] = useState(
    license?.dateOfBirth ? license.dateOfBirth.split("T")[0] : "",
  );
  const [issueDate, setIssueDate] = useState(
    license?.issueDate ? license.issueDate.split("T")[0] : "",
  );
  const [expiryDate, setExpiryDate] = useState(
    license?.expiryDate ? license.expiryDate.split("T")[0] : "",
  );
  const [licenseClass, setLicenseClass] = useState(license?.licenseClass ?? "");
  const [address, setAddress] = useState(license?.address ?? "");

  // Jamaican-specific fields
  const [trn, setTrn] = useState(license?.trn ?? "");
  const [collectorate, setCollectorate] = useState(license?.collectorate ?? "");
  const [sex, setSex] = useState<"M" | "F">(license?.sex ?? "M");
  const [nationality, setNationality] = useState(
    license?.nationality ?? "JAMAICAN",
  );
  const [originalIssueDate, setOriginalIssueDate] = useState(
    license?.originalIssueDate ? license.originalIssueDate.split("T")[0] : "",
  );
  const [licenseDate, setLicenseDate] = useState(
    license?.date ? license.date.split("T")[0] : "",
  );
  const [licenseToDrive, setLicenseToDrive] = useState(
    license?.licenseToDrive ?? "",
  );
  const [controlNumber, setControlNumber] = useState(
    license?.controlNumber ?? "",
  );
  const [judicialEndorsement, setJudicialEndorsement] = useState(
    license?.judicialEndorsement ?? "",
  );

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
        frontUri || undefined,
        backUri || undefined,
      );

      if (parsed.fullName) setFullName(parsed.fullName);
      if (parsed.licenseNumber) setLicenseNumber(parsed.licenseNumber);
      if (parsed.dateOfBirth) setDob(parsed.dateOfBirth.split("T")[0]);
      if (parsed.issueDate) setIssueDate(parsed.issueDate.split("T")[0]);
      if (parsed.expiryDate) setExpiryDate(parsed.expiryDate.split("T")[0]);
      if (parsed.licenseClass) setLicenseClass(parsed.licenseClass);
      if (parsed.address) setAddress(parsed.address);
      if (parsed.trn) setTrn(parsed.trn);
      if (parsed.collectorate) setCollectorate(parsed.collectorate);
      if (parsed.sex) setSex(parsed.sex);
      if (parsed.nationality) setNationality(parsed.nationality);
      if (parsed.originalIssueDate)
        setOriginalIssueDate(parsed.originalIssueDate.split("T")[0]);
      if (parsed.date) setLicenseDate(parsed.date.split("T")[0]);
      if (parsed.licenseToDrive) setLicenseToDrive(parsed.licenseToDrive);
      if (parsed.controlNumber) setControlNumber(parsed.controlNumber);
      if (parsed.judicialEndorsement)
        setJudicialEndorsement(parsed.judicialEndorsement);

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

  async function handleProcessWithMLKit() {
    if (!frontUri && !backUri) {
      Alert.alert("No Images", "Add at least one image to process.");
      return;
    }
    setProcessing(true);
    try {
      let frontInfo: Tex | null = null;
      let backInfo: Tex | null = null;
      if (frontUri) frontInfo = await recognizeFromUri(frontUri);
      if (backUri) backInfo = await recognizeFromUri(backUri);
      const combined = "" + frontInfo?.text + backInfo?.text + "";

      if (!combined.trim()) {
        Alert.alert(
          "No Text Found",
          "Could not detect text. Try clearer images with good lighting.",
        );
        return;
      }

      let parsed: Partial<JamaicanDriverLicense>;
      if (isJamaicanLicenseText(combined)) {
        parsed = parseJamaicanLicenseFromText(combined);
      } else {
        parsed = parseLicenseFromText(combined);
      }

      if (parsed.fullName) setFullName(parsed.fullName);
      if (parsed.licenseNumber) setLicenseNumber(parsed.licenseNumber);
      if (parsed.dateOfBirth) setDob(parsed.dateOfBirth.split("T")[0]);
      if (parsed.issueDate) setIssueDate(parsed.issueDate.split("T")[0]);
      if (parsed.expiryDate) setExpiryDate(parsed.expiryDate.split("T")[0]);
      if (parsed.licenseClass) setLicenseClass(parsed.licenseClass);
      if (parsed.address) setAddress(parsed.address);
      // Jamaican-specific
      const jam = parsed as Partial<JamaicanDriverLicense>;
      if (jam.trn) setTrn(jam.trn);
      if (jam.collectorate) setCollectorate(jam.collectorate);
      if (jam.sex) setSex(jam.sex);
      if (jam.nationality) setNationality(jam.nationality);
      if (jam.originalIssueDate)
        setOriginalIssueDate(jam.originalIssueDate.split("T")[0]);
      if (jam.date) setLicenseDate(jam.date.split("T")[0]);
      if (jam.licenseToDrive) setLicenseToDrive(jam.licenseToDrive);
      if (jam.controlNumber) setControlNumber(jam.controlNumber);
      if (jam.judicialEndorsement)
        setJudicialEndorsement(jam.judicialEndorsement);

      Alert.alert(
        "Done",
        "Fields filled from scan. Please review and correct any errors.",
      );
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (
        msg.includes("ML Kit") ||
        msg.includes("not available") ||
        msg.includes("Expo development build")
      ) {
        Alert.alert(
          "OCR Not Available",
          "On-device OCR requires an Expo dev build and cannot run in Expo Go.\n\nRun: npx expo run:ios  or  npx expo run:android",
        );
      } else {
        Alert.alert("Processing Error", msg);
      }
    } finally {
      setProcessing(false);
    }
  }

  function handleSave() {
    if (!fullName || !licenseNumber || !expiryDate) {
      Alert.alert(
        "Missing Fields",
        "Full name, license number, and expiry date are required.",
      );
      return;
    }
    const data: JamaicanDriverLicense = {
      id: license?.id ?? generateId(),
      fullName,
      licenseNumber,
      dateOfBirth: dob ? new Date(dob).toISOString() : "",
      issueDate: issueDate ? new Date(issueDate).toISOString() : "",
      expiryDate: new Date(expiryDate).toISOString(),
      licenseClass,
      address,
      issuingRegion: "Jamaica",
      issuingAuthority: "Government of Jamaica",
      imageUriFront: frontUri || undefined,
      imageUriBack: backUri || undefined,
      createdAt: license?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Jamaican-specific
      trn,
      collectorate,
      sex,
      nationality,
      originalIssueDate: originalIssueDate
        ? new Date(originalIssueDate).toISOString()
        : "",
      date: licenseDate ? new Date(licenseDate).toISOString() : undefined,
      licenseToDrive: licenseToDrive || undefined,
      controlNumber,
      judicialEndorsement: judicialEndorsement || undefined,
    };
    setLicense(data);
    setEditing(false);
  }

  function handleDelete() {
    deleteLicense();
    setEditing(true);
    setFrontUri("");
    setBackUri("");
    setFullName("");
    setLicenseNumber("");
    setDob("");
    setIssueDate("");
    setExpiryDate("");
    setLicenseClass("");
    setAddress("");
    setTrn("");
    setCollectorate("");
    setSex("M");
    setNationality("JAMAICAN");
    setOriginalIssueDate("");
    setLicenseDate("");
    setLicenseToDrive("");
    setControlNumber("");
    setJudicialEndorsement("");
  }

  if (!editing && license) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.background }]}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <LicenseCard license={license} />

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.tint }]}
              onPress={() => {
                setFrontUri(license.imageUriFront ?? "");
                setBackUri(license.imageUriBack ?? "");
                setFullName(license.fullName);
                setLicenseNumber(license.licenseNumber);
                setDob(license.dateOfBirth?.split("T")[0] ?? "");
                setIssueDate(license.issueDate?.split("T")[0] ?? "");
                setExpiryDate(license.expiryDate?.split("T")[0] ?? "");
                setLicenseClass(license.licenseClass);
                setAddress(license.address ?? "");
                setTrn(license.trn ?? "");
                setCollectorate(license.collectorate ?? "");
                setSex(license.sex ?? "M");
                setNationality(license.nationality ?? "JAMAICAN");
                setOriginalIssueDate(
                  license.originalIssueDate?.split("T")[0] ?? "",
                );
                setLicenseDate(license.date?.split("T")[0] ?? "");
                setLicenseToDrive(license.licenseToDrive ?? "");
                setControlNumber(license.controlNumber ?? "");
                setJudicialEndorsement(license.judicialEndorsement ?? "");
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
          <TouchableOpacity
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
          </TouchableOpacity>

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

        <Text style={labelStyle}>Full Name *</Text>
        <TextInput
          style={inputStyle}
          value={fullName}
          onChangeText={setFullName}
          placeholder="John Doe"
          placeholderTextColor={c.subtext}
        />

        <Text style={labelStyle}>License Number *</Text>
        <TextInput
          style={inputStyle}
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          placeholder="e.g. 1234567"
          placeholderTextColor={c.subtext}
          autoCapitalize="characters"
          keyboardType="numbers-and-punctuation"
        />

        <Text style={labelStyle}>TRN (Tax Registration Number)</Text>
        <TextInput
          style={inputStyle}
          value={trn}
          onChangeText={setTrn}
          placeholder="e.g. 118405977"
          placeholderTextColor={c.subtext}
          keyboardType="number-pad"
        />

        <Text style={labelStyle}>Date of Birth (YYYY-MM-DD)</Text>
        <TextInput
          style={inputStyle}
          value={dob}
          onChangeText={setDob}
          placeholder="1990-06-15"
          placeholderTextColor={c.subtext}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={labelStyle}>Sex</Text>
        <View style={styles.segmentRow}>
          {(["M", "F"] as const).map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.segmentBtn,
                { borderColor: c.border, backgroundColor: c.card },
                sex === val && { backgroundColor: c.tint, borderColor: c.tint },
              ]}
              onPress={() => setSex(val)}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  { color: c.subtext },
                  sex === val && { color: "#fff" },
                ]}
              >
                {val === "M" ? "Male" : "Female"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={labelStyle}>Address</Text>
        <TextInput
          style={[inputStyle, styles.textArea]}
          value={address}
          onChangeText={setAddress}
          placeholder="Your registered address"
          placeholderTextColor={c.subtext}
          multiline
          numberOfLines={2}
        />

        <Text style={labelStyle}>Date Issued (YYYY-MM-DD)</Text>
        <TextInput
          style={inputStyle}
          value={issueDate}
          onChangeText={setIssueDate}
          placeholder="2020-01-01"
          placeholderTextColor={c.subtext}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={labelStyle}>Expiry Date * (YYYY-MM-DD)</Text>
        <TextInput
          style={inputStyle}
          value={expiryDate}
          onChangeText={setExpiryDate}
          placeholder="2028-01-01"
          placeholderTextColor={c.subtext}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={labelStyle}>Original Issue Date (YYYY-MM-DD)</Text>
        <TextInput
          style={inputStyle}
          value={originalIssueDate}
          onChangeText={setOriginalIssueDate}
          placeholder="2015-01-01"
          placeholderTextColor={c.subtext}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={labelStyle}>Date (YYYY-MM-DD)</Text>
        <TextInput
          style={inputStyle}
          value={licenseDate}
          onChangeText={setLicenseDate}
          placeholder="2023-08-17"
          placeholderTextColor={c.subtext}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={labelStyle}>Class</Text>
        <TextInput
          style={inputStyle}
          value={licenseClass}
          onChangeText={setLicenseClass}
          placeholder="e.g. B"
          placeholderTextColor={c.subtext}
          autoCapitalize="characters"
        />

        <Text style={labelStyle}>License to Drive</Text>
        <TextInput
          style={[inputStyle, styles.textArea]}
          value={licenseToDrive}
          onChangeText={setLicenseToDrive}
          placeholder="e.g. PVT M/CRS & TRCKS N/E 3000KGS L/W"
          placeholderTextColor={c.subtext}
          multiline
          numberOfLines={2}
          autoCapitalize="characters"
        />

        <Text style={labelStyle}>Collectorate</Text>
        <TextInput
          style={inputStyle}
          value={collectorate}
          onChangeText={setCollectorate}
          placeholder="e.g. 021 OLD HARBOUR"
          placeholderTextColor={c.subtext}
          autoCapitalize="characters"
        />

        <Text style={labelStyle}>Nationality</Text>
        <TextInput
          style={inputStyle}
          value={nationality}
          onChangeText={setNationality}
          placeholder="JAMAICAN"
          placeholderTextColor={c.subtext}
          autoCapitalize="characters"
        />

        <Text style={labelStyle}>Control Number</Text>
        <TextInput
          style={inputStyle}
          value={controlNumber}
          onChangeText={setControlNumber}
          placeholder="e.g. 00123456"
          placeholderTextColor={c.subtext}
          autoCapitalize="characters"
        />

        <Text style={labelStyle}>Judicial Endorsement</Text>
        <TextInput
          style={[inputStyle, styles.textArea]}
          value={judicialEndorsement}
          onChangeText={setJudicialEndorsement}
          placeholder="e.g. None"
          placeholderTextColor={c.subtext}
          multiline
          numberOfLines={2}
        />

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
  textArea: { height: 64, textAlignVertical: "top" },
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
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  scanBtnText: { fontSize: 15, fontWeight: "600" },
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
