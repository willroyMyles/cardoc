import { LicenseCard } from "@/components/license/license-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Header } from "@/components/ui/header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DynamicDriverLicense } from "@/models";
import {
  getDriverLicenseSpec,
  type DriverLicenseSpec,
} from "@/services/docs-registry";
import { uriToInlineDataPart } from "@/services/firebase/ai-document";
import { extractLicenseFieldsFromParts } from "@/services/firebase/ai-license";
import { useLicenseStore, useSettingsStore } from "@/store";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { InlineDataPart } from "@react-native-firebase/ai";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
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

function getFileNameFromUri(uri: string) {
  return uri.split("/").pop() ?? uri;
}

function isImageMimeType(mime?: string) {
  return !!mime?.startsWith("image/");
}

function isImageUri(uri: string) {
  return /\.(jpe?g|png|webp|gif)$/i.test(uri.split("?")[0]);
}

export default function LicenseScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { license, setLicense, deleteLicense } = useLicenseStore();
  const country = useSettingsStore((s) => s.country);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [selectedImageSide, setSelectedImageSide] = useState<"front" | "back" | null>(null);
  const snapPoints = useMemo(() => ["45%"], []);
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
  const [frontMimeType, setFrontMimeType] = useState<string | undefined>(
    license?.imageMimeTypeFront,
  );
  const [backMimeType, setBackMimeType] = useState<string | undefined>(
    license?.imageMimeTypeBack,
  );
  const [frontPart, setFrontPart] = useState<InlineDataPart | null>(null);
  const [backPart, setBackPart] = useState<InlineDataPart | null>(null);
  const [frontConverting, setFrontConverting] = useState(false);
  const [backConverting, setBackConverting] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  function setFrontImage(uri: string, mimeType?: string) {
    setFrontUri(uri);
    setFrontMimeType(mimeType);
    setFrontPart(null);
    setFrontConverting(true);
    uriToInlineDataPart(uri, mimeType)
      .then((p) => {
        setFrontPart(p);
        setFrontConverting(false);
      })
      .catch(() => setFrontConverting(false));
  }

  function setBackImage(uri: string, mimeType?: string) {
    setBackUri(uri);
    setBackMimeType(mimeType);
    setBackPart(null);
    setBackConverting(true);
    uriToInlineDataPart(uri, mimeType)
      .then((p) => {
        setBackPart(p);
        setBackConverting(false);
      })
      .catch(() => setBackConverting(false));
  }
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      const mimeType =
        result.assets[0].type === "image"
          ? "image/jpeg"
          : result.assets[0].type ?? "image/jpeg";
      if (side === "front") setFrontImage(result.assets[0].uri, mimeType);
      else setBackImage(result.assets[0].uri, mimeType);
    }
  }

  async function pickFile(side: "front" | "back") {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (side === "front") setFrontImage(asset.uri, asset.mimeType ?? undefined);
    else setBackImage(asset.uri, asset.mimeType ?? undefined);
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
      if (side === "front") setFrontImage(result.assets[0].uri);
      else setBackImage(result.assets[0].uri);
    }
  }

  const showImageOptions = useCallback((side: "front" | "back") => {
    setSelectedImageSide(side);
    bottomSheetModalRef.current?.present();
  }, []);

  const handleImageOption = useCallback(
    async (action: "camera" | "library" | "file") => {
      const side = selectedImageSide;
      if (!side) return;
      bottomSheetModalRef.current?.dismiss();
      if (action === "camera") await captureImage(side);
      if (action === "library") await pickImage(side);
      if (action === "file") await pickFile(side);
      setSelectedImageSide(null);
    },
    [selectedImageSide],
  );

  async function handleProcessWithAI() {
    if (!frontUri && !backUri) {
      Alert.alert("No Images", "Add at least one image to process.");
      return;
    }
    setAiProcessing(true);
    try {
      // Use pre-converted parts when available for faster processing
      const parts: InlineDataPart[] = [];
      if (frontUri)
        parts.push(frontPart ?? (await uriToInlineDataPart(frontUri)));
      if (backUri) parts.push(backPart ?? (await uriToInlineDataPart(backUri)));
      const parsed = await extractLicenseFieldsFromParts(country, parts);
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

  const isFormFilled = Object.entries(spec.fields).every(
    ([key, fieldSpec]) => !fieldSpec.required || Boolean(fields[key]),
  );

  function handleSave() {
    if (!frontUri && !backUri) {
      Alert.alert(
        "No License Images",
        "Please add at least one license photo or file before saving.",
      );
      return;
    }

    if (!isFormFilled) {
      Alert.alert(
        "Incomplete Form",
        "Please fill all required license fields before saving.",
      );
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
      imageMimeTypeFront: frontMimeType,
      imageMimeTypeBack: backMimeType,
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
    setFrontMimeType(undefined);
    setBackMimeType(undefined);
    setFields(initFields(spec, null));
  }

  if (!editing && license) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.background }]}
      >
        <Header title="Driver's License" onBack={() => router.back()} />
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
      <Header title="Driver's License" onBack={() => router.back()} />
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
            onPress={() =>
              frontUri
                ? isImageMimeType(frontMimeType) || isImageUri(frontUri)
                  ? setViewerUri(frontUri)
                  : Alert.alert(
                      "Cannot preview",
                      "This file cannot be previewed here. Tap the camera icon to replace it or save it for later.",
                    )
                : showImageOptions("front")
            }
            activeOpacity={0.7}
          >
            {frontUri && (isImageMimeType(frontMimeType) || isImageUri(frontUri)) ? (
              <Image
                source={{ uri: frontUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            ) : frontUri ? (
              <View style={styles.filePreview}>
                <IconSymbol name="doc.text" size={28} color={c.subtext} />
                <Text style={[styles.filePreviewText, { color: c.subtext }]}> 
                  {getFileNameFromUri(frontUri)}
                </Text>
              </View>
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
            {frontConverting && (
              <View style={styles.imageConvertingOverlay}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            )}
            {frontUri && (
              <TouchableOpacity
                style={styles.changeImageBtn}
                onPress={() => showImageOptions("front")}
                hitSlop={4}
              >
                <IconSymbol name="camera.fill" size={14} color="#fff" />
              </TouchableOpacity>
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
            onPress={() =>
              backUri
                ? isImageMimeType(backMimeType) || isImageUri(backUri)
                  ? setViewerUri(backUri)
                  : Alert.alert(
                      "Cannot preview",
                      "This file cannot be previewed here. Tap the camera icon to replace it or save it for later.",
                    )
                : showImageOptions("back")
            }
            activeOpacity={0.7}
          >
            {backUri && (isImageMimeType(backMimeType) || isImageUri(backUri)) ? (
              <Image
                source={{ uri: backUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            ) : backUri ? (
              <View style={styles.filePreview}>
                <IconSymbol name="doc.text" size={28} color={c.subtext} />
                <Text style={[styles.filePreviewText, { color: c.subtext }]}> 
                  {getFileNameFromUri(backUri)}
                </Text>
              </View>
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
            {backConverting && (
              <View style={styles.imageConvertingOverlay}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            )}
            {backUri && (
              <TouchableOpacity
                style={styles.changeImageBtn}
                onPress={() => showImageOptions("back")}
                hitSlop={4}
              >
                <IconSymbol name="camera.fill" size={14} color="#fff" />
              </TouchableOpacity>
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
              (aiProcessing || frontConverting || backConverting) &&
                styles.mlBtnDisabled,
            ]}
            onPress={handleProcessWithAI}
            disabled={
              !frontUri && !backUri || processing || aiProcessing || frontConverting || backConverting
            }
          >
            {aiProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : frontConverting || backConverting ? (
              <ActivityIndicator
                color={frontUri || backUri ? "#fff" : c.subtext}
                size="small"
              />
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
              {aiProcessing
                ? "Processing…"
                : frontConverting || backConverting
                  ? "Preparing…"
                  : frontUri || backUri
                    ? "Continue"
                    : "Continue"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Dynamic Fields ─────────────────────────────────────────── */}
        {Object.values(fields).some(Boolean) ? (
          Object.entries(spec.fields).map(([key, fieldSpec]) => {
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
          })
        ) : (
          <Text style={[styles.hintText, { color: c.subtext }]}> 
            Upload one or two license photos or files, then tap Continue to populate the form.
          </Text>
        )}

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
            style={[
              styles.saveBtn,
              { backgroundColor: c.tint },
              !isFormFilled && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={!isFormFilled}
          >
            <Text style={styles.saveBtnText}>Save License</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ImageViewerModal
        visible={!!viewerUri}
        uri={viewerUri}
        onClose={() => setViewerUri(null)}
      />

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        onDismiss={() => setSelectedImageSide(null)}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: c.text }]}>Choose source</Text>
            <TouchableOpacity
              style={styles.sheetCloseButton}
              onPress={() => bottomSheetModalRef.current?.dismiss()}
            >
              <IconSymbol name="xmark" size={24} color={c.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.sheetButtonRow}>
            <TouchableOpacity
              style={[
                styles.sheetButton,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
              onPress={() => handleImageOption("camera")}
            >
              <IconSymbol name="camera.fill" size={28}  color={c.text} />
              <Text style={[styles.sheetButtonLabel, { color: c.text }]}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sheetButton,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
              onPress={() => handleImageOption("library")}
            >
              <IconSymbol name="photo.fill" size={28} color={c.text} />
              <Text style={[styles.sheetButtonLabel, { color: c.text }]}>Photo Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sheetButton,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
              onPress={() => handleImageOption("file")}
            >
              <IconSymbol name="doc.text.viewfinder" size={28} color={c.text} />
              <Text style={[styles.sheetButtonLabel, { color: c.text }]}>Choose File</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.sheetCancelButton, { backgroundColor: c.border, borderColor: c.border }]}
            onPress={() => bottomSheetModalRef.current?.dismiss()}
          >
            <Text style={[styles.sheetCancelText, { color: c.text }]}>Cancel</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
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
  imageConvertingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  changeImageBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
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
  filePreview: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  filePreviewText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  hintText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  saveBtn: {
    flex: 2,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  bottomSheetContent: {
    padding: 16,
    gap: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 0,
  },
  sheetCloseButton: {
    padding: 8,
    borderRadius: 999,
  },
  sheetButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sheetButton: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  sheetButtonLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  sheetCancelButton: {
    marginTop: 12,
    marginBottom: 20,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
