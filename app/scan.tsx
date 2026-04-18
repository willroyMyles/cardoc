import { IconSymbol } from "@/components/ui/icon-symbol";
import { detectAndExtractDocument } from "@/services/firebase/ai-document";
import { useSettingsStore } from "@/store";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ScanScreen() {
  const country = useSettingsStore((s) => s.country);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
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

  const handleProcess = async () => {
    if (!capturedUri) return;
    setProcessing(true);
    try {
      const result = await detectAndExtractDocument(country, [capturedUri]);
      router.replace({
        pathname: "/scan-review",
        params: {
          category: result.category,
          specType: result.specType,
          label: result.label,
          issuingAuthority: result.issuingAuthority,
          fields: JSON.stringify(result.fields),
          imageUri: capturedUri,
        },
      });
    } catch (e: any) {
      Alert.alert("Processing Error", String(e?.message ?? e));
    } finally {
      setProcessing(false);
    }
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setCapturedUri(result.assets[0].uri);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
      });
      if (!photo?.uri) throw new Error("Could not capture photo");
      setCapturedUri(photo.uri);
    } catch (e: any) {
      Alert.alert("Capture Error", String(e?.message ?? e));
    }
  };

  // ── Preview state ──────────────────────────────────────────────────────────
  if (capturedUri) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Image
          source={{ uri: capturedUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => setCapturedUri(null)}
              style={styles.closeBtn}
            >
              <IconSymbol name="xmark" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.overlayTitle}>Review Image</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={{ flex: 1 }} />

          <View style={styles.previewBottomBar}>
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => setCapturedUri(null)}
              disabled={processing}
            >
              <Text style={styles.retakeBtnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.processBtn, processing && { opacity: 0.6 }]}
              onPress={handleProcess}
              disabled={processing}
              activeOpacity={0.85}
            >
              {processing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.processBtnText}>Process Document</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── Camera state ───────────────────────────────────────────────────────────
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
          <Text style={styles.overlayTitle}>Scan Document</Text>
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
            style={styles.captureBtn}
            onPress={handleCapture}
            activeOpacity={0.8}
          >
            <View style={styles.captureInner} />
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
  // Preview state styles
  previewBottomBar: {
    paddingBottom: 60,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
  },
  retakeBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  processBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1A6FE8",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  processBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
