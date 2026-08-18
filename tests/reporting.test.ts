import { describe, expect, it } from "vitest";

import type { InventoryLot, InventoryProduct, Movement } from "../lib/inventory-data";
import { calculateReportSummary } from "../lib/reporting";

const products: InventoryProduct[] = [
  { id: "p-1", name: "Iogurte", brand: "Marca", category: "Laticínios", volume: "170 g", barcode: "1", image: 1 as never },
  { id: "p-2", name: "Presunto", brand: "Marca", category: "Frios", volume: "200 g", barcode: "2", image: 1 as never },
];
const lots: InventoryLot[] = [
  { id: "l-1", productId: "p-1", code: "A", expiryDate: "2026-08-20", receivedAt: "2026-08-18", initialQuantity: 5, currentQuantity: 2, quality: "Bom estado", arrivalStatus: "Validade crítica" },
  { id: "l-2", productId: "p-2", code: "B", expiryDate: "2026-08-20", receivedAt: "2026-08-01", initialQuantity: 5, currentQuantity: 3, quality: "Bom estado", arrivalStatus: "Normal" },
];
const movements: Movement[] = [
  { id: "m-1", lotId: "l-1", productId: "p-1", type: "Vencido", quantity: 3, date: "2026-08-18T09:00:00", employee: "Administrador" },
  { id: "m-2", lotId: "l-2", productId: "p-2", type: "Avariado", quantity: 2, date: "2026-08-15T09:00:00", employee: "Administrador" },
  { id: "m-3", lotId: "l-2", productId: "p-2", type: "Estragado", quantity: 5, date: "2026-07-30T09:00:00", employee: "Administrador" },
];
const getProduct = (id: string) => products.find((product) => product.id === id);
const now = new Date("2026-08-18T12:00:00");

describe("relatórios por período", () => {
  it("recalcula perdas quando o período selecionado muda", () => {
    expect(calculateReportSummary({ lots, movements, getProduct, period: "Hoje", now })).toMatchObject({ total: 3, expired: 3, damaged: 0, spoiled: 0, leader: "Iogurte", critical: 1 });
    expect(calculateReportSummary({ lots, movements, getProduct, period: "Semana", now })).toMatchObject({ total: 5, expired: 3, damaged: 2, spoiled: 0, leader: "Iogurte", critical: 1 });
    expect(calculateReportSummary({ lots, movements, getProduct, period: "Mês", now })).toMatchObject({ total: 10, expired: 3, damaged: 2, spoiled: 5, leader: "Presunto", category: "Frios" });
  });
});
