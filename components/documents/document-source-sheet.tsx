import { IconSymbol } from "@/components/ui/icon-symbol";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Colors, Radius, Spacing, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { haptics } from "@/services/haptics";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

export type DocumentSource = "camera" | "gallery" | "files";

type SourceOption = {
  source: DocumentSource;
  label?: string;
  description?: string;
};

type DocumentSourceSheetProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: SourceOption[];
  onClose: () => void;
  onSelect: (source: DocumentSource) => void;
};

const SOURCE_META: Record<
  DocumentSource,
  { label: string; description: string; icon: React.ComponentProps<typeof IconSymbol>["name"] }
> = {
  camera: {
    label: "Camera",
    description: "Scan with the live camera",
    icon: "camera.fill",
  },
  gallery: {
    label: Platform.OS === "ios" ? "Photos" : "Gallery",
    description: "Choose document photos",
    icon: "photo.fill",
  },
  files: {
    label: "Files",
    description: "Import PDFs or images",
    icon: "doc.text.viewfinder",
  },
};

export function DocumentSourceSheet({
  visible,
  title,
  subtitle,
  options,
  onClose,
  onSelect,
}: DocumentSourceSheetProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const pendingSourceRef = useRef<DocumentSource | null>(null);
  const wasVisibleRef = useRef(false);
  const isTwoOptionLayout = options.length === 2;
  const snapPoints = useMemo(
    () => [options.length > 2 ? "44%" : isTwoOptionLayout ? "40%" : "34%"],
    [isTwoOptionLayout, options.length],
  );

  useEffect(() => {
    if (visible) {
      wasVisibleRef.current = true;
      const frame = requestAnimationFrame(() => {
        bottomSheetModalRef.current?.present();
      });

      return () => cancelAnimationFrame(frame);
    }

    if (wasVisibleRef.current) {
      wasVisibleRef.current = false;
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleDismiss = useCallback(() => {
    const selectedSource = pendingSourceRef.current;
    pendingSourceRef.current = null;
    onClose();

    if (selectedSource) {
      onSelect(selectedSource);
    }
  }, [onClose, onSelect]);

  function handleSelect(source: DocumentSource) {
    pendingSourceRef.current = source;
    void haptics.selection();
    bottomSheetModalRef.current?.dismiss();
  }

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      backgroundStyle={{ backgroundColor: c.card }}
      handleIndicatorStyle={{ backgroundColor: c.border }}
    >
      <BottomSheetView style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: c.text }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: c.subtext }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <AnimatedPressable
            style={[styles.closeButton, { borderColor: c.border }]}
            onPress={() => bottomSheetModalRef.current?.dismiss()}
            pressedScale={0.92}
          >
            <IconSymbol name="xmark" size={18} color={c.text} />
          </AnimatedPressable>
        </View>

        <View
          style={[styles.options, isTwoOptionLayout && styles.optionsHorizontal]}
        >
          {options.map((option) => {
            const meta = SOURCE_META[option.source];
            return (
              <AnimatedPressable
                key={option.source}
                style={[
                  styles.option,
                  isTwoOptionLayout && styles.optionHorizontal,
                  { backgroundColor: c.background, borderColor: c.border },
                ]}
                onPress={() => handleSelect(option.source)}
                pressedScale={0.98}
              >
                <View style={[styles.optionIcon, { backgroundColor: c.tint }]}>
                  <IconSymbol name={meta.icon} size={22} color="#fff" />
                </View>
                <View
                  style={[
                    styles.optionCopy,
                    isTwoOptionLayout && styles.optionCopyHorizontal,
                  ]}
                >
                  <Text style={[styles.optionLabel, { color: c.text }]}>
                    {option.label ?? meta.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      isTwoOptionLayout && styles.optionDescriptionHorizontal,
                      { color: c.subtext },
                    ]}
                  >
                    {option.description ?? meta.description}
                  </Text>
                </View>
                {isTwoOptionLayout ? null : (
                  <IconSymbol name="chevron.right" size={18} color={c.subtext} />
                )}
              </AnimatedPressable>
            );
          })}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: Spacing.page,
    paddingBottom: 24,
    gap: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingTop: 4,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  title: {
    ...Type.title,
  },
  subtitle: {
    ...Type.body,
    lineHeight: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  options: {
    gap: 10,
  },
  optionsHorizontal: {
    flexDirection: "row",
  },
  option: {
    minHeight: 72,
    borderRadius: Radius.surface,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionHorizontal: {
    flex: 1,
    minHeight: 126,
    flexDirection: "column",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 10,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.tile,
    alignItems: "center",
    justifyContent: "center",
  },
  optionCopy: {
    flex: 1,
    gap: 4,
  },
  optionCopyHorizontal: {
    flex: 0,
    alignItems: "center",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  optionDescriptionHorizontal: {
    textAlign: "center",
  },
});
