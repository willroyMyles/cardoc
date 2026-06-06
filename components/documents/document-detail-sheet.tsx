import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ExpiryIndicator } from "@/components/ui/expiry-indicator";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import { Colors, DocTypeColors, Radius, StatusColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CAR_DOCUMENT_TYPE_LABELS, CarDocument } from "@/models";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface DocumentDetailSheetProps {
  document: CarDocument | null;
  vehicleName?: string;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void | Promise<void>;
}

export function DocumentDetailSheet({
  document,
  vehicleName,
  visible,
  onClose,
  onDelete,
}: DocumentDetailSheetProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["62%", "86%"], []);
  const [showDelete, setShowDelete] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
      />
    ),
    [],
  );

  useEffect(() => {
    if (visible && document) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
      setShowDelete(false);
      setViewerUri(null);
    }
  }, [document, visible]);

  if (!document) return null;

  const accentColor = DocTypeColors[document.type] ?? DocTypeColors.other;
  const title = document.title ?? CAR_DOCUMENT_TYPE_LABELS[document.type];
  const issueDate = formatDate(document.issueDate);
  const expiryDate = formatDate(document.expiryDate);

  async function handleDelete() {
    await onDelete(document!.id);
    setShowDelete(false);
    bottomSheetModalRef.current?.dismiss();
  }

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: c.card }}
        handleIndicatorStyle={{ backgroundColor: c.border }}
        enablePanDownToClose
        onDismiss={onClose}
      >
        <BottomSheetScrollView
          style={{ backgroundColor: c.card }}
          contentContainerStyle={[
            styles.sheet,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View style={[styles.typeIcon, { backgroundColor: "#1A1A1A" }]}>
              <IconSymbol name="doc.fill" size={18} color={accentColor} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.documentNumber, { color: c.subtext }]}>
                {document.documentNumber || "No document number"}
              </Text>
              <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
                {title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => bottomSheetModalRef.current?.dismiss()}
              hitSlop={8}
            >
              <IconSymbol name="xmark" size={18} color={c.subtext} />
            </TouchableOpacity>
          </View>

          <View style={styles.typeRow}>
            <Text style={[styles.typeLabel, { color: accentColor }]}>
              {CAR_DOCUMENT_TYPE_LABELS[document.type]}
            </Text>
            <ExpiryIndicator expiryDate={document.expiryDate} />
          </View>

          <View style={[styles.divider, { backgroundColor: c.border }]} />

          <View style={styles.details}>
            {vehicleName ? (
              <Row label="Vehicle" value={vehicleName} c={c} />
            ) : null}
            {document.issuingAuthority ? (
              <Row label="Issued by" value={document.issuingAuthority} c={c} />
            ) : null}
            <Row label="Issue Date" value={issueDate} c={c} />
            <Row label="Expiry Date" value={expiryDate} c={c} />
            {document.notes ? (
              <Row label="Notes" value={document.notes} c={c} />
            ) : null}
          </View>

          {document.imageUri ? (
            <TouchableOpacity
              style={[styles.imageButton, { borderColor: c.border }]}
              onPress={() => setViewerUri(document.imageUri!)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: document.imageUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View style={styles.imageCopy}>
                <Text style={[styles.imageTitle, { color: c.text }]}>
                  Document Image
                </Text>
                <Text style={[styles.imageSubtitle, { color: c.subtext }]}>
                  Image available
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={c.icon} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[
              styles.deleteBtn,
              { borderColor: StatusColors.danger + "40" },
            ]}
            onPress={() => setShowDelete(true)}
            activeOpacity={0.75}
          >
            <IconSymbol name="trash.fill" size={16} color={StatusColors.danger} />
            <Text style={[styles.deleteText, { color: StatusColors.danger }]}>
              Delete Document
            </Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>

      <ConfirmDialog
        visible={showDelete}
        title="Delete Document"
        message="This will permanently delete this document."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      <ImageViewerModal
        visible={!!viewerUri}
        uri={viewerUri}
        onClose={() => setViewerUri(null)}
      />
    </>
  );
}

function Row({
  label,
  value,
  c,
}: {
  label: string;
  value: string;
  c: (typeof Colors)["light"];
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: c.subtext }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

function formatDate(raw: string) {
  const date = new Date(raw);
  return isNaN(date.getTime()) ? raw : date.toLocaleDateString();
}

const styles = StyleSheet.create({
  sheet: {
    paddingBottom: 34,
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerText: { flex: 1, minWidth: 0 },
  documentNumber: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: { fontSize: 16, lineHeight: 20, fontWeight: "700", marginTop: 2 },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  typeLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  divider: { height: StyleSheet.hairlineWidth },
  details: { gap: 11 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  rowLabel: { fontSize: 13, fontWeight: "500" },
  rowValue: {
    flex: 1,
    paddingLeft: 16,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  previewImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#111",
  },
  imageCopy: { flex: 1, minWidth: 0 },
  imageTitle: { fontSize: 14, fontWeight: "700" },
  imageSubtitle: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: Radius.tile,
    borderWidth: 1,
  },
  deleteText: { fontSize: 14, fontWeight: "600" },
});
