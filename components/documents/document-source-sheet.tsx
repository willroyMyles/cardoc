import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Spacing, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
    label: "Gallery",
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
  const snapPoints = useMemo(
    () => [options.length > 2 ? "44%" : "34%"],
    [options.length],
  );

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
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

  function handleSelect(source: DocumentSource) {
    bottomSheetModalRef.current?.dismiss();
    onSelect(source);
  }

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
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
          <TouchableOpacity
            style={[styles.closeButton, { borderColor: c.border }]}
            onPress={() => bottomSheetModalRef.current?.dismiss()}
            activeOpacity={0.75}
          >
            <IconSymbol name="xmark" size={18} color={c.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.options}>
          {options.map((option) => {
            const meta = SOURCE_META[option.source];
            return (
              <TouchableOpacity
                key={option.source}
                style={[
                  styles.option,
                  { backgroundColor: c.background, borderColor: c.border },
                ]}
                onPress={() => handleSelect(option.source)}
                activeOpacity={0.78}
              >
                <View style={[styles.optionIcon, { backgroundColor: c.tint }]}>
                  <IconSymbol name={meta.icon} size={22} color="#fff" />
                </View>
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionLabel, { color: c.text }]}>
                    {option.label ?? meta.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: c.subtext }]}>
                    {option.description ?? meta.description}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={c.subtext} />
              </TouchableOpacity>
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
  optionLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
});
