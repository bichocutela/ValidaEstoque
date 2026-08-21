import { describe, expect, it } from "vitest";
import { barcodesMatch, parseBarcode } from "../lib/barcode-intelligence";

describe("interpretação de códigos de produto", () => {
  it("reconhece GTIN simples e compara zeros de preenchimento", () => {
    expect(parseBarcode("7891000101001")).toMatchObject({ format: "GTIN", gtin: "7891000101001" });
    expect(barcodesMatch("07891000101001", "7891000101001")).toBe(true);
  });

  it("extrai GTIN, lote e validade de um elemento GS1", () => {
    expect(parseBarcode("(01)07891000101001(17)260827(10)AB123")).toMatchObject({
      format: "GS1",
      gtin: "7891000101001",
      lot: "AB123",
      expiryDate: "2026-08-27",
    });
  });

  it("interrompe lote variável no separador GS1", () => {
    expect(parseBarcode("01078910001010011726082710AB123\u001d21SERIAL")).toMatchObject({ lot: "AB123", expiryDate: "2026-08-27" });
  });
});
