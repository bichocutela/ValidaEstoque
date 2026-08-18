const RELEASES_API = "https://api.github.com/repos/bichocutela/ValidaEstoque/releases/latest";
const APK_PREFIX = "https://github.com/bichocutela/ValidaEstoque/releases/download/";

type GitHubAsset = { name?: unknown; browser_download_url?: unknown; size?: unknown };
type GitHubRelease = { tag_name?: unknown; name?: unknown; body?: unknown; published_at?: unknown; assets?: unknown };

export type AppRelease = {
  version: string;
  title: string;
  notes: string;
  publishedAt: string | null;
  apkUrl: string;
  apkSize: number | null;
};

export function compareVersions(left: string, right: string) {
  const leftParts = left.replace(/^v/i, "").split(".").map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = right.replace(/^v/i, "").split(".").map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export function parseAppRelease(payload: unknown): AppRelease | null {
  if (!payload || typeof payload !== "object") return null;
  const release = payload as GitHubRelease;
  const tag = typeof release.tag_name === "string" ? release.tag_name.trim() : "";
  const assets = Array.isArray(release.assets) ? release.assets as GitHubAsset[] : [];
  const asset = assets.find((candidate) => typeof candidate.name === "string" && candidate.name.toLowerCase().endsWith(".apk") && typeof candidate.browser_download_url === "string" && candidate.browser_download_url.startsWith(APK_PREFIX));
  if (!tag || !asset || typeof asset.browser_download_url !== "string") return null;
  return { version: tag.replace(/^v/i, ""), title: typeof release.name === "string" && release.name.trim() ? release.name.trim() : `ValidaEstoque ${tag}`, notes: typeof release.body === "string" ? release.body.trim() : "", publishedAt: typeof release.published_at === "string" ? release.published_at : null, apkUrl: asset.browser_download_url, apkSize: typeof asset.size === "number" && asset.size > 0 ? asset.size : null };
}

export async function checkForUpdate(currentVersion: string, fetchImpl: typeof fetch = fetch) {
  const response = await fetchImpl(RELEASES_API, { headers: { Accept: "application/vnd.github+json" } });
  if (!response.ok) throw new Error(`Não foi possível consultar atualizações (${response.status}).`);
  const release = parseAppRelease(await response.json());
  if (!release || compareVersions(release.version, currentVersion) <= 0) return null;
  return release;
}

export function formatApkSize(bytes: number | null) {
  if (!bytes) return "APK disponível";
  return `${(bytes / 1_048_576).toFixed(1).replace(".", ",")} MB`;
}
