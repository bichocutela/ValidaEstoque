import { describe, expect, it } from "vitest";

import { filterHistoryMovements } from "../lib/history-filter";
import type { Movement } from "../lib/inventory-data";

const movements: Movement[] = [
  { id: "m-1", lotId: "l-1", productId: "p-cafe", type: "Recebido", quantity: 12, date: "2026-08-20T09:00:00.000Z", employee: "Ana" },
  { id: "m-2", lotId: "l-2", productId: "p-arroz", type: "Vendido", quantity: 2, date: "2026-08-20T10:00:00.000Z", employee: "Bruno" },
  { id: "m-3", lotId: "l-1", productId: "p-cafe", type: "Conferido", quantity: 0, date: "2026-08-20T11:00:00.000Z", employee: "Ana" },
];

describe("filtro do histórico", () => {
  it("mantém todas as movimentações quando nenhum produto está selecionado", () => {
    expect(filterHistoryMovements(movements, "Todos os movimentos", null)).toHaveLength(3);
  });

  it("limita o resultado ao produto escolhido", () => {
    expect(filterHistoryMovements(movements, "Todos os movimentos", "p-cafe").map((movement) => movement.id)).toEqual(["m-1", "m-3"]);
  });

  it("combina o filtro de produto com o filtro de tipo", () => {
    expect(filterHistoryMovements(movements, "Entradas", "p-cafe").map((movement) => movement.id)).toEqual(["m-1"]);
    expect(filterHistoryMovements(movements, "Entradas", "p-arroz")).toEqual([]);
  });
});
