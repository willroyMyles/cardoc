import { Colors, StatusColors } from "@/constants/theme";
import React from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const scheme = useColorScheme() ?? "light";
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
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onCancel}
            >
              <Text style={[styles.btnText, { color: Colors[scheme].text }]}>
                {cancelLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.confirmBtn,
                {
                  backgroundColor: destructive
                    ? StatusColors.danger
                    : Colors[scheme].tint,
                },
              ]}
              onPress={onConfirm}
            >
              <Text style={[styles.btnText, styles.confirmText]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
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
    borderRadius: 16,
    padding: 24,
    width: "100%",
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: "700" },
  message: { fontSize: 14, lineHeight: 20 },
  buttons: { flexDirection: "row", gap: 12, marginTop: 8 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtn: { backgroundColor: "rgba(128,128,128,0.15)" },
  confirmBtn: {},
  btnText: { fontSize: 15, fontWeight: "600" },
  confirmText: { color: "#fff" },
});
