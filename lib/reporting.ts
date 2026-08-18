import type { InventoryLot, InventoryProduct, Movement } from "@/lib/inventory-data";

export const REPORT_PERIODS = ["Hoje", "Semana", "Mês"] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export type ReportSummary = {
  spoiled: number;
  damaged: number;
  expired: number;
  critical: number;
  total: number;
  leader: string;
  category: string;
};

const LOSS_TYPES = new Set(["Vencido", "Avariado", "Estragado"]);

function beginningOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function reportPeriodStart(period: ReportPeriod, now = new Date()) {
  const start = beginningOfDay(now);
  if (period === "Semana") start.setDate(start.getDate() - 6);
  if (period === "Mês") start.setDate(start.getDate() - 29);
  return start;
}

export function calculateReportSummary({
  lots,
  movements,
  getProduct,
  period,
  now = new Date(),
}: {
  lots: InventoryLot[];
  movements: Movement[];
  getProduct: (productId: string) => InventoryProduct | undefined;
  period: ReportPeriod;
  now?: Date;
}): ReportSummary {
  const start = reportPeriodStart(period, now);
  const periodMovements = movements.filter((movement) => new Date(movement.date) >= start);
  const losses = periodMovements.filter((movement) => LOSS_TYPES.has(movement.type));
  const spoiled = losses.filter((movement) => movement.type === "Estragado").reduce((sum, movement) => sum + movement.quantity, 0);
  const damaged = losses.filter((movement) => movement.type === "Avariado").reduce((sum, movement) => sum + movement.quantity, 0);
  const expired = losses.filter((movement) => movement.type === "Vencido").reduce((sum, movement) => sum + movement.quantity, 0);
  const critical = lots.filter((lot) => lot.arrivalStatus === "Validade crítica" && new Date(`${lot.receivedAt}T00:00:00`) >= start).length;
  const lossByProduct = losses.reduce<Record<string, number>>((totals, movement) => {
    totals[movement.productId] = (totals[movement.productId] ?? 0) + movement.quantity;
    return totals;
  }, {});
  const [leaderProductId] = Object.entries(lossByProduct).sort(([, amountA], [, amountB]) => amountB - amountA)[0] ?? [];
  const leaderProduct = leaderProductId ? getProduct(leaderProductId) : undefined;

  return {
    spoiled,
    damaged,
    expired,
    critical,
    total: spoiled + damaged + expired,
    leader: leaderProduct?.name ?? "—",
    category: leaderProduct?.category ?? "—",
  };
}
