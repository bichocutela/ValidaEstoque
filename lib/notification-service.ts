import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase, type EmployeeProfile } from "@/lib/supabase-client";

const NOTIFICATION_STATE_KEY = "validaestoque-notification-device-v1";
const CHANNEL_ID = "validade-alertas";

export type NotificationDeviceState = {
  permission: "granted" | "denied" | "undetermined" | "unavailable";
  expoPushToken?: string;
  lastCheckedAt: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function configureNotificationChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Alertas de validade",
    description: "Avisos de lotes próximos do vencimento e situações críticas.",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 180, 120, 180],
    lightColor: "#0B5D52",
    sound: "default",
  });
}

async function persistState(state: NotificationDeviceState) {
  await AsyncStorage.setItem(NOTIFICATION_STATE_KEY, JSON.stringify(state));
  return state;
}

function mapPermission(status: Notifications.PermissionStatus): NotificationDeviceState["permission"] {
  return status === "granted" || status === "denied" ? status : "undetermined";
}

export async function getNotificationDeviceState(): Promise<NotificationDeviceState> {
  if (Platform.OS === "web" || !Device.isDevice) {
    return { permission: "unavailable", lastCheckedAt: new Date().toISOString() };
  }

  const permissions = await Notifications.getPermissionsAsync();
  const stored = await AsyncStorage.getItem(NOTIFICATION_STATE_KEY);
  const previous = stored ? (JSON.parse(stored) as Partial<NotificationDeviceState>) : {};
  return persistState({
    permission: mapPermission(permissions.status),
    expoPushToken: previous.expoPushToken,
    lastCheckedAt: new Date().toISOString(),
  });
}

/**
 * Pede o consentimento do Android, configura o canal e guarda o token Expo quando
 * houver um projeto de push configurado. O token fica no aparelho até o login
 * institucional estar ligado ao Supabase, quando poderá ser sincronizado com segurança.
 */
export async function activateNotifications(): Promise<NotificationDeviceState> {
  if (Platform.OS === "web" || !Device.isDevice) {
    return { permission: "unavailable", lastCheckedAt: new Date().toISOString() };
  }

  await configureNotificationChannel();
  let permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== "granted") {
    permissions = await Notifications.requestPermissionsAsync();
  }

  const state: NotificationDeviceState = {
    permission: mapPermission(permissions.status),
    lastCheckedAt: new Date().toISOString(),
  };

  if (state.permission !== "granted") return persistState(state);

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  try {
    state.expoPushToken = projectId
      ? (await Notifications.getExpoPushTokenAsync({ projectId })).data
      : (await Notifications.getExpoPushTokenAsync()).data;
  } catch {
    // O consentimento continua válido mesmo quando o token remoto não puder ser obtido offline.
  }

  return persistState(state);
}

export async function registerNotificationDevice(profile: EmployeeProfile, expoPushToken: string) {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return false;
  const appVersion = Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? null;
  const { error } = await supabase.from("device_tokens").upsert({
    user_id: profile.id,
    expo_push_token: expoPushToken,
    platform: Platform.OS,
    app_version: appVersion,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: "expo_push_token" });
  if (error) throw error;
  return true;
}

export async function sendNotificationTest() {
  const state = await getNotificationDeviceState();
  if (state.permission !== "granted") {
    throw new Error("Ative as notificações do Android antes de enviar o teste.");
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "ValidaEstoque ativado",
      body: "Os alertas deste aparelho estão prontos para a rotina de validade.",
      sound: "default",
      data: { kind: "notification-test" },
    },
    trigger: null,
  });
}
