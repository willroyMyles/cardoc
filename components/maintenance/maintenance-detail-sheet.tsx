import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, StatusColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    MAINTENANCE_TYPE_LABELS,
    type MaintenanceEntry,
} from "@/models/maintenance";
import { haptics } from "@/services/haptics";
import React from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface MaintenanceDetailSheetProps {
  entry: MaintenanceEntry | null;
  vehicleName: string;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function MaintenanceDetailSheet({
  entry,
  vehicleName,
  visible,
  onClose,
  onDelete,
}: MaintenanceDetailSheetProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  if (!entry) return null;

  function handleDelete() {
    onDelete(entry!.id);
    void haptics.warning();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.sheet, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <View style={[styles.handle, { backgroundColor: c.border }]} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={[styles.typeIcon, { backgroundColor: "#1A1A1A" }]}>
              <IconSymbol
                name="wrench.and.screwdriver.fill"
                size={20}
                color="#f59e0b"
              />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.typeLabel, { color: c.text }]}>
                {MAINTENANCE_TYPE_LABELS[entry.type]}
              </Text>
              <Text style={[styles.vehicleName, { color: c.subtext }]}>
                {vehicleName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <IconSymbol name="xmark" size={18} color={c.subtext} />
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: c.border }]} />

          {/* Details */}
          <View style={styles.details}>
            <Row label="Date" value={entry.date} c={c} />
            {entry.workshop ? (
              <Row label="Workshop" value={entry.workshop} c={c} />
            ) : null}
            {entry.cost != null ? (
              <Row
                label="Cost"
                value={`${entry.currency}${entry.cost.toFixed(2)}`}
                c={c}
              />
            ) : null}
            {entry.mileage != null ? (
              <Row
                label="Mileage"
                value={`${entry.mileage.toLocaleString()} mi`}
                c={c}
              />
            ) : null}
            {entry.description ? (
              <Row label="Notes" value={entry.description} c={c} />
            ) : null}
          </View>

          {/* Delete */}
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: StatusColors.danger + "40" }]}
            onPress={handleDelete}
            activeOpacity={0.75}
          >
            <IconSymbol name="trash" size={16} color={StatusColors.danger} />
            <Text style={[styles.deleteText, { color: StatusColors.danger }]}>
              Delete Record
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  typeLabel: { fontSize: 16, fontWeight: "700" },
  vehicleName: { fontSize: 13, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth },
  details: { gap: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  rowLabel: { fontSize: 13, fontWeight: "500" },
  rowValue: { fontSize: 13, fontWeight: "600", textAlign: "right", flex: 1, paddingLeft: 16 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  deleteText: { fontSize: 14, fontWeight: "600" },
});
