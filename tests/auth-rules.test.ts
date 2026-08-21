import { describe, expect, it } from "vitest";
import { accountEmailForRegistration, normalizeRegistrationNumber, validateRegistration } from "../lib/auth-rules";

describe("credenciais por matrícula", () => {
  it("normaliza a matrícula e gera o identificador interno", () => {
    expect(normalizeRegistrationNumber("  NRD 123-4 ")).toBe("nrd123-4");
    expect(accountEmailForRegistration("NRD123-4")).toBe("nrd123-4@nordestaomaisvoce.com.br");
  });
  it("aceita nome, sobrenome e matrícula válida", () => {
    expect(validateRegistration({ firstName: "Maria", lastName: "Silva", registrationNumber: "nrd123-4" })).toBeNull();
  });
  it("rejeita matrícula curta", () => {
    expect(validateRegistration({ firstName: "Maria", lastName: "Silva", registrationNumber: "123" })).toContain("matrícula");
  });
});
