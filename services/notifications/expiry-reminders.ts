import { CarDocument } from "@/models";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Schedule expiry reminder notifications for a document at 30, 7, and 1 days before.
 * Each scheduled notification ID is derived from the document ID + offset.
 */
export async function scheduleDocumentExpiryReminders(
  doc: CarDocument,
): Promise<void> {
  const expiry = new Date(doc.expiryDate);
  const offsets = [30, 7, 1];

  for (const days of offsets) {
    const triggerDate = new Date(expiry.getTime() - days * 24 * 60 * 60 * 1000);
    if (triggerDate <= new Date()) continue;

    const identifier = `doc-expiry-${doc.id}-${days}`;

    // Cancel existing before scheduling to avoid duplication
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(
      () => {},
    );

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title:
          days === 1
            ? "⚠️ Document expires tomorrow!"
            : `📄 Document expires in ${days} days`,
        body: `${doc.title ?? doc.type} expires on ${expiry.toLocaleDateString()}`,
        data: { docId: doc.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }
}

export async function cancelDocumentExpiryReminders(
  docId: string,
): Promise<void> {
  const offsets = [30, 7, 1];
  await Promise.all(
    offsets.map((days) =>
      Notifications.cancelScheduledNotificationAsync(
        `doc-expiry-${docId}-${days}`,
      ).catch(() => {}),
    ),
  );
}
