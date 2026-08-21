import { describe, expect, it } from "vitest";

import { canManageProducts, matchesCatalogFilter, requiresDuplicateLotConfirmation } from "../lib/product-management";
import type { InventoryProduct } from "../lib/inventory-data";

const activeProduct: InventoryProduct = { id: "p-active", name: "Ativo", brand: "Marca", category: "Mercearia", volume: "1 un", barcode: "123", image: 1 as never };
const archivedProduct: InventoryProduct = { ...activeProduct, id: "p-archived", archived: true, archivedAt: "2026-08-21T00:00:00.000Z" };

describe("regras de gestão de produtos", () => {
  it("permite arquivamento apenas para perfis de gestão", () => {
    expect(canManageProducts("admin")).toBe(true);
    expect(canManageProducts("manager")).toBe(true);
    expect(canManageProducts("employee")).toBe(false);
    expect(canManageProducts(null)).toBe(false);
  });

  it("separa corretamente itens ativos e arquivados", () => {
    expect(matchesCatalogFilter(activeProduct, "active")).toBe(true);
    expect(matchesCatalogFilter(activeProduct, "archived")).toBe(false);
    expect(matchesCatalogFilter(archivedProduct, "active")).toBe(false);
    expect(matchesCatalogFilter(archivedProduct, "archived")).toBe(true);
  });

  it("exige confirmação antes de registrar uma entrada em lote já identificado", () => {
    expect(requiresDuplicateLotConfirmation("l-existente")).toBe(true);
    expect(requiresDuplicateLotConfirmation()).toBe(false);
  });
});
