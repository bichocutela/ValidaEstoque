// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!url || !keys) throw new Error("Credenciais internas do Supabase indisponíveis.");
  const serviceKey = JSON.parse(keys).default as string;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("queue_expiry_alerts");
  if (error) throw error;

  return new Response(JSON.stringify({ queued: data }), {
    headers: { "Content-Type": "application/json" },
  });
});
