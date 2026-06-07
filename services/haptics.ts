import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const supportsHaptics = Platform.OS === "ios" || Platform.OS === "android";

async function safelyRun(task: () => Promise<void>) {
  if (!supportsHaptics) return;

  try {
    await task();
  } catch {
    // Haptics are polish only; never block the underlying action.
  }
}

export const haptics = {
  selection: () => safelyRun(() => Haptics.selectionAsync()),
  action: () =>
    safelyRun(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    ),
  success: () =>
    safelyRun(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),
  warning: () =>
    safelyRun(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    ),
  error: () =>
    safelyRun(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    ),
};
