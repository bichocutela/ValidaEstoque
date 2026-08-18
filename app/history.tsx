import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { TapCard } from "@/components/inventory-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useInventory } from "@/lib/inventory-context";
import type { Movement, MovementType } from "@/lib/inventory-data";

const FILTERS = ["Todos os movimentos", "Entradas", "Saídas", "Conferências"] as const;
type HistoryFilter = (typeof FILTERS)[number];

function movementColor(type: MovementType) {
  if (type === "Recebido" || type === "Conferido") return "#16794D";
  if (type === "Vendido") return "#0B5D52";
  return "#C73737";
}

function matchesFilter(movement: Movement, filter: HistoryFilter) {
  if (filter === "Todos os movimentos") return true;
  if (filter === "Entradas") return movement.type === "Recebido";
  if (filter === "Conferências") return movement.type === "Conferido";
  return movement.type !== "Recebido" && movement.type !== "Conferido";
}

export default function HistoryScreen() {
  const router = useRouter();
  const { movements, getLot, getProduct } = useInventory();
  const [filter, setFilter] = useState<HistoryFilter>("Todos os movimentos");
  const filteredMovements = useMemo(() => movements.filter((movement) => matchesFilter(movement, filter)), [filter, movements]);
  const cycleFilter = () => setFilter((current) => FILTERS[(FILTERS.indexOf(current) + 1) % FILTERS.length]);

  return <ScreenContainer className="px-5" containerClassName="bg-background">
    <FlatList
      data={filteredMovements}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<View>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={22} color="#18211F" /></Pressable>
        <Text style={styles.title}>Histórico</Text>
        <Text style={styles.subtitle}>Todas as movimentações permanecem registradas.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Alterar filtro do histórico" onPress={cycleFilter} style={({ pressed }) => [styles.filter, pressed && styles.pressed]}><MaterialIcons name="filter-list" size={18} color="#0B5D52" /><Text style={styles.filterText}>{filter}</Text><MaterialIcons name="expand-more" size={17} color="#0B5D52" /></Pressable>
        <Text style={styles.count}>{filteredMovements.length} movimentações no resultado</Text>
      </View>}
      renderItem={({ item }) => {
        const product = getProduct(item.productId);
        const lot = getLot(item.lotId);
        const positive = item.type === "Recebido";
        const content = <><View style={[styles.marker, { backgroundColor: movementColor(item.type) }]} /><View style={styles.body}><View style={styles.cardTop}><Text style={styles.product}>{product?.name ?? "Produto"}</Text><Text style={[styles.quantity, positive && styles.quantityPositive]}>{item.type === "Conferido" ? "Conferido" : `${positive ? "+" : "-"}${item.quantity}`}</Text></View><Text style={styles.meta}>Lote {lot?.code ?? "—"} · {item.type}</Text><Text style={styles.date}>{new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {item.employee}</Text></View>{lot ? <MaterialIcons name="chevron-right" size={22} color="#92A09C" /> : null}</>;
        return lot ? <TapCard onPress={() => router.push({ pathname: "/lot/[id]", params: { id: lot.id } })} style={styles.card}>{content}</TapCard> : <View style={styles.card}>{content}</View>;
      }}
      ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="history-toggle-off" size={32} color="#60706C" /><Text style={styles.emptyText}>Nenhuma movimentação neste filtro</Text></View>}
    />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  list: { paddingTop: 14, paddingBottom: 28 }, back: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5ECE9", marginBottom: 15 }, title: { color: "#18211F", fontSize: 27, lineHeight: 34, fontWeight: "800", letterSpacing: -0.7 }, subtitle: { color: "#60706C", fontSize: 13, marginTop: 2 }, filter: { marginTop: 17, alignSelf: "flex-start", minHeight: 36, borderRadius: 99, backgroundColor: "#EAF5F0", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 7 }, filterText: { color: "#0B5D52", fontSize: 12, fontWeight: "800" }, count: { color: "#71817C", fontSize: 12, fontWeight: "700", marginBottom: 11 }, card: { minHeight: 75, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5ECE9", borderRadius: 18, flexDirection: "row", alignItems: "center", padding: 13, marginBottom: 9 }, marker: { height: 44, width: 4, borderRadius: 4, marginRight: 11 }, body: { flex: 1 }, cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, product: { color: "#18211F", fontSize: 14, lineHeight: 19, fontWeight: "800", flex: 1 }, quantity: { color: "#C73737", fontSize: 14, fontWeight: "900" }, quantityPositive: { color: "#16794D" }, meta: { color: "#4A5954", fontSize: 12, marginTop: 3 }, date: { color: "#778681", fontSize: 10, marginTop: 4 }, empty: { alignItems: "center", padding: 38, backgroundColor: "#FFFFFF", borderRadius: 20, gap: 8 }, emptyText: { color: "#60706C", fontWeight: "700" }, pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
