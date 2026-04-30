import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Push notification helpers.
 *
 * We send notifications directly from the sender's device via Expo's public
 * push API, using the recipient's stored `expoPushToken`. This lets us avoid
 * Cloud Functions entirely while still getting real-time push delivery.
 */

// Show heads-up alerts and play a sound when a notification arrives while
// the app is in the foreground. Without this handler the notification is
// suppressed on iOS.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Asks the OS for permission and returns an Expo push token, or null if the
 * user denied permission, the device is a simulator, or the project id can't
 * be resolved.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push tokens are only issued for physical devices.
  if (!Device.isDevice) return null;

  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#D4A12A",
      });
    } catch {
      // Channel creation is best effort.
    }
  }

  let status: Notifications.PermissionStatus;
  try {
    const existing = await Notifications.getPermissionsAsync();
    status = existing.status;
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
  } catch {
    return null;
  }
  if (status !== "granted") return null;

  // EAS-generated `projectId` is required by SDK 49+ for getExpoPushTokenAsync.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  if (!projectId) return null;

  try {
    const tokenResp = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResp.data ?? null;
  } catch {
    return null;
  }
}

export type PushPayload = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
};

/**
 * Sends a push via Expo's public push API. Silently no-ops on failure — push
 * delivery should never block the user-facing action that triggered it.
 */
export async function sendExpoPush(payload: PushPayload): Promise<void> {
  if (!payload.to || !payload.to.startsWith("ExponentPushToken")) return;
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: payload.to,
        sound: payload.sound === null ? undefined : "default",
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }),
    });
  } catch {
    // Network failures shouldn't surface to the UI.
  }
}
