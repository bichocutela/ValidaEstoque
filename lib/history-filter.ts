import type { Movement, MovementType } from "./inventory-data";

export const HISTORY_MOVEMENT_FILTERS = ["Todos os movimentos", "Entradas", "Saídas", "Conferências"] as const;
export type HistoryFilter = (typeof HISTORY_MOVEMENT_FILTERS)[number];

function matchesMovementType(movement: Movement, filter: HistoryFilter) {
  if (filter === "Todos os movimentos") return true;
  if (filter === "Entradas") return movement.type === "Recebido";
  if (filter === "Conferências") return movement.type === "Conferido";
  return movement.type !== "Recebido" && movement.type !== "Conferido";
}

export function filterHistoryMovements(movements: Movement[], filter: HistoryFilter, productId: string | null) {
  return movements.filter((movement) => matchesMovementType(movement, filter) && (!productId || movement.productId === productId));
}
