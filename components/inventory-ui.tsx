import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";

import { daysUntil, formatDays, getLotTone, type AlertLeadDays, type InventoryLot } from "@/lib/inventory-data";

export function ProductThumb({ source, size = "small" }: { source: ImageSourcePropType; size?: "small" | "large" }) {
  return <Image source={source} style={size === "large" ? styles.thumbLarge : styles.thumbSmall} resizeMode="cover" />;
}

export function StatusPill({ lot, alertLeadDays }: { lot: InventoryLot; alertLeadDays?: AlertLeadDays }) {
  const tone = getLotTone(lot, new Date(), alertLeadDays);
  const days = formatDays(daysUntil(lot.expiryDate));
  const style = tone === "success" ? styles.pillSuccess : tone === "warning" ? styles.pillWarning : tone === "critical" ? styles.pillCritical : styles.pillError;
  const text = tone === "success" ? styles.pillTextSuccess : tone === "warning" ? styles.pillTextWarning : tone === "critical" ? styles.pillTextCritical : styles.pillTextError;
  return <View style={[styles.pill, style]}><Text style={[styles.pillText, text]}>{days}</Text></View>;
}

export function MetricCard({ label, value, tone, icon, onPress }: { label: string; value: number; tone: "success" | "warning" | "critical" | "error"; icon: React.ComponentProps<typeof MaterialIcons>["name"]; onPress?: () => void }) {
  const box = tone === "success" ? styles.metricSuccess : tone === "warning" ? styles.metricWarning : tone === "critical" ? styles.metricCritical : styles.metricError;
  const iconColor = tone === "success" ? "#16794D" : tone === "warning" ? "#C98A00" : tone === "critical" ? "#D96816" : "#C73737";
  const content = <><MaterialIcons name={icon} size={20} color={iconColor} /><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></>;
  if (!onPress) return <View style={[styles.metric, box]}>{content}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${label}`} onPress={onPress} style={({ pressed }) => [styles.metric, box, pressed && styles.pressed]}>{content}</Pressable>;
}

export function TapCard({ children, onPress, style }: { children: React.ReactNode; onPress: () => void; style?: object }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.tapCard, style, pressed && styles.pressed]}>{children}</Pressable>;
}

const styles = StyleSheet.create({
  thumbSmall: { width: 52, height: 52, borderRadius: 14, backgroundColor: "#EDF2F0" },
  thumbLarge: { width: 94, height: 94, borderRadius: 22, backgroundColor: "#EDF2F0" },
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, alignSelf: "flex-start" },
  pillSuccess: { backgroundColor: "#E8F5EE" }, pillWarning: { backgroundColor: "#FFF4D7" }, pillCritical: { backgroundColor: "#FFF0E6" }, pillError: { backgroundColor: "#FDEBEB" },
  pillText: { fontSize: 11, fontWeight: "800" }, pillTextSuccess: { color: "#16794D" }, pillTextWarning: { color: "#9B6800" }, pillTextCritical: { color: "#B34E0A" }, pillTextError: { color: "#B02727" },
  metric: { width: "47.5%", minHeight: 124, borderRadius: 20, padding: 14, justifyContent: "space-between" },
  metricSuccess: { backgroundColor: "#E8F5EE" }, metricWarning: { backgroundColor: "#FFF4D7" }, metricCritical: { backgroundColor: "#FFF0E6" }, metricError: { backgroundColor: "#FDEBEB" },
  metricValue: { color: "#18211F", fontSize: 27, fontWeight: "800", letterSpacing: -0.7 }, metricLabel: { color: "#4E5D59", fontSize: 12, lineHeight: 16, fontWeight: "700" },
  tapCard: { borderRadius: 20 }, pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
