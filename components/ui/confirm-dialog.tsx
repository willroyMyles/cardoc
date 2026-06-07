import { Colors, StatusColors } from "@/constants/theme";
import { haptics } from "@/services/haptics";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native";
import { AnimatedPressable } from "@/components/ui/animated-pressable";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  loadingLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const scheme = useColorScheme() ?? "light";
  async function handleConfirm() {
    await onConfirm();
    void (destructive ? haptics.warning() : haptics.success());
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: Colors[scheme].card }]}>
          <Text style={[styles.title, { color: Colors[scheme].text }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: Colors[scheme].subtext }]}>
            {message}
          </Text>
          <View style={styles.buttons}>
            <AnimatedPressable
              style={[styles.btn, styles.cancelBtn]}
              onPress={onCancel}
              disabled={loading}
              pressedScale={0.96}
            >
              <Text style={[styles.btnText, { color: Colors[scheme].text }]}>
                {cancelLabel}
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={[
                styles.btn,
                styles.confirmBtn,
                {
                  backgroundColor: destructive
                    ? StatusColors.danger
                    : Colors[scheme].tint,
                },
              ]}
              onPress={handleConfirm}
              disabled={loading}
              pressedScale={0.96}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.btnText, styles.confirmText]}>
                    {loadingLabel ?? confirmLabel}
                  </Text>
                </>
              ) : (
                <Text style={[styles.btnText, styles.confirmText]}>
                  {confirmLabel}
                </Text>
              )}
            </AnimatedPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialog: {
    borderRadius: 24,
    padding: 24,
    width: "100%",
    gap: 12,
  },
  title: { fontSize: 17, fontWeight: "700" },
  message: { fontSize: 14, lineHeight: 20 },
  buttons: { flexDirection: "row", gap: 12, marginTop: 8 },
  btn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: { backgroundColor: "rgba(128,128,128,0.12)" },
  confirmBtn: {},
  btnText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8 },
  confirmText: { color: "#fff" },
});
