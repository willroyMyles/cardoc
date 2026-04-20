import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { detectAndExtractDocument } from "@/services/firebase/ai-document";
import { useSettingsStore } from "@/store";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={20} color={c.tint} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]}>
          Scan Insurance Document
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>
        {/* Icon */}
        <View style={[styles.iconWrapper, { backgroundColor: "#EDE9FE" }]}>
          <IconSymbol name="shield.fill" size={48} color="#8B5CF6" />
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
              <IconSymbol name="doc.fill" size={28} color="#8B5CF6" />
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
              <IconSymbol name="doc.fill" size={18} color="#8B5CF6" />
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
            { backgroundColor: selectedFile ? "#8B5CF6" : c.border },
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 36, alignItems: "flex-start" },
  title: { fontSize: 17, fontWeight: "600" },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  headline: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  fileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: "100%",
  },
  fileName: { flex: 1, fontSize: 14, fontWeight: "500" },
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
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  pickerBtnLabel: { fontSize: 14, fontWeight: "600" },
  pickerBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  pickerBtnLabelSm: { fontSize: 13, fontWeight: "500" },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  processBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  processBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
