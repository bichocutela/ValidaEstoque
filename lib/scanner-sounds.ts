export const scannerToneSources = {
  standard: require("@/assets/sounds/scanner-success.wav"),
  crystal: require("@/assets/sounds/scanner-crystal.wav"),
  soft: require("@/assets/sounds/scanner-soft.wav"),
} as const;

export type ScannerTone = keyof typeof scannerToneSources;

export const scannerToneOptions: Array<{ id: ScannerTone; title: string; description: string; icon: "music-note" | "notifications-active" | "graphic-eq" }> = [
  { id: "standard", title: "Padrão", description: "Dois toques claros", icon: "notifications-active" },
  { id: "crystal", title: "Cristal", description: "Toque agudo único", icon: "music-note" },
  { id: "soft", title: "Suave", description: "Toque discreto", icon: "graphic-eq" },
];
