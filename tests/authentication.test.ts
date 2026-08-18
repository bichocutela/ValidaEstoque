import { describe, expect, it } from "vitest";

import { hasTemporaryAdminAccess } from "../lib/authentication";

describe("autenticação temporária", () => {
  it("aceita apenas as credenciais admin/admin, sem diferenciar maiúsculas no usuário", () => {
    expect(hasTemporaryAdminAccess("admin", "admin")).toBe(true);
    expect(hasTemporaryAdminAccess(" ADMIN ", "admin")).toBe(true);
    expect(hasTemporaryAdminAccess("admin", "incorreta")).toBe(false);
    expect(hasTemporaryAdminAccess("operador", "admin")).toBe(false);
  });
});
