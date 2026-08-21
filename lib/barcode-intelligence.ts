export type BarcodeDetails = {
  raw: string;
  normalized: string;
  format: "GTIN" | "GS1" | "unknown";
  gtin?: string;
  lot?: string;
  expiryDate?: string;
};

const GROUP_SEPARATOR = /[\u001d|]/g;

function normalizeGtin(value: string) {
  const compact = value.replace(/\D/g, "");
  return compact.replace(/^0+(?=\d)/, "");
}

function parseGs1Date(value: string) {
  if (!/^\d{6}$/.test(value)) return undefined;
  const year = 2000 + Number(value.slice(0, 2));
  const month = Number(value.slice(2, 4));
  const day = Number(value.slice(4, 6));
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return undefined;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseBarcode(rawValue: string): BarcodeDetails {
  const raw = rawValue.trim();
  const normalized = raw.replace(GROUP_SEPARATOR, "\u001d");
  const humanReadable = normalized.replace(/[()\s]/g, "");
  const bracketedGtin = normalized.match(/\(01\)(\d{14})/);
  const bracketedExpiry = normalized.match(/\(17\)(\d{6})/);
  const bracketedLot = normalized.match(/\(10\)([^\u001d(]{1,20})/);
  const rawGtin = humanReadable.startsWith("01") ? humanReadable.match(/^01(\d{14})/) : null;
  const contentAfterGtin = rawGtin ? humanReadable.slice((rawGtin.index ?? 0) + 16) : humanReadable;
  const rawExpiry = rawGtin ? contentAfterGtin.match(/17(\d{6})/) : null;
  const rawLot = rawGtin ? contentAfterGtin.match(/10([^\u001d]{1,20})/) : null;
  const gtin = bracketedGtin?.[1] ?? rawGtin?.[1];
  const expiry = bracketedExpiry?.[1] ?? rawExpiry?.[1];
  const lot = bracketedLot?.[1] ?? rawLot?.[1];

  if (gtin || expiry || lot) {
    return {
      raw,
      normalized,
      format: "GS1",
      gtin: gtin ? normalizeGtin(gtin) : undefined,
      lot: lot?.trim() || undefined,
      expiryDate: expiry ? parseGs1Date(expiry) : undefined,
    };
  }

  const digits = raw.replace(/\D/g, "");
  if ([8, 12, 13, 14].includes(digits.length)) return { raw, normalized: digits, format: "GTIN", gtin: normalizeGtin(digits) };
  return { raw, normalized: raw, format: "unknown" };
}

export function barcodesMatch(first: string, second: string) {
  const a = parseBarcode(first).gtin;
  const b = parseBarcode(second).gtin;
  return Boolean(a && b && a === b);
}
