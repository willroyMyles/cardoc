import {
  DocumentSource,
  DocumentSourceSheet,
} from "@/components/documents/document-source-sheet";
import { Header } from "@/components/ui/header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AccentColor, Colors, Radius, Spacing, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddVehicleScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const [scannerSheetVisible, setScannerSheetVisible] = useState(true);

  function handleScannerSource(source: DocumentSource) {
    setScannerSheetVisible(false);
    router.push({
      pathname: "/scan",
      params: { source },
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <Header title="Add Vehicle" onBack={() => router.back()} />

      <View style={styles.content}>
        <View
          style={[
            styles.prompt,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <View style={styles.iconTile}>
            <IconSymbol
              name="doc.text.viewfinder"
              size={28}
              color={AccentColor}
            />
          </View>
          <Text style={[styles.title, { color: c.text }]}>
            Scan the vehicle document
          </Text>
          <Text style={[styles.subtitle, { color: c.subtext }]}>
            Vehicles are added by scanning or uploading their registration,
            insurance, inspection, or title document.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: c.tint }]}
            onPress={() => setScannerSheetVisible(true)}
            activeOpacity={0.85}
          >
            <IconSymbol name="camera.fill" size={16} color="#fff" />
            <Text style={styles.buttonText}>Choose Source</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DocumentSourceSheet
        visible={scannerSheetVisible}
        title="Add vehicle"
        subtitle="Choose the accompanying document source."
        options={[
          { source: "camera", label: "Scan Document" },
          { source: "gallery", label: "Choose from Gallery" },
          { source: "files", label: "Choose File" },
        ]}
        onClose={() => setScannerSheetVisible(false)}
        onSelect={handleScannerSource}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.page,
  },
  prompt: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  iconTile: {
    width: 58,
    height: 58,
    borderRadius: Radius.tileLg,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...Type.title,
    marginTop: 4,
    textAlign: "center",
  },
  subtitle: {
    ...Type.body,
    textAlign: "center",
    maxWidth: 280,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
