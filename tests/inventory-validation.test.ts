import { describe, expect, it } from "vitest";

import { isValidDateKey, parsePositiveWholeNumber } from "../lib/inventory-validation";

describe("validação de dados de inventário", () => {
  it("aceita somente datas de calendário reais no formato ISO", () => {
    expect(isValidDateKey("2026-08-18")).toBe(true);
    expect(isValidDateKey("2026-02-29")).toBe(false);
    expect(isValidDateKey("18/08/2026")).toBe(false);
    expect(isValidDateKey("2026-13-01")).toBe(false);
  });

  it("aceita apenas quantidades inteiras positivas", () => {
    expect(parsePositiveWholeNumber("12")).toBe(12);
    expect(parsePositiveWholeNumber("0")).toBeNull();
    expect(parsePositiveWholeNumber("2.5")).toBeNull();
    expect(parsePositiveWholeNumber("abc")).toBeNull();
  });
});
