import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useInventory } from "@/lib/inventory-context";
import type { MovementType } from "@/lib/inventory-data";

function movementColor(type: MovementType) {
  if (type === "Recebido") return "#16794D";
  if (type === "Vendido") return "#0B5D52";
  return "#C73737";
}

export default function HistoryScreen() {
  const router = useRouter();
  const { movements, getLot, getProduct } = useInventory();
  return <ScreenContainer className="px-5" containerClassName="bg-background">
    <FlatList
      data={movements}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<View>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={22} color="#18211F" /></Pressable>
        <Text style={styles.title}>Histórico</Text>
        <Text style={styles.subtitle}>Todas as movimentações permanecem registradas.</Text>
        <View style={styles.filter}><MaterialIcons name="filter-list" size={18} color="#0B5D52" /><Text style={styles.filterText}>Todos os movimentos</Text></View>
      </View>}
      renderItem={({ item }) => {
        const product = getProduct(item.productId);
        const lot = getLot(item.lotId);
        const positive = item.type === "Recebido";
        return <View style={styles.card}>
          <View style={[styles.marker, { backgroundColor: movementColor(item.type) }]} />
          <View style={styles.body}>
            <View style={styles.cardTop}><Text style={styles.product}>{product?.name ?? "Produto"}</Text><Text style={[styles.quantity, positive && styles.quantityPositive]}>{positive ? "+" : "-"}{item.quantity}</Text></View>
            <Text style={styles.meta}>Lote {lot?.code ?? "—"} · {item.type}</Text>
            <Text style={styles.date}>{new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {item.employee}</Text>
          </View>
        </View>;
      }}
    />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  list: { paddingTop: 14, paddingBottom: 28 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5ECE9", marginBottom: 15 },
  title: { color: "#18211F", fontSize: 27, lineHeight: 34, fontWeight: "800", letterSpacing: -0.7 },
  subtitle: { color: "#60706C", fontSize: 13, marginTop: 2 },
  filter: { marginTop: 17, alignSelf: "flex-start", height: 36, borderRadius: 99, backgroundColor: "#EAF5F0", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 11 },
  filterText: { color: "#0B5D52", fontSize: 12, fontWeight: "800" },
  card: { minHeight: 75, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5ECE9", borderRadius: 18, flexDirection: "row", alignItems: "center", padding: 13, marginBottom: 9 },
  marker: { height: 44, width: 4, borderRadius: 4, marginRight: 11 },
  body: { flex: 1 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  product: { color: "#18211F", fontSize: 14, lineHeight: 19, fontWeight: "800", flex: 1 },
  quantity: { color: "#C73737", fontSize: 14, fontWeight: "900" },
  quantityPositive: { color: "#16794D" },
  meta: { color: "#4A5954", fontSize: 12, marginTop: 3 },
  date: { color: "#778681", fontSize: 10, marginTop: 4 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
