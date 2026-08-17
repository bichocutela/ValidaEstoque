// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type NotificationRecord = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
};

type WebhookPayload = {
  record?: NotificationRecord;
} & Partial<NotificationRecord>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!url || !keys) throw new Error("Credenciais internas do Supabase indisponíveis.");
  const serviceKey = JSON.parse(keys).default as string;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Método não permitido" }, 405);

  let notification: NotificationRecord;
  try {
    const payload = (await request.json()) as WebhookPayload;
    notification = payload.record ?? (payload as NotificationRecord);
  } catch {
    return json({ error: "Payload inválido" }, 400);
  }

  if (!notification?.id || !notification.user_id || !notification.title || !notification.body) {
    return json({ error: "Notificação incompleta" }, 400);
  }

  const supabase = getServiceClient();
  const { data: devices, error: deviceError } = await supabase
    .from("device_tokens")
    .select("expo_push_token")
    .eq("user_id", notification.user_id);

  if (deviceError) throw deviceError;
  if (!devices?.length) return json({ delivered: false, reason: "Nenhum dispositivo registrado" });

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(
        devices.map((device) => ({
          to: device.expo_push_token,
          title: notification.title,
          body: notification.body,
          sound: "default",
          data: { notification_id: notification.id, ...(notification.payload ?? {}) },
        })),
      ),
    });

    if (!response.ok) throw new Error(`Expo Push respondeu ${response.status}`);
    await supabase
      .from("notifications")
      .update({ delivery_status: "sent", sent_at: new Date().toISOString() })
      .eq("id", notification.id);
    return json({ delivered: true, response: await response.json() });
  } catch (error) {
    await supabase.from("notifications").update({ delivery_status: "failed" }).eq("id", notification.id);
    throw error;
  }
});
