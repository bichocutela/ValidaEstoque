import { describe, expect, it } from "vitest";

import { daysUntil, formatDays, getLotTone } from "../lib/inventory-utils";

const referenceDate = new Date(2026, 7, 15, 9, 0, 0);

describe("cálculos de validade", () => {
  it("calcula corretamente o prazo de um lote", () => {
    expect(daysUntil("2026-08-15", referenceDate)).toBe(0);
    expect(daysUntil("2026-08-18", referenceDate)).toBe(3);
    expect(daysUntil("2026-08-13", referenceDate)).toBe(-2);
  });

  it("formata os prazos com mensagem operacional clara", () => {
    expect(formatDays(0)).toBe("Vence hoje");
    expect(formatDays(1)).toBe("Vence amanhã");
    expect(formatDays(-2)).toBe("Vencido há 2 dias");
  });

  it("prioriza lotes vencidos, avariados e críticos", () => {
    expect(getLotTone({ expiryDate: "2026-08-13" })).toBe("error");
    expect(getLotTone({ expiryDate: "2026-09-12", arrivalStatus: "Avariado" })).toBe("error");
    expect(getLotTone({ expiryDate: "2026-08-18" })).toBe("critical");
    expect(getLotTone({ expiryDate: "2026-08-24" })).toBe("warning");
    expect(getLotTone({ expiryDate: "2026-09-12" })).toBe("success");
  });
});
