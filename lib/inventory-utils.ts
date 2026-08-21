export type ExpiryRecord = {
  expiryDate: string;
  quality?: string;
  arrivalStatus?: string;
};

export function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function daysUntil(expiryDate: string, reference = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate(), 12, 0, 0).getTime();
  return Math.round((dateFromKey(expiryDate).getTime() - start) / 86_400_000);
}

export function formatDate(dateKey: string) {
  return dateFromKey(dateKey).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDays(days: number) {
  if (days < 0) return `Vencido há ${Math.abs(days)} ${Math.abs(days) === 1 ? "dia" : "dias"}`;
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Vence amanhã";
  return `Vence em ${days} dias`;
}

export function getLotTone(lot: ExpiryRecord, reference = new Date()): "success" | "warning" | "critical" | "error" {
  const days = daysUntil(lot.expiryDate, reference);
  if (lot.quality === "Vencido" || lot.quality === "Estragado" || days < 0) return "error";
  if (lot.quality === "Deteriorado" || lot.arrivalStatus === "Avariado") return "error";
  if (days <= 5 || lot.arrivalStatus === "Validade crítica") return "critical";
  if (days <= 10) return "warning";
  return "success";
}
