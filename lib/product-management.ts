import type { EmployeeRole } from "@/lib/supabase-client";
import type { InventoryProduct } from "@/lib/inventory-data";

export type CatalogFilter = "active" | "archived";

export function canManageProducts(role: EmployeeRole | null) {
  return role === "admin" || role === "manager";
}

export function matchesCatalogFilter(product: InventoryProduct, filter: CatalogFilter) {
  return filter === "archived" ? Boolean(product.archived) : !product.archived;
}

export function requiresDuplicateLotConfirmation(existingLotId?: string) {
  return Boolean(existingLotId);
}
