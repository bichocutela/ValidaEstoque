import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { TapCard } from "@/components/inventory-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useInventory } from "@/lib/inventory-context";
import type { MovementType } from "@/lib/inventory-data";
import { filterHistoryMovements, HISTORY_MOVEMENT_FILTERS, type HistoryFilter } from "@/lib/history-filter";

function movementColor(type: MovementType) {
  if (type === "Recebido" || type === "Conferido") return "#16794D";
  if (type === "Vendido") return "#0B5D52";
  return "#C73737";
}

export default function HistoryScreen() {
  const router = useRouter();
  const { movements, products, getLot, getProduct } = useInventory();
  const [filter, setFilter] = useState<HistoryFilter>("Todos os movimentos");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const filteredMovements = useMemo(() => filterHistoryMovements(movements, filter, selectedProductId), [filter, movements, selectedProductId]);
  const productOptions = useMemo(() => products.filter((product) => movements.some((movement) => movement.productId === product.id)).sort((first, second) => first.name.localeCompare(second.name, "pt-BR")), [movements, products]);
  const searchedProductOptions = useMemo(() => {
    const query = productQuery.trim().toLocaleLowerCase("pt-BR");
    return query ? productOptions.filter((product) => `${product.name} ${product.brand} ${product.category}`.toLocaleLowerCase("pt-BR").includes(query)) : productOptions;
  }, [productOptions, productQuery]);
  const selectedProduct = productOptions.find((product) => product.id === selectedProductId);
  const cycleFilter = () => setFilter((current) => HISTORY_MOVEMENT_FILTERS[(HISTORY_MOVEMENT_FILTERS.indexOf(current) + 1) % HISTORY_MOVEMENT_FILTERS.length]);
  const selectProduct = (productId: string | null) => { setSelectedProductId(productId); setProductPickerVisible(false); setProductQuery(""); };

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
        <View style={styles.filtersRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Alterar filtro do tipo de movimentação" onPress={cycleFilter} style={({ pressed }) => [styles.filter, pressed && styles.pressed]}><MaterialIcons name="filter-list" size={18} color="#0B5D52" /><Text numberOfLines={1} style={styles.filterText}>{filter}</Text><MaterialIcons name="expand-more" size={17} color="#0B5D52" /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Filtrar movimentações por produto" onPress={() => setProductPickerVisible(true)} style={({ pressed }) => [styles.filter, styles.productFilter, pressed && styles.pressed]}><MaterialIcons name="inventory-2" size={17} color="#0B5D52" /><Text numberOfLines={1} style={styles.filterText}>{selectedProduct ? selectedProduct.name : "Todos os produtos"}</Text><MaterialIcons name="expand-more" size={17} color="#0B5D52" /></Pressable>
        </View>
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
    <Modal visible={productPickerVisible} transparent animationType="fade" onRequestClose={() => setProductPickerVisible(false)}>
      <View style={styles.modalBackdrop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar seleção de produto" onPress={() => setProductPickerVisible(false)} style={StyleSheet.absoluteFill} />
        <View style={styles.pickerSheet}>
          <View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>Filtrar por produto</Text><Text style={styles.sheetSubtitle}>Escolha um produto para consultar suas movimentações.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={() => setProductPickerVisible(false)} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}><MaterialIcons name="close" size={20} color="#40514B" /></Pressable></View>
          <View style={styles.searchField}><MaterialIcons name="search" size={19} color="#70807A" /><TextInput value={productQuery} onChangeText={setProductQuery} placeholder="Buscar produto" placeholderTextColor="#82908B" autoCapitalize="none" returnKeyType="search" style={styles.searchInput} /></View>
          <FlatList
            data={searchedProductOptions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            style={styles.pickerList}
            contentContainerStyle={styles.pickerListContent}
            ListHeaderComponent={<Pressable accessibilityRole="button" onPress={() => selectProduct(null)} style={({ pressed }) => [styles.productOption, !selectedProductId && styles.productOptionSelected, pressed && styles.pressed]}><View style={styles.productOptionIcon}><MaterialIcons name="apps" size={18} color="#0B5D52" /></View><View style={styles.optionBody}><Text style={styles.optionName}>Todos os produtos</Text><Text style={styles.optionMeta}>Exibir o histórico completo</Text></View>{!selectedProductId ? <MaterialIcons name="check-circle" size={21} color="#16794D" /> : null}</Pressable>}
            renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => selectProduct(item.id)} style={({ pressed }) => [styles.productOption, selectedProductId === item.id && styles.productOptionSelected, pressed && styles.pressed]}><View style={styles.productOptionIcon}><MaterialIcons name="inventory-2" size={18} color="#0B5D52" /></View><View style={styles.optionBody}><Text numberOfLines={1} style={styles.optionName}>{item.name}</Text><Text numberOfLines={1} style={styles.optionMeta}>{[item.brand, item.category].filter(Boolean).join(" · ") || "Produto cadastrado"}</Text></View>{selectedProductId === item.id ? <MaterialIcons name="check-circle" size={21} color="#16794D" /> : null}</Pressable>}
            ListEmptyComponent={<View style={styles.emptySearch}><MaterialIcons name="search-off" size={26} color="#71817C" /><Text style={styles.emptySearchText}>Nenhum produto encontrado</Text></View>}
          />
        </View>
      </View>
    </Modal>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  list: { paddingTop: 14, paddingBottom: 28 }, back: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5ECE9", marginBottom: 15 }, title: { color: "#18211F", fontSize: 27, lineHeight: 34, fontWeight: "800", letterSpacing: -0.7 }, subtitle: { color: "#60706C", fontSize: 13, marginTop: 2 }, filtersRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 17, marginBottom: 7 }, filter: { alignSelf: "flex-start", minHeight: 36, borderRadius: 99, backgroundColor: "#EAF5F0", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 5 }, productFilter: { flex: 1, minWidth: 0 }, filterText: { color: "#0B5D52", fontSize: 12, fontWeight: "800", flexShrink: 1 }, count: { color: "#71817C", fontSize: 12, fontWeight: "700", marginBottom: 11 }, card: { minHeight: 75, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5ECE9", borderRadius: 18, flexDirection: "row", alignItems: "center", padding: 13, marginBottom: 9 }, marker: { height: 44, width: 4, borderRadius: 4, marginRight: 11 }, body: { flex: 1 }, cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, product: { color: "#18211F", fontSize: 14, lineHeight: 19, fontWeight: "800", flex: 1 }, quantity: { color: "#C73737", fontSize: 14, fontWeight: "900" }, quantityPositive: { color: "#16794D" }, meta: { color: "#4A5954", fontSize: 12, marginTop: 3 }, date: { color: "#778681", fontSize: 10, marginTop: 4 }, empty: { alignItems: "center", padding: 38, backgroundColor: "#FFFFFF", borderRadius: 20, gap: 8 }, emptyText: { color: "#60706C", fontWeight: "700" }, pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] }, modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(13, 29, 23, 0.46)" }, pickerSheet: { maxHeight: "78%", minHeight: 390, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, backgroundColor: "#FBFCFB" }, sheetHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }, sheetTitle: { color: "#18211F", fontSize: 19, lineHeight: 24, fontWeight: "800" }, sheetSubtitle: { color: "#60706C", fontSize: 12, lineHeight: 17, maxWidth: 275, marginTop: 2 }, closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#EFF4F1" }, searchField: { height: 45, borderRadius: 14, paddingHorizontal: 13, gap: 8, flexDirection: "row", alignItems: "center", backgroundColor: "#F0F4F2", borderWidth: 1, borderColor: "#E0E9E4" }, searchInput: { flex: 1, color: "#18211F", fontSize: 14, paddingVertical: 0 }, pickerList: { marginTop: 10 }, pickerListContent: { paddingBottom: 6 }, productOption: { minHeight: 64, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 10 }, productOptionSelected: { backgroundColor: "#EAF5F0" }, productOptionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#F0F7F4", alignItems: "center", justifyContent: "center" }, optionBody: { flex: 1, minWidth: 0 }, optionName: { color: "#18211F", fontSize: 14, lineHeight: 18, fontWeight: "800" }, optionMeta: { color: "#6D7C76", fontSize: 11, lineHeight: 15, marginTop: 2 }, emptySearch: { alignItems: "center", paddingVertical: 34, gap: 8 }, emptySearchText: { color: "#60706C", fontSize: 13, fontWeight: "700" },
});
