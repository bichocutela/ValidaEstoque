import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { LoginScreen } from "@/components/login-screen";
import { MetricCard, ProductThumb, StatusPill, TapCard } from "@/components/inventory-ui";
import { ScreenContainer } from "@/components/screen-container";
import { daysUntil, getLotTone } from "@/lib/inventory-data";
import { useInventory } from "@/lib/inventory-context";

export default function HomeScreen() {
  const router = useRouter();
  const { signedIn, isReady, employeeName, lots, getProduct } = useInventory();
  const [refreshing, setRefreshing] = useState(false);
  if (!isReady) return <ScreenContainer className="p-6" containerClassName="bg-background"><View style={styles.loading}><ActivityIndicator size="large" color="#0B5D52" /><Text style={styles.loadingText}>Preparando o estoque...</Text></View></ScreenContainer>;
  if (!signedIn) return <LoginScreen />;

  const liveLots = lots.filter((lot) => lot.currentQuantity > 0);
  const expired = liveLots.filter((lot) => daysUntil(lot.expiryDate) < 0 || lot.quality === "Vencido" || lot.quality === "Estragado");
  const damaged = liveLots.filter((lot) => lot.quality === "Deteriorado" || lot.arrivalStatus === "Avariado");
  const critical = liveLots.filter((lot) => { const days = daysUntil(lot.expiryDate); return days >= 0 && days <= 5 && getLotTone(lot) !== "error"; });
  const normal = liveLots.filter((lot) => getLotTone(lot) === "success");
  const attention = [...liveLots].filter((lot) => getLotTone(lot) !== "success").sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate)).slice(0, 5);
  const refresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 550); };

  return <ScreenContainer className="px-5" containerClassName="bg-background">
    <FlatList
      data={attention}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#0B5D52" />}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<>
        <View style={styles.header}><View><Text style={styles.overline}>ROTINA DE HOJE</Text><Text style={styles.greeting}>Olá, {employeeName.split(" ")[0]}</Text><Text style={styles.headerHelper}>O estoque precisa da sua atenção.</Text></View><View style={styles.avatar}><Text style={styles.avatarText}>{employeeName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</Text></View></View>
        <View style={styles.summaryTitle}><Text style={styles.sectionTitle}>Visão geral</Text><Text style={styles.date}>15 AGO</Text></View>
        <View style={styles.metrics}><MetricCard label="Produtos OK" value={normal.reduce((sum, lot) => sum + lot.currentQuantity, 0)} tone="success" icon="verified" onPress={() => router.push("/(tabs)/products")} /><MetricCard label="Próximos do vencimento" value={critical.reduce((sum, lot) => sum + lot.currentQuantity, 0)} tone="critical" icon="schedule" onPress={() => router.push("/(tabs)/expiry")} /><MetricCard label="Vencidos" value={expired.reduce((sum, lot) => sum + lot.currentQuantity, 0)} tone="error" icon="event-busy" onPress={() => router.push("/(tabs)/expiry")} /><MetricCard label="Avariados" value={damaged.reduce((sum, lot) => sum + lot.currentQuantity, 0)} tone="warning" icon="report-problem" onPress={() => router.push("/(tabs)/expiry")} /></View>
        <Text style={[styles.sectionTitle, styles.quickTitle]}>Acesso rápido</Text>
        <View style={styles.shortcuts}>
          <QuickAction icon="qr-code-scanner" label="Escanear" color="#0B5D52" onPress={() => router.push("/(tabs)/scanner")} />
          <QuickAction icon="add-box" label="Cadastrar" color="#16794D" onPress={() => router.push("/(tabs)/scanner")} />
          <QuickAction icon="inventory-2" label="Produtos" color="#C98A00" onPress={() => router.push("/(tabs)/products")} />
          <QuickAction icon="event-note" label="Validades" color="#D96816" onPress={() => router.push("/(tabs)/expiry")} />
        </View>
        <View style={styles.attentionHeading}><View><Text style={styles.sectionTitle}>Atenção necessária</Text><Text style={styles.sectionHelper}>Prioridade por validade e qualidade</Text></View><Pressable onPress={() => router.push("/(tabs)/expiry")} style={({ pressed }) => pressed && styles.pressed}><Text style={styles.link}>Ver todos</Text></Pressable></View>
      </>}
      renderItem={({ item }) => { const product = getProduct(item.productId); if (!product) return null; return <TapCard onPress={() => router.push({ pathname: "/lot/[id]", params: { id: item.id } })} style={styles.attentionCard}><View style={[styles.statusRail, { backgroundColor: getLotTone(item) === "error" ? "#C73737" : getLotTone(item) === "critical" ? "#D96816" : "#C98A00" }]} /><ProductThumb source={product.image} /><View style={styles.cardContent}><View style={styles.cardTop}><Text style={styles.cardName} numberOfLines={1}>{product.name}</Text><StatusPill lot={item} /></View><Text style={styles.cardMeta}>{product.brand} · Lote {item.code}</Text><Text style={styles.cardQuantity}>{item.currentQuantity} unidades</Text></View><MaterialIcons name="chevron-right" size={22} color="#92A09C" /></TapCard>; }}
      ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="task-alt" size={32} color="#16794D" /><Text style={styles.emptyTitle}>Tudo sob controle</Text><Text style={styles.emptyText}>Não há lotes com prioridade agora.</Text></View>}
    />
  </ScreenContainer>;
}

function QuickAction({ icon, label, color, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; label: string; color: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}><View style={[styles.shortcutIcon, { backgroundColor: `${color}17` }]}><MaterialIcons name={icon} size={23} color={color} /></View><Text style={styles.shortcutText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  list: { paddingTop: 16, paddingBottom: 28 }, loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }, loadingText: { color: "#60706C", fontSize: 14, fontWeight: "700" }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }, overline: { color: "#0B5D52", fontSize: 11, fontWeight: "900", letterSpacing: 1.15 }, greeting: { color: "#18211F", fontSize: 26, lineHeight: 33, fontWeight: "800", letterSpacing: -0.7, marginTop: 2 }, headerHelper: { color: "#60706C", fontSize: 13, lineHeight: 19, marginTop: 2 }, avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#D7EFE8", alignItems: "center", justifyContent: "center" }, avatarText: { color: "#0B5D52", fontSize: 14, fontWeight: "900" }, summaryTitle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, sectionTitle: { color: "#18211F", fontSize: 18, lineHeight: 24, fontWeight: "800", letterSpacing: -0.25 }, date: { color: "#60706C", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 }, metrics: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", rowGap: 10 }, quickTitle: { marginTop: 25, marginBottom: 12 }, shortcuts: { flexDirection: "row", justifyContent: "space-between" }, shortcut: { width: "23%", alignItems: "center", gap: 7 }, shortcutIcon: { width: 54, height: 54, borderRadius: 17, alignItems: "center", justifyContent: "center" }, shortcutText: { color: "#475652", fontSize: 11, fontWeight: "800" }, attentionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 28, marginBottom: 12 }, sectionHelper: { color: "#74827E", fontSize: 12, lineHeight: 17, marginTop: 2 }, link: { color: "#0B5D52", fontSize: 13, fontWeight: "900" }, attentionCard: { minHeight: 84, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5ECE9", borderRadius: 19, marginBottom: 10, padding: 12, flexDirection: "row", gap: 11, alignItems: "center", overflow: "hidden" }, statusRail: { position: "absolute", top: 0, bottom: 0, left: 0, width: 4 }, cardContent: { flex: 1 }, cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 5, alignItems: "flex-start" }, cardName: { color: "#18211F", fontSize: 14, fontWeight: "800", flex: 1, lineHeight: 19 }, cardMeta: { color: "#60706C", fontSize: 11, marginTop: 2 }, cardQuantity: { color: "#4D5A56", fontSize: 12, fontWeight: "700", marginTop: 5 }, pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] }, empty: { alignItems: "center", paddingVertical: 34, backgroundColor: "#FFFFFF", borderRadius: 20 }, emptyTitle: { color: "#18211F", fontWeight: "800", fontSize: 16, marginTop: 8 }, emptyText: { color: "#60706C", fontSize: 13, marginTop: 3 },
});
