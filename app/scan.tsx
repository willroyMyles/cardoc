import { IconSymbol } from "@/components/ui/icon-symbol";
import { recognizeFromUri } from "@/services/ocr/ml-kit";
import { parseDocumentFromText } from "@/services/ocr/parsers/document-parser";
import { parseLicenseByCountry } from "@/services/ocr/parsers/license-parser";
import { useSettingsStore } from "@/store";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ScanScreen() {
  const { mode } = useLocalSearchParams<{ mode?: "license" | "document" }>();
  const country = useSettingsStore((s) => s.country);
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>
          Camera access is required to scan documents.
        </Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 12 }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const processUri = async (uri: string) => {
    setProcessing(true);
    try {
      const textObj = await recognizeFromUri(uri);
      const text = textObj?.text ?? "";

      if (!text || text.trim().length === 0) {
        Alert.alert(
          "No Text Found",
          "Could not detect any text. Try a clearer image with good lighting.",
        );
        return;
      }

      console.log("text", text);

      if (mode === "license") {
        const parsed = parseLicenseByCountry(text, country);
        router.back();
        router.setParams({ scannedLicense: JSON.stringify(parsed ?? {}) });
      } else {
        const parsed = parseDocumentFromText(text);
        router.back();
        router.setParams({ scannedDocument: JSON.stringify(parsed) });
      }
    } catch (e: any) {
      console.log(e);

      const msg = String(e?.message ?? e);
      const isLinkingError =
        msg.includes("dev client") ||
        msg.includes("ML Kit") ||
        msg.includes("not available") ||
        msg.includes("linked") ||
        msg.includes("managed workflow");
      if (isLinkingError) {
        Alert.alert(
          "OCR Not Available",
          "On-device OCR requires an Expo dev build. It does not work in Expo Go.\n\nRun: npx expo run:android  or  npx expo run:ios",
        );
      } else {
        Alert.alert("Scan Error", msg);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handlePickPhoto = async () => {
    if (processing) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    await processUri(result.assets[0].uri);
  };

  const handleCapture = async () => {
    if (!cameraRef.current || processing) return;
    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
      });
      if (!photo?.uri) throw new Error("Could not capture photo");

      await processUri(photo.uri);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      Alert.alert("Capture Error", msg);
      setProcessing(false);
    }
  };

  const label =
    mode === "license"
      ? "Driver's License"
      : mode === "document"
        ? "Document"
        : "Item";

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={"back" as CameraType}
      />

      {/* Overlay frame */}
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
          >
            <IconSymbol name="xmark" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.overlayTitle}>Scan {label}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.frameArea}>
          <View style={styles.frame}>
            <Corner position="topLeft" />
            <Corner position="topRight" />
            <Corner position="bottomLeft" />
            <Corner position="bottomRight" />
          </View>
          <Text style={styles.hint}>
            Position the document within the frame
          </Text>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={handlePickPhoto}
            disabled={processing}
            activeOpacity={0.8}
          >
            <IconSymbol name="photo.on.rectangle" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.captureBtn, processing && styles.captureBtnDisabled]}
            onPress={handleCapture}
            disabled={processing}
            activeOpacity={0.8}
          >
            {processing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>
          <View style={{ width: 56 }} />
        </View>
      </View>
    </View>
  );
}

function Corner({
  position,
}: {
  position: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
}) {
  const isTop = position.startsWith("top");
  const isLeft = position.endsWith("Left");
  return (
    <View
      style={[
        styles.corner,
        isTop ? styles.cornerTop : styles.cornerBottom,
        isLeft ? styles.cornerLeft : styles.cornerRight,
      ]}
    >
      <View
        style={[
          styles.cornerH,
          { [isTop ? "top" : "bottom"]: 0, [isLeft ? "left" : "right"]: 0 },
        ]}
      />
      <View
        style={[
          styles.cornerV,
          { [isTop ? "top" : "bottom"]: 0, [isLeft ? "left" : "right"]: 0 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  overlay: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  frameArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  frame: { width: 300, height: 190, position: "relative" },
  hint: { color: "rgba(255,255,255,0.8)", fontSize: 13, textAlign: "center" },
  bottomBar: {
    paddingBottom: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  uploadBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtnDisabled: { opacity: 0.5 },
  captureInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
  },
  corner: { position: "absolute", width: 24, height: 24 },
  cornerTop: { top: 0 },
  cornerBottom: { bottom: 0 },
  cornerLeft: { left: 0 },
  cornerRight: { right: 0 },
  cornerH: {
    position: "absolute",
    width: 24,
    height: 3,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  cornerV: {
    position: "absolute",
    width: 3,
    height: 24,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    margin: 32,
  },
  permissionBtn: {
    backgroundColor: "#3B82F6",
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 32,
    alignItems: "center",
  },
  permissionBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancelText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    textAlign: "center",
  },
});
