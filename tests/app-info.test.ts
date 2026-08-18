import { describe, expect, it } from "vitest";

import { formatCopyrightRange } from "../lib/app-info-core";

describe("informações institucionais", () => {
  it("mantém 2026 como origem e estende o período nos anos seguintes", () => {
    expect(formatCopyrightRange(2026)).toBe("2026");
    expect(formatCopyrightRange(2027)).toBe("2026-2027");
    expect(formatCopyrightRange(2028)).toBe("2026-2028");
  });
});
