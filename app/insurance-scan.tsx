import { IconSymbol } from "@/components/ui/icon-symbol";
import { AccentColor, Colors, Radius, Spacing, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { detectAndExtractDocument } from "@/services/firebase/ai-document";
import { useSettingsStore } from "@/store";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Header } from "@/components/ui/header";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function InsuranceScanScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const country = useSettingsStore((s) => s.country);

  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type: "pdf" | "image";
    mimeType: string;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  const handlePickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setSelectedFile({
      uri: asset.uri,
      name: asset.name,
      type: "pdf",
      mimeType: "application/pdf",
    });
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    setSelectedFile({
      uri: asset.uri,
      name: asset.fileName ?? "Insurance document",
      type: "image",
      mimeType: asset.mimeType ?? "image/jpeg",
    });
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setProcessing(true);
    try {
      const result = await detectAndExtractDocument(country, [
        { uri: selectedFile.uri, mimeType: selectedFile.mimeType },
      ]);
      if (result.specType === "insurance_certificate") {
        router.push({
          pathname: "/insurance-review",
          params: {
            label: result.label,
            issuingAuthority: result.issuingAuthority,
            fields: JSON.stringify(result.fields),
            fileUri: selectedFile.uri,
            fileType: selectedFile.type,
          },
        });
      } else {
        // Detected a different document type — hand off to the general review
        router.push({
          pathname: "/scan-review",
          params: {
            category: result.category,
            specType: result.specType,
            label: result.label,
            issuingAuthority: result.issuingAuthority,
            fields: JSON.stringify(result.fields),
            imageUri: selectedFile.uri,
          },
        });
      }
    } catch (e: any) {
      Alert.alert("Processing Error", String(e?.message ?? e));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <Header title="Scan Insurance Document" onBack={() => router.back()} />

      <View style={styles.body}>
        {/* Icon */}
        <View style={styles.iconWrapper}>
          <IconSymbol name="shield.fill" size={42} color={AccentColor} />
        </View>

        <Text style={[styles.headline, { color: c.text }]}>
          Insurance Certificate
        </Text>
        <Text style={[styles.subtitle, { color: c.subtext }]}>
          Import a PDF or photo of your insurance certificate to extract the
          policy details automatically.
        </Text>

        {/* File selected indicator */}
        {selectedFile && (
          <View
            style={[
              styles.fileChip,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <IconSymbol
              name={selectedFile.type === "pdf" ? "doc.fill" : "photo.fill"}
              size={16}
              color={c.tint}
            />
            <Text
              style={[styles.fileName, { color: c.text }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {selectedFile.name}
            </Text>
            <TouchableOpacity onPress={() => setSelectedFile(null)}>
              <IconSymbol
                name="xmark.circle.fill"
                size={16}
                color={c.subtext}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Picker buttons */}
        {!selectedFile && (
          <View style={styles.pickerRow}>
            <TouchableOpacity
              style={[
                styles.pickerBtn,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
              onPress={handlePickPdf}
            >
              <IconSymbol name="doc.fill" size={28} color={AccentColor} />
              <Text style={[styles.pickerBtnLabel, { color: c.text }]}>
                Choose PDF
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pickerBtn,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
              onPress={handlePickImage}
            >
              <IconSymbol name="photo.fill" size={28} color={c.tint} />
              <Text style={[styles.pickerBtnLabel, { color: c.text }]}>
                Use Photo
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Change selection */}
        {selectedFile && (
          <View style={styles.pickerRow}>
            <TouchableOpacity
              style={[
                styles.pickerBtnSmall,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
              onPress={handlePickPdf}
            >
              <IconSymbol name="doc.fill" size={18} color={AccentColor} />
              <Text style={[styles.pickerBtnLabelSm, { color: c.text }]}>
                PDF
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.pickerBtnSmall,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
              onPress={handlePickImage}
            >
              <IconSymbol name="photo.fill" size={18} color={c.tint} />
              <Text style={[styles.pickerBtnLabelSm, { color: c.text }]}>
                Photo
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Process button */}
      <View style={[styles.footer, { borderTopColor: c.border }]}>
        <TouchableOpacity
          style={[
            styles.processBtn,
            { backgroundColor: selectedFile ? c.tint : c.border },
          ]}
          onPress={handleProcess}
          disabled={!selectedFile || processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.processBtnText}>Extract Insurance Info</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.section,
    gap: Spacing.stackGap,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: Radius.tileLg,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  headline: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  subtitle: {
    ...Type.body,
    textAlign: "center",
    marginBottom: 8,
  },
  fileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1,
    maxWidth: "100%",
  },
  fileName: { flex: 1, ...Type.body, fontWeight: "600" },
  pickerRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  pickerBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    borderRadius: Radius.surface,
    borderWidth: 1,
    gap: 8,
  },
  pickerBtnLabel: { ...Type.body, fontWeight: "700" },
  pickerBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    borderWidth: 1,
    gap: 6,
  },
  pickerBtnLabelSm: { ...Type.body, fontWeight: "600" },
  footer: { padding: Spacing.page, borderTopWidth: StyleSheet.hairlineWidth },
  processBtn: {
    borderRadius: Radius.pill,
    paddingVertical: 15,
    alignItems: "center",
  },
  processBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
