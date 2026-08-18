import { describe, expect, it } from "vitest";

import { compareVersions, parseAppRelease } from "../lib/app-update-core";

describe("atualizações internas", () => {
  it("compara versões sem depender de prefixo v", () => {
    expect(compareVersions("1.0.3", "v1.0.2")).toBeGreaterThan(0);
    expect(compareVersions("1.0.2", "1.0.2")).toBe(0);
    expect(compareVersions("1.0.1", "1.0.2")).toBeLessThan(0);
  });

  it("aceita apenas APKs publicados pela release oficial do projeto", () => {
    const valid = parseAppRelease({ tag_name: "v1.0.3", name: "ValidaEstoque 1.0.3", assets: [{ name: "ValidaEstoque-1.0.3.apk", browser_download_url: "https://github.com/bichocutela/ValidaEstoque/releases/download/v1.0.3/ValidaEstoque-1.0.3.apk", size: 1024 }] });
    const invalid = parseAppRelease({ tag_name: "v9.9.9", assets: [{ name: "apk-malicioso.apk", browser_download_url: "https://example.com/apk-malicioso.apk" }] });
    expect(valid?.version).toBe("1.0.3");
    expect(invalid).toBeNull();
  });
});
