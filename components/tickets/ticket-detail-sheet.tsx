import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { Colors, StatusColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ticket, TICKET_STATUS_LABELS, TicketStatus } from "@/models";
import { haptics } from "@/services/haptics";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

const statusMap: Record<TicketStatus, StatusType> = {
  unpaid: "danger",
  paid: "success",
  disputed: "warning",
  dismissed: "neutral",
};

interface TicketDetailSheetProps {
  ticket: Ticket | null;
  vehicleName?: string;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void | Promise<void>;
}

export function TicketDetailSheet({
  ticket,
  vehicleName,
  visible,
  onClose,
  onDelete,
}: TicketDetailSheetProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["58%", "82%"], []);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    if (visible && ticket) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
      setShowDelete(false);
      setDeleting(false);
    }
  }, [ticket, visible]);

  if (!ticket) return null;

  const issueDate = formatDate(ticket.date);
  const dueDate = ticket.dueDate ? formatDate(ticket.dueDate) : null;

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(ticket!.id);
      void haptics.warning();
      setShowDelete(false);
      bottomSheetModalRef.current?.dismiss();
    } finally {
      setDeleting(false);
    }
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
              <IconSymbol
                name="exclamationmark.triangle.fill"
                size={18}
                color="#f59e0b"
              />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.ticketNumber, { color: c.subtext }]}>
                #{ticket.ticketNumber}
              </Text>
              <Text
                style={[styles.violation, { color: c.text }]}
                numberOfLines={2}
              >
                {ticket.violation}
              </Text>
            </View>
            <AnimatedPressable
              onPress={() => bottomSheetModalRef.current?.dismiss()}
              hitSlop={8}
              pressedScale={0.92}
            >
              <IconSymbol name="xmark" size={18} color={c.subtext} />
            </AnimatedPressable>
          </View>

          <View style={styles.amountRow}>
            <Text style={[styles.amount, { color: c.text }]}>
              {ticket.currency} {ticket.amount.toFixed(2)}
            </Text>
            <StatusBadge
              label={TICKET_STATUS_LABELS[ticket.status]}
              status={statusMap[ticket.status]}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: c.border }]} />

          <View style={styles.details}>
            {vehicleName ? (
              <Row label="Vehicle" value={vehicleName} c={c} />
            ) : null}
            <Row label="Issued" value={issueDate} c={c} />
            {dueDate ? <Row label="Due" value={dueDate} c={c} /> : null}
            {ticket.issuingAuthority ? (
              <Row label="Authority" value={ticket.issuingAuthority} c={c} />
            ) : null}
            {ticket.region ? (
              <Row label="Region" value={ticket.region} c={c} />
            ) : null}
            {ticket.demeritPoints != null ? (
              <Row
                label="Demerits"
                value={`${ticket.demeritPoints} point${
                  ticket.demeritPoints === 1 ? "" : "s"
                }`}
                c={c}
              />
            ) : null}
            {ticket.notes ? (
              <Row label="Notes" value={ticket.notes} c={c} />
            ) : null}
          </View>

          <AnimatedPressable
            style={[styles.deleteBtn, { borderColor: StatusColors.danger + "40" }]}
            onPress={() => setShowDelete(true)}
            pressedScale={0.96}
          >
            <IconSymbol name="trash" size={16} color={StatusColors.danger} />
            <Text style={[styles.deleteText, { color: StatusColors.danger }]}>
              Delete Ticket
            </Text>
          </AnimatedPressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
      <ConfirmDialog
        visible={showDelete}
        title="Delete Ticket"
        message="This will permanently delete this ticket."
        confirmLabel="Delete"
        loadingLabel="Deleting"
        loading={deleting}
        destructive
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setShowDelete(false);
        }}
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
  const date = new Date(raw.split(" ")[0]);
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
  ticketNumber: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  violation: { fontSize: 16, lineHeight: 20, fontWeight: "700", marginTop: 2 },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  amount: { flex: 1, fontSize: 24, fontWeight: "800" },
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
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  deleteText: { fontSize: 14, fontWeight: "600" },
});
