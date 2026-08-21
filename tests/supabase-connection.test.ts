import { describe, expect, it } from "vitest";

describe("conexão pública com o Supabase", () => {
  it("autentica a consulta leve de configurações com a chave publicável", async () => {
    const projectUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(projectUrl).toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/);
    expect(publishableKey).toMatch(/^sb_publishable_/);

    const response = await fetch(`${projectUrl}/auth/v1/settings`, {
      headers: { apikey: publishableKey! },
    });

    expect(response.ok).toBe(true);
    const settings = (await response.json()) as { external?: Record<string, unknown> };
    expect(settings).toBeTypeOf("object");
  });
});
