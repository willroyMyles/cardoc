import { IconSymbol } from "@/components/ui/icon-symbol";
import { Radius } from "@/constants/theme";
import {
  detectAndExtractDocumentFromParts,
  uriToInlineDataPart,
} from "@/services/firebase/ai-document";
import { useSettingsStore } from "@/store";
import { InlineDataPart } from "@react-native-firebase/ai";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as DocumentPicker from "expo-document-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  InteractionManager,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type InputMode = "picker" | "camera" | "preview";

interface CapturedItem {
  id: string;
  uri: string;
  mimeType: string;
  part: InlineDataPart | null;
  converting: boolean;
}

type PickedFile = {
  uri: string;
  mimeType: string;
};

type ImageSize = {
  width: number;
  height: number;
};

type EditorState = {
  item: CapturedItem;
  uri: string;
  mimeType: string;
  sourceSize: ImageSize | null;
  frameSize: ImageSize;
  zoom: number;
  offsetX: number;
  offsetY: number;
  saving: boolean;
  rotating: boolean;
};

function makeId() {
  return Math.random().toString(36).slice(2);
}

function makeCapturedItem({ uri, mimeType }: PickedFile): CapturedItem {
  return {
    id: makeId(),
    uri,
    mimeType,
    part: null,
    converting: true,
  };
}

function parsePickedFiles(value: string | string[] | undefined): PickedFile[] {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return [];

  try {
    const files = JSON.parse(raw);
    if (!Array.isArray(files)) return [];

    return files.filter(
      (file): file is PickedFile =>
        typeof file?.uri === "string" &&
        typeof file?.mimeType === "string",
    );
  } catch {
    return [];
  }
}

function waitForPickerPresentation() {
  return new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(resolve, 150);
    });
  });
}

function isEditableImage(item: PickedFile) {
  return item.mimeType.startsWith("image/");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getCropRect(
  sourceSize: ImageSize,
  frameSize: ImageSize,
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const baseScale = Math.max(
    frameSize.width / sourceSize.width,
    frameSize.height / sourceSize.height,
  );
  const displayScale = baseScale * zoom;
  const displayWidth = sourceSize.width * displayScale;
  const displayHeight = sourceSize.height * displayScale;
  const maxOffsetX = Math.max(0, (displayWidth - frameSize.width) / 2);
  const maxOffsetY = Math.max(0, (displayHeight - frameSize.height) / 2);
  const clampedOffsetX = clamp(offsetX, -maxOffsetX, maxOffsetX);
  const clampedOffsetY = clamp(offsetY, -maxOffsetY, maxOffsetY);

  const originX = clamp(
    (displayWidth - frameSize.width) / 2 - clampedOffsetX,
    0,
    Math.max(0, displayWidth - frameSize.width),
  );
  const originY = clamp(
    (displayHeight - frameSize.height) / 2 - clampedOffsetY,
    0,
    Math.max(0, displayHeight - frameSize.height),
  );

  return {
    originX: Math.round(originX / displayScale),
    originY: Math.round(originY / displayScale),
    width: Math.round(frameSize.width / displayScale),
    height: Math.round(frameSize.height / displayScale),
  };
}

export default function ScanScreen() {
  const country = useSettingsStore((s) => s.country);
  const [permission, requestPermission] = useCameraPermissions();
  const params = useLocalSearchParams();
  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const importedFiles = useMemo(
    () => parsePickedFiles(params.files),
    [params.files],
  );
  const isPickerSource = source === "gallery" || source === "files";
  const [mode, setMode] = useState<InputMode>(() =>
    importedFiles.length > 0 ? "preview" : isPickerSource ? "picker" : "camera",
  );
  const [items, setItems] = useState<CapturedItem[]>(() =>
    importedFiles.map(makeCapturedItem),
  );
  const [processing, setProcessing] = useState(false);
  const [pickerTriggered, setPickerTriggered] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const editGesture = useRef({
    distance: 0,
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
  });

  // ── Eagerly convert a URI to InlineDataPart and update state ───────────────
  const startConversion = useCallback(
    (id: string, uri: string, mimeType: string) => {
      uriToInlineDataPart(uri, mimeType)
        .then((part) => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === id && it.uri === uri
                ? { ...it, part, converting: false }
                : it,
            ),
          );
        })
        .catch(() => {
          // Fallback: keep converting=false so the item is still usable via URI
          setItems((prev) =>
            prev.map((it) =>
              it.id === id && it.uri === uri
                ? { ...it, converting: false }
                : it,
            ),
          );
        });
    },
    [],
  );

  const clampEditorTransform = useCallback(
    (
      next: EditorState,
      zoom = next.zoom,
      offsetX = next.offsetX,
      offsetY = next.offsetY,
    ) => {
      const clampedZoom = clamp(zoom, 1, 4);
      if (!next.sourceSize || !next.frameSize.width || !next.frameSize.height) {
        return {
          zoom: clampedZoom,
          offsetX,
          offsetY,
        };
      }

      const baseScale = Math.max(
        next.frameSize.width / next.sourceSize.width,
        next.frameSize.height / next.sourceSize.height,
      );
      const displayWidth = next.sourceSize.width * baseScale * clampedZoom;
      const displayHeight = next.sourceSize.height * baseScale * clampedZoom;
      const maxOffsetX = Math.max(0, (displayWidth - next.frameSize.width) / 2);
      const maxOffsetY = Math.max(0, (displayHeight - next.frameSize.height) / 2);

      return {
        zoom: clampedZoom,
        offsetX: clamp(offsetX, -maxOffsetX, maxOffsetX),
        offsetY: clamp(offsetY, -maxOffsetY, maxOffsetY),
      };
    },
    [],
  );

  const editorPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const touches = event.nativeEvent.touches;
          editGesture.current.offsetX = editor?.offsetX ?? 0;
          editGesture.current.offsetY = editor?.offsetY ?? 0;
          editGesture.current.zoom = editor?.zoom ?? 1;
          editGesture.current.distance =
            touches.length >= 2
              ? Math.hypot(
                  touches[0].pageX - touches[1].pageX,
                  touches[0].pageY - touches[1].pageY,
                )
              : 0;
        },
        onPanResponderMove: (event, gesture) => {
          const touches = event.nativeEvent.touches;
          setEditor((prev) => {
            if (!prev || prev.saving || prev.rotating) return prev;
            let nextZoom = editGesture.current.zoom;
            if (touches.length >= 2 && editGesture.current.distance > 0) {
              const distance = Math.hypot(
                touches[0].pageX - touches[1].pageX,
                touches[0].pageY - touches[1].pageY,
              );
              nextZoom =
                editGesture.current.zoom *
                (distance / editGesture.current.distance);
            }

            const nextTransform = clampEditorTransform(
              prev,
              nextZoom,
              editGesture.current.offsetX + gesture.dx,
              editGesture.current.offsetY + gesture.dy,
            );
            return { ...prev, ...nextTransform };
          });
        },
      }),
    [clampEditorTransform, editor?.offsetX, editor?.offsetY, editor?.zoom],
  );

  const addItems = useCallback(
    (files: { uri: string; mimeType: string }[]) => {
      const newItems: CapturedItem[] = files.map(makeCapturedItem);
      setItems((prev) => [...prev, ...newItems]);
      newItems.forEach(({ id, uri, mimeType }) =>
        startConversion(id, uri, mimeType),
      );
    },
    [startConversion],
  );

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  const openEditor = useCallback((item: CapturedItem) => {
    if (!isEditableImage(item)) return;
    setEditor({
      item,
      uri: item.uri,
      mimeType: item.mimeType,
      sourceSize: null,
      frameSize: { width: 0, height: 0 },
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      saving: false,
      rotating: false,
    });
    Image.getSize(
      item.uri,
      (width, height) => {
        setEditor((prev) =>
          prev?.item.id === item.id && prev.uri === item.uri
            ? { ...prev, sourceSize: { width, height } }
            : prev,
        );
      },
      () => {
        setEditor((prev) => (prev?.item.id === item.id ? null : prev));
        Alert.alert("Edit Error", "Could not load this image for editing.");
      },
    );
  }, []);

  const handleEditorFrameLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setEditor((prev) => {
        if (!prev) return prev;
        const next = { ...prev, frameSize: { width, height } };
        return { ...next, ...clampEditorTransform(next) };
      });
    },
    [clampEditorTransform],
  );

  const adjustEditorZoom = useCallback(
    (amount: number) => {
      setEditor((prev) => {
        if (!prev || prev.saving || prev.rotating) return prev;
        const next = clampEditorTransform(prev, prev.zoom + amount);
        return { ...prev, ...next };
      });
    },
    [clampEditorTransform],
  );

  const resetEditor = useCallback(() => {
    setEditor((prev) =>
      prev ? { ...prev, zoom: 1, offsetX: 0, offsetY: 0 } : prev,
    );
  }, []);

  const rotateEditor = useCallback(async () => {
    if (!editor || editor.rotating || editor.saving) return;
    setEditor((prev) => (prev ? { ...prev, rotating: true } : prev));
    try {
      const result = await manipulateAsync(
        editor.uri,
        [{ rotate: 90 }],
        { compress: 0.92, format: SaveFormat.JPEG },
      );
      setEditor((prev) => {
        if (!prev || prev.item.id !== editor.item.id) return prev;
        return {
          ...prev,
          uri: result.uri,
          mimeType: "image/jpeg",
          sourceSize: { width: result.width, height: result.height },
          zoom: 1,
          offsetX: 0,
          offsetY: 0,
          rotating: false,
        };
      });
    } catch (e: any) {
      setEditor((prev) => (prev ? { ...prev, rotating: false } : prev));
      Alert.alert("Edit Error", String(e?.message ?? e));
    }
  }, [editor]);

  const saveEditor = useCallback(async () => {
    if (
      !editor ||
      !editor.sourceSize ||
      !editor.frameSize.width ||
      !editor.frameSize.height ||
      editor.saving ||
      editor.rotating
    ) {
      return;
    }
    setEditor((prev) => (prev ? { ...prev, saving: true } : prev));
    try {
      const crop = getCropRect(
        editor.sourceSize,
        editor.frameSize,
        editor.zoom,
        editor.offsetX,
        editor.offsetY,
      );
      const safeCrop = {
        originX: clamp(crop.originX, 0, editor.sourceSize.width - 1),
        originY: clamp(crop.originY, 0, editor.sourceSize.height - 1),
        width: crop.width,
        height: crop.height,
      };
      safeCrop.width = clamp(
        safeCrop.width,
        1,
        editor.sourceSize.width - safeCrop.originX,
      );
      safeCrop.height = clamp(
        safeCrop.height,
        1,
        editor.sourceSize.height - safeCrop.originY,
      );
      const result = await manipulateAsync(
        editor.uri,
        [{ crop: safeCrop }],
        { compress: 0.92, format: SaveFormat.JPEG },
      );

      setItems((prev) =>
        prev.map((it) =>
          it.id === editor.item.id
            ? {
                ...it,
                uri: result.uri,
                mimeType: "image/jpeg",
                part: null,
                converting: true,
              }
            : it,
        ),
      );
      startConversion(editor.item.id, result.uri, "image/jpeg");
      setEditor(null);
    } catch (e: any) {
      setEditor((prev) => (prev ? { ...prev, saving: false } : prev));
      Alert.alert("Edit Error", String(e?.message ?? e));
    }
  }, [editor, startConversion]);

  // ── Open camera ────────────────────────────────────────────────────────────
  const openCamera = useCallback(async () => {
    setMode("camera");
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          "Permission required",
          "Camera access is needed to take a photo.",
        );
        router.back();
        return;
      }
    }
  }, [permission?.granted, requestPermission]);

  // ── Pick multiple photos from library ──────────────────────────────────────
  const handlePickPhoto = useCallback(async () => {
    setMode("picker");
    await waitForPickerPresentation();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: false,
      allowsMultipleSelection: true,
    });
    if (result.canceled || !result.assets?.length) {
      router.back();
      return;
    }
    addItems(
      result.assets.map((a) => ({ uri: a.uri, mimeType: "image/jpeg" })),
    );
    setMode("preview");
  }, [addItems]);

  // ── Pick file (PDF / image) ────────────────────────────────────────────────
  const handlePickFile = useCallback(async () => {
    setMode("picker");
    await waitForPickerPresentation();
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (result.canceled || !result.assets?.length) {
      router.back();
      return;
    }
    addItems(
      result.assets.map((a) => ({
        uri: a.uri,
        mimeType: a.mimeType ?? "image/jpeg",
      })),
    );
    setMode("preview");
  }, [addItems]);

  useEffect(() => {
    if (pickerTriggered) return;
    const runPicker = async () => {
      setPickerTriggered(true);
      if (importedFiles.length > 0) {
        items.forEach(({ id, uri, mimeType }) =>
          startConversion(id, uri, mimeType),
        );
        setMode("preview");
      } else if (source === "gallery") {
        await handlePickPhoto();
      } else if (source === "files") {
        await handlePickFile();
      } else {
        await openCamera();
      }
    };
    runPicker();
  }, [
    importedFiles.length,
    items,
    pickerTriggered,
    source,
    startConversion,
    handlePickFile,
    handlePickPhoto,
    openCamera,
  ]);

  // ── Camera capture (adds to list, stays in camera mode) ───────────────────
  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
      });
      if (!photo?.uri) throw new Error("Could not capture photo");
      addItems([{ uri: photo.uri, mimeType: "image/jpeg" }]);
    } catch (e: any) {
      Alert.alert("Capture Error", String(e?.message ?? e));
    }
  };

  // ── Process all captured items ─────────────────────────────────────────────
  const handleProcess = async () => {
    if (!items.length) return;
    setProcessing(true);
    try {
      // Use pre-converted parts where available; fall back to URI conversion
      const parts: InlineDataPart[] = await Promise.all(
        items.map((it) =>
          it.part
            ? Promise.resolve(it.part)
            : uriToInlineDataPart(it.uri, it.mimeType),
        ),
      );
      const result = await detectAndExtractDocumentFromParts(country, parts);
      router.replace({
        pathname: "/scan-review",
        params: {
          category: result.category,
          specType: result.specType,
          label: result.label,
          issuingAuthority: result.issuingAuthority,
          fields: JSON.stringify(result.fields),
          imageUri: items[0].uri,
          imageUploadCount: String(items.length),
        },
      });
    } catch (e: any) {
      Alert.alert("Processing Error", String(e?.message ?? e));
    } finally {
      setProcessing(false);
    }
  };

  const anyConverting = items.some((it) => it.converting);
  const canProcess = items.length > 0 && !anyConverting && !processing;
  const editorReady =
    !!editor?.sourceSize && !!editor.frameSize.width && !!editor.frameSize.height;
  const editorImageStyle = useMemo(() => {
    if (!editor?.sourceSize || !editor.frameSize.width || !editor.frameSize.height) {
      return null;
    }
    const baseScale = Math.max(
      editor.frameSize.width / editor.sourceSize.width,
      editor.frameSize.height / editor.sourceSize.height,
    );
    const displayScale = baseScale * editor.zoom;
    const displayWidth = editor.sourceSize.width * displayScale;
    const displayHeight = editor.sourceSize.height * displayScale;

    return {
      width: displayWidth,
      height: displayHeight,
      left: (editor.frameSize.width - displayWidth) / 2 + editor.offsetX,
      top: (editor.frameSize.height - displayHeight) / 2 + editor.offsetY,
    };
  }, [editor]);

  const editorModal = (
    <Modal
      visible={!!editor}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setEditor(null)}
    >
      <SafeAreaView style={styles.editorContainer}>
        <StatusBar style="light" />
        <View style={styles.editorTopBar}>
          <TouchableOpacity
            onPress={() => setEditor(null)}
            style={styles.closeBtn}
            disabled={editor?.saving}
          >
            <IconSymbol name="xmark" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.overlayTitle}>Edit Photo</Text>
          <TouchableOpacity
            style={[
              styles.editorSaveBtn,
              (!editorReady || editor?.saving || editor?.rotating) && {
                opacity: 0.55,
              },
            ]}
            onPress={saveEditor}
            disabled={!editorReady || editor?.saving || editor?.rotating}
          >
            {editor?.saving ? (
              <ActivityIndicator color="#111" size="small" />
            ) : (
              <Text style={styles.editorSaveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.editorStage}>
          <View
            style={styles.cropFrame}
            onLayout={handleEditorFrameLayout}
            {...editorPanResponder.panHandlers}
          >
            {editorReady && editorImageStyle ? (
              <Image
                key={editor?.uri}
                source={{ uri: editor?.uri }}
                style={[styles.editorImage, editorImageStyle]}
                resizeMode="stretch"
              />
            ) : (
              <ActivityIndicator color="#fff" size="small" />
            )}
            <View pointerEvents="none" style={styles.cropFrameBorder}>
              <View style={styles.cropGridV} />
              <View style={[styles.cropGridV, { left: "66.66%" }]} />
              <View style={styles.cropGridH} />
              <View style={[styles.cropGridH, { top: "66.66%" }]} />
            </View>
            {(editor?.saving || editor?.rotating) && (
              <View style={styles.editorBusyOverlay}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            )}
          </View>
        </View>

        <View style={styles.editorControls}>
          <View style={styles.zoomRow}>
            <TouchableOpacity
              style={styles.editorIconBtn}
              onPress={() => adjustEditorZoom(-0.2)}
              disabled={!editorReady || editor?.saving || editor?.rotating}
            >
              <IconSymbol name="minus.magnifyingglass" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.zoomTrack}>
              <View
                style={[
                  styles.zoomFill,
                  {
                    width: `${(((editor?.zoom ?? 1) - 1) / 3) * 100}%`,
                  },
                ]}
              />
            </View>
            <TouchableOpacity
              style={styles.editorIconBtn}
              onPress={() => adjustEditorZoom(0.2)}
              disabled={!editorReady || editor?.saving || editor?.rotating}
            >
              <IconSymbol name="plus.magnifyingglass" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.editActionRow}>
            <TouchableOpacity
              style={styles.editActionBtn}
              onPress={rotateEditor}
              disabled={!editorReady || editor?.saving || editor?.rotating}
            >
              <IconSymbol name="arrow.clockwise" size={18} color="#fff" />
              <Text style={styles.editActionText}>Rotate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editActionBtn}
              onPress={resetEditor}
              disabled={!editorReady || editor?.saving || editor?.rotating}
            >
              <IconSymbol name="crop" size={18} color="#fff" />
              <Text style={styles.editActionText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );

  // ── Picker launch state ────────────────────────────────────────────────────
  if (mode === "picker") {
    return (
      <SafeAreaView style={[styles.container, styles.pickerLaunchContainer]}>
        <StatusBar style="light" />
        <ActivityIndicator color="#1A1A1A" size="small" />
      </SafeAreaView>
    );
  }

  // ── Preview state ──────────────────────────────────────────────────────────
  if (mode === "preview") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: "#111" }]}>
        <StatusBar style="light" />
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              setItems([]);
              router.back();
            }}
            style={styles.closeBtn}
          >
            <IconSymbol name="xmark" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.overlayTitle}>
            {items.length} Image{items.length !== 1 ? "s" : ""}
          </Text>
          <TouchableOpacity style={styles.addMoreBtn} onPress={openCamera}>
            <IconSymbol name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Conversion status */}
        {anyConverting && (
          <View style={styles.convertingBanner}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.convertingText}>Preparing images…</Text>
          </View>
        )}

        {/* Thumbnails grid */}
        <ScrollView
          contentContainerStyle={styles.thumbGrid}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.thumbWrapper}
              onPress={() => openEditor(item)}
              activeOpacity={0.85}
              disabled={!isEditableImage(item)}
            >
              <Image
                source={{ uri: item.uri }}
                style={styles.thumb}
                resizeMode="cover"
              />
              {item.converting && (
                <View style={styles.thumbOverlay}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}
              <TouchableOpacity
                style={styles.thumbRemove}
                onPress={() => removeItem(item.id)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <IconSymbol name="xmark.circle.fill" size={22} color="#fff" />
              </TouchableOpacity>
              {isEditableImage(item) && !item.converting && (
                <View pointerEvents="none" style={styles.thumbEditHint}>
                  <IconSymbol name="pencil" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.previewBottomBar}>
          <TouchableOpacity
            style={styles.retakeBtn}
            onPress={openCamera}
            disabled={processing}
          >
            <IconSymbol name="camera.fill" size={16} color="#fff" />
            <Text style={styles.retakeBtnText}>Add More</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.processBtn, !canProcess && { opacity: 0.5 }]}
            onPress={handleProcess}
            disabled={!canProcess}
            activeOpacity={0.85}
          >
            {processing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : anyConverting ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.processBtnText}>Preparing…</Text>
              </>
            ) : (
              <Text style={styles.processBtnText}>Process Document</Text>
            )}
          </TouchableOpacity>
        </View>
        {editorModal}
      </SafeAreaView>
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

      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() =>
              items.length > 0 ? setMode("preview") : router.back()
            }
            style={styles.closeBtn}
          >
            <IconSymbol name="xmark" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.overlayTitle}>Scan Document</Text>
          {items.length > 0 ? (
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setMode("preview")}
            >
              <Text style={styles.doneBtnText}>Done ({items.length})</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 64 }} />
          )}
        </View>

        <View style={styles.frameArea}>
          <View style={styles.frame}>
            <Corner position="topLeft" />
            <Corner position="topRight" />
            <Corner position="bottomLeft" />
            <Corner position="bottomRight" />
          </View>
          <Text style={styles.hint}>
            {items.length === 0
              ? "Position the document within the frame"
              : `${items.length} captured — take more or tap Done`}
          </Text>
        </View>

        {/* Captured thumbnails strip */}
        {items.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cameraThumbs}
            style={styles.cameraThumbsBar}
          >
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.cameraThumb}
                onPress={() => openEditor(item)}
                activeOpacity={0.85}
                disabled={!isEditableImage(item)}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
                {item.converting && (
                  <View style={styles.thumbOverlay}>
                    <ActivityIndicator color="#fff" size="small" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.bottomBar}>
          <View style={{ width: 56 }} />
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
      {editorModal}
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
  pickerLaunchContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    justifyContent: "center",
  },
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
  doneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  frameArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  frame: { width: 300, height: 190, position: "relative" },
  hint: { color: "rgba(255,255,255,0.8)", fontSize: 13, textAlign: "center" },
  cameraThumbsBar: {
    maxHeight: 72,
    marginBottom: 12,
  },
  cameraThumbs: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  cameraThumb: {
    width: 60,
    height: 60,
    borderRadius: Radius.sm,
    overflow: "hidden",
    backgroundColor: "#333",
  },
  bottomBar: {
    paddingBottom: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
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
  // Preview state styles
  convertingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 16,
    borderRadius: Radius.pill,
    marginBottom: 8,
  },
  convertingText: { color: "#fff", fontSize: 13 },
  thumbGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
    paddingBottom: 16,
  },
  thumbWrapper: {
    width: "47%",
    aspectRatio: 1.4,
    borderRadius: Radius.surface,
    overflow: "hidden",
    backgroundColor: "#333",
    position: "relative",
  },
  thumb: { width: "100%", height: "100%" },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 11,
  },
  thumbEditHint: {
    position: "absolute",
    left: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  previewBottomBar: {
    paddingBottom: 40,
    paddingTop: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addMoreBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  retakeBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  processBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: Radius.pill,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
  },
  processBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  editorContainer: {
    flex: 1,
    backgroundColor: "#090909",
  },
  editorTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  editorSaveBtn: {
    minWidth: 68,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  editorSaveText: {
    color: "#111",
    fontSize: 14,
    fontWeight: "800",
  },
  editorStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  cropFrame: {
    width: "100%",
    maxWidth: 520,
    aspectRatio: 1.35,
    overflow: "hidden",
    backgroundColor: "#1C1C1C",
    borderRadius: Radius.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  editorImage: {
    position: "absolute",
  },
  cropFrameBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: Radius.surface,
  },
  cropGridV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "33.33%",
    width: 1,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  cropGridH: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "33.33%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  editorBusyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  editorControls: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 16,
  },
  zoomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  editorIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  zoomTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  zoomFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  editActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  editActionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.09)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  editActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
