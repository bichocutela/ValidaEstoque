import type { InventoryLot, InventoryProduct, Movement } from "@/lib/inventory-data";
import { supabase, type EmployeeProfile } from "@/lib/supabase-client";

type SyncSnapshot = { products: InventoryProduct[]; lots: InventoryLot[]; movements: Movement[]; notificationPreferences: { enabled: boolean; sameDay: boolean; days: number } };
export type RemoteInventorySnapshot = { products: Omit<InventoryProduct, "image">[]; lots: InventoryLot[]; movements: Movement[]; notificationPreferences: { enabled: boolean; sameDay: boolean; days: number } };

const qualityMap = { "Bom estado": "bom_estado", Deteriorado: "deteriorado", Estragado: "estragado", Vencido: "vencido" } as const;
const arrivalMap = { Normal: "normal", "Validade crítica": "validade_critica", Avariado: "avariado" } as const;
const movementMap = { Recebido: "recebido", Vendido: "vendido", Avariado: "avariado", Vencido: "vencido", Estragado: "estragado", Ajuste: "ajuste" } as const;

export async function loadEmployeeProfile(userId: string) {
  const { data, error } = await supabase.from("employee_profiles").select("id,store_id,email,full_name,registration_number,role,status,last_login_at,created_at").eq("id", userId).single();
  if (error) throw error;
  return data as EmployeeProfile;
}

export async function recordEmployeeEvent(profile: EmployeeProfile, eventType: "login" | "logout" | "signup" | "product_created" | "lot_created" | "movement_created", entityType?: string, entityClientRef?: string) {
  const { error } = await supabase.from("employee_access_events").insert({ user_id: profile.id, store_id: profile.store_id, event_type: eventType, entity_type: entityType ?? null, entity_client_ref: entityClientRef ?? null });
  if (error) throw error;
  if (eventType === "login") {
    const { error: loginError } = await supabase.from("employee_profiles").update({ last_login_at: new Date().toISOString() }).eq("id", profile.id);
    if (loginError) throw loginError;
  }
}

export async function loadRemoteInventory(): Promise<RemoteInventorySnapshot | null> {
  const [productsResult, lotsResult, movementsResult, preferencesResult] = await Promise.all([
    supabase.from("inventory_products").select("id,client_ref,name,brand,category,volume,barcode").order("updated_at", { ascending: false }),
    supabase.from("inventory_lots").select("id,client_ref,product_id,code,expiry_date,received_at,initial_quantity,current_quantity,quality,arrival_status").order("updated_at", { ascending: false }),
    supabase.from("inventory_movements").select("id,client_ref,lot_id,product_id,movement_type,quantity,created_at,notes").order("created_at", { ascending: false }).limit(500),
    supabase.from("notification_preferences").select("enabled,warning_days,alert_on_expiry_day").limit(1).maybeSingle(),
  ]);
  if (productsResult.error || lotsResult.error || movementsResult.error || preferencesResult.error) return null;
  if (!(productsResult.data?.length)) return null;
  const products = productsResult.data.map((product) => ({ id: product.client_ref ?? `p-remote-${product.id}`, name: product.name, brand: product.brand ?? "", category: product.category ?? "", volume: product.volume ?? "", barcode: product.barcode ?? "" }));
  const productRefs = new Map(productsResult.data.map((product) => [product.id, product.client_ref ?? `p-remote-${product.id}`]));
  const lots = (lotsResult.data ?? []).flatMap((lot) => {
    const productId = productRefs.get(lot.product_id);
    if (!productId) return [];
    const quality = lot.quality === "deteriorado" ? "Deteriorado" : lot.quality === "estragado" ? "Estragado" : lot.quality === "vencido" ? "Vencido" : "Bom estado";
    const arrivalStatus = lot.arrival_status === "validade_critica" ? "Validade crítica" : lot.arrival_status === "avariado" ? "Avariado" : "Normal";
    return [{ id: lot.client_ref ?? `l-remote-${lot.id}`, productId, code: lot.code, expiryDate: lot.expiry_date, receivedAt: lot.received_at, initialQuantity: lot.initial_quantity, currentQuantity: lot.current_quantity, quality, arrivalStatus } as InventoryLot];
  });
  const lotRefs = new Map((lotsResult.data ?? []).map((lot) => [lot.id, lot.client_ref ?? `l-remote-${lot.id}`]));
  const movementLabels = { recebido: "Recebido", vendido: "Vendido", avariado: "Avariado", vencido: "Vencido", estragado: "Estragado", ajuste: "Ajuste" } as const;
  const movements = (movementsResult.data ?? []).flatMap((movement) => {
    const productId = productRefs.get(movement.product_id); const lotId = lotRefs.get(movement.lot_id);
    const type = movementLabels[movement.movement_type as keyof typeof movementLabels];
    if (!productId || !lotId || !type) return [];
    return [{ id: movement.client_ref ?? `m-remote-${movement.id}`, lotId, productId, type, quantity: movement.quantity, date: movement.created_at, employee: movement.notes?.replace("Registrado por ", "") || "Colaborador" } as Movement];
  });
  const preferences = preferencesResult.data;
  return { products, lots, movements, notificationPreferences: { enabled: preferences?.enabled ?? true, days: preferences?.warning_days ?? 5, sameDay: preferences?.alert_on_expiry_day ?? true } };
}

export async function synchronizeInventory(profile: EmployeeProfile, snapshot: SyncSnapshot) {
  const productsPayload = snapshot.products.map((product) => ({
    owner_id: profile.id, store_id: profile.store_id, client_ref: product.id, name: product.name, brand: product.brand || null, category: product.category || null, volume: product.volume || null, barcode: product.barcode || null, created_by: profile.id, updated_by: profile.id,
  }));
  const productsResult = await supabase.from("inventory_products").upsert(productsPayload, { onConflict: "store_id,client_ref" }).select("id,client_ref");
  if (productsResult.error) throw productsResult.error;
  const productIds = new Map((productsResult.data ?? []).map((item) => [item.client_ref, item.id]));

  const lotsPayload = snapshot.lots.map((lot) => ({
    client_ref: lot.id, product_id: productIds.get(lot.productId), code: lot.code, expiry_date: lot.expiryDate, received_at: lot.receivedAt, initial_quantity: lot.initialQuantity, current_quantity: lot.currentQuantity, quality: qualityMap[lot.quality], arrival_status: arrivalMap[lot.arrivalStatus], created_by: profile.id,
  })).filter((lot) => Boolean(lot.product_id));
  const lotsResult = await supabase.from("inventory_lots").upsert(lotsPayload, { onConflict: "client_ref" }).select("id,client_ref");
  if (lotsResult.error) throw lotsResult.error;
  const lotIds = new Map((lotsResult.data ?? []).map((item) => [item.client_ref, item.id]));

  const movementsPayload = snapshot.movements.filter((movement) => movement.quantity > 0 && movement.type !== "Conferido").map((movement) => ({
    client_ref: movement.id, lot_id: lotIds.get(movement.lotId), product_id: productIds.get(movement.productId), actor_id: profile.id, movement_type: movementMap[movement.type as keyof typeof movementMap], quantity: movement.quantity, notes: `Registrado por ${movement.employee}`, created_at: movement.date,
  })).filter((movement) => Boolean(movement.lot_id) && Boolean(movement.product_id) && Boolean(movement.movement_type));
  if (movementsPayload.length) {
    const movementsResult = await supabase.from("inventory_movements").upsert(movementsPayload, { onConflict: "client_ref" });
    if (movementsResult.error) throw movementsResult.error;
  }

  const preferenceResult = await supabase.from("notification_preferences").upsert({ user_id: profile.id, enabled: snapshot.notificationPreferences.enabled, warning_days: snapshot.notificationPreferences.days, alert_on_expiry_day: snapshot.notificationPreferences.sameDay });
  if (preferenceResult.error) throw preferenceResult.error;
}
