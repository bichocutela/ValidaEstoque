import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ProductThumb, TapCard } from "@/components/inventory-ui";
import { ScreenContainer } from "@/components/screen-container";
import { type InventoryProduct } from "@/lib/inventory-data";
import { useInventory } from "@/lib/inventory-context";
import { canManageProducts, matchesCatalogFilter, type CatalogFilter } from "@/lib/product-management";

export default function ProductsScreen() {
  const router = useRouter();
  const { products, lots, employeeRole, archiveProduct, deleteProduct, restoreProduct } = useInventory();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InventoryProduct | null>(null);
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("active");
  const canManage = canManageProducts(employeeRole);
  const activeCount = products.filter((product) => !product.archived).length;
  const archivedCount = products.filter((product) => product.archived).length;
  const filtered = useMemo(() => products.filter((product) => {
    if (!matchesCatalogFilter(product, catalogFilter)) return false;
    const allLots = lots.filter((lot) => lot.productId === product.id);
    const target = `${product.name} ${product.brand} ${product.barcode} ${allLots.map((lot) => lot.code).join(" ")}`.toLowerCase();
    return target.includes(query.trim().toLowerCase());
  }), [catalogFilter, lots, products, query]);

  const closeThen = (callback: () => void) => {
    setSelected(null);
    callback();
  };
  const goToDetail = () => selected && closeThen(() => router.push({ pathname: "/product/[id]", params: { id: selected.id } }));
  const goToEdit = () => selected && closeThen(() => router.push({ pathname: "/product/[id]/edit", params: { id: selected.id } }));
  const goToNewLot = () => selected && closeThen(() => router.push({ pathname: "/(tabs)/scanner", params: { productId: selected.id } }));
  const archiveSelected = () => {
    if (!selected) return;
    const product = selected;
    setSelected(null);
    Alert.alert("Arquivar produto?", `“${product.name}” ficará oculto do catálogo ativo, mas seus lotes, movimentações e histórico serão preservados.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Arquivar", onPress: () => { void archiveProduct(product.id).then((result) => { if (!result.success) Alert.alert("Não foi possível arquivar", result.message); }); } },
    ]);
  };
  const restoreSelected = () => {
    if (!selected) return;
    const product = selected;
    setSelected(null);
    void restoreProduct(product.id).then((result) => {
      if (result.success) { setCatalogFilter("active"); Alert.alert("Produto restaurado", `“${product.name}” voltou para o catálogo ativo.`); }
      else Alert.alert("Não foi possível restaurar", result.message);
    });
  };
  const requestDelete = () => {
    if (!selected) return;
    const product = selected;
    setSelected(null);
    Alert.alert("Excluir produto?", `“${product.name}” e todos os seus lotes e movimentações serão removidos. Esta ação não pode ser desfeita.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir tudo", style: "destructive", onPress: () => { void deleteProduct(product.id).then((result) => { Alert.alert(result.success ? "Produto excluído" : "Não foi possível excluir", result.success ? "O produto, seus lotes e movimentações foram removidos." : result.message); }); } },
    ]);
  };

  return <ScreenContainer className="px-5" containerClassName="bg-background">
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<>
        <View style={styles.heading}><View><Text style={styles.title}>Produtos</Text><Text style={styles.subtitle}>Catálogo consolidado por item</Text></View><Pressable onPress={() => router.push("/(tabs)/scanner")} style={({ pressed }) => [styles.add, pressed && styles.pressed]}><MaterialIcons name="add" size={24} color="#FFFFFF" /></Pressable></View>
        <View style={styles.search}><MaterialIcons name="search" size={20} color="#60706C" /><TextInput value={query} onChangeText={setQuery} style={styles.searchInput} placeholder="Nome, marca, código ou lote" placeholderTextColor="#80908A" returnKeyType="search" /><Pressable onPress={() => setQuery("")} hitSlop={10}>{query ? <MaterialIcons name="close" size={18} color="#60706C" /> : null}</Pressable></View>
        {canManage ? <View style={styles.filterRow}><FilterChip label={`Ativos (${activeCount})`} active={catalogFilter === "active"} onPress={() => setCatalogFilter("active")} /><FilterChip label={`Arquivados (${archivedCount})`} active={catalogFilter === "archived"} onPress={() => setCatalogFilter("archived")} /></View> : null}
        <Text style={styles.count}>{filtered.length} {catalogFilter === "active" ? "produtos ativos" : "produtos arquivados"}</Text>
      </>}
      renderItem={({ item }) => {
        const productLots = lots.filter((lot) => lot.productId === item.id);
        const total = productLots.reduce((sum, lot) => sum + lot.currentQuantity, 0);
        return <TapCard onPress={() => setSelected(item)} style={[styles.card, item.archived && styles.cardArchived]}><ProductThumb source={item.image} /><View style={styles.cardBody}><View style={styles.nameLine}><Text style={styles.name}>{item.name}</Text>{item.archived ? <View style={styles.archivedPill}><Text style={styles.archivedPillText}>Arquivado</Text></View> : null}</View><Text style={styles.meta}>{item.brand} · {item.volume}</Text><Text style={styles.stock}>{total} unidades · {productLots.length} {productLots.length === 1 ? "lote" : "lotes"}</Text></View><MaterialIcons name="more-vert" size={23} color="#60706C" /></TapCard>;
      }}
      ListEmptyComponent={<View style={styles.empty}><MaterialIcons name={catalogFilter === "archived" ? "inventory-2" : "search-off"} size={30} color="#60706C" /><Text style={styles.emptyText}>{catalogFilter === "archived" ? "Nenhum produto arquivado" : "Nenhum produto encontrado"}</Text></View>}
    />
    <Modal visible={Boolean(selected)} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
      <Pressable onPress={() => setSelected(null)} style={styles.overlay}>
        <Pressable onPress={() => undefined} style={styles.sheet}>
          <View style={styles.handle} />
          {selected ? <View style={styles.sheetHeader}><ProductThumb source={selected.image} /><View style={styles.sheetTitleWrap}><Text style={styles.sheetTitle}>{selected.name}</Text><Text style={styles.sheetMeta}>{selected.brand} · {selected.volume}</Text></View></View> : null}
          <Action icon="inventory-2" title="Ver detalhes e lotes" helper="Consultar estoque, lotes e validade" onPress={goToDetail} />
          {!selected?.archived ? <Action icon="add-box" title="Registrar novo lote" helper="Abrir o leitor já vinculado a este produto" onPress={goToNewLot} /> : null}
          {canManage && selected ? <>
            {selected.archived ? <Action icon="unarchive" title="Restaurar produto" helper="Voltar o item ao catálogo ativo" onPress={restoreSelected} /> : <Action icon="archive" title="Arquivar produto" helper="Ocultar sem apagar o histórico" onPress={archiveSelected} />}
            <Action icon="edit-note" title="Editar cadastro" helper="Alterar nome, marca, categoria e código" onPress={goToEdit} />
            <Action icon="delete-outline" title="Excluir definitivamente" helper="Remove produto, lotes e movimentações" destructive onPress={requestDelete} />
          </> : null}
          <Pressable onPress={() => setSelected(null)} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}><Text style={styles.cancelText}>Fechar</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  </ScreenContainer>;
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.filterChip, active && styles.filterChipActive, pressed && styles.pressed]}><Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text></Pressable>; }
function Action({ icon, title, helper, onPress, destructive = false }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; title: string; helper: string; onPress: () => void; destructive?: boolean }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><View style={[styles.actionIcon, destructive && styles.actionIconDanger]}><MaterialIcons name={icon} size={21} color={destructive ? "#C73737" : "#0B5D52"} /></View><View style={styles.actionText}><Text style={[styles.actionTitle, destructive && styles.actionTitleDanger]}>{title}</Text><Text style={styles.actionHelper}>{helper}</Text></View><MaterialIcons name="chevron-right" size={21} color="#9AA9A4" /></Pressable>; }

const styles = StyleSheet.create({
  list: { paddingTop: 16, paddingBottom: 28 }, heading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 19 }, title: { color: "#18211F", fontSize: 27, lineHeight: 34, fontWeight: "800", letterSpacing: -0.7 }, subtitle: { color: "#60706C", fontSize: 13, marginTop: 1 }, add: { width: 45, height: 45, borderRadius: 15, backgroundColor: "#0B5D52", alignItems: "center", justifyContent: "center" }, search: { height: 51, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DFE8E4", borderRadius: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 }, searchInput: { flex: 1, color: "#18211F", fontSize: 14, paddingVertical: 10, marginLeft: 9 }, filterRow: { flexDirection: "row", gap: 8, marginTop: 12 }, filterChip: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DFE8E4" }, filterChipActive: { backgroundColor: "#DDF1EA", borderColor: "#0B5D52" }, filterText: { color: "#60706C", fontSize: 11, fontWeight: "800" }, filterTextActive: { color: "#0B5D52" }, count: { color: "#71817C", fontSize: 12, fontWeight: "700", marginTop: 12, marginBottom: 10 }, card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5ECE9", borderRadius: 19, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 9 }, cardArchived: { opacity: 0.76, backgroundColor: "#F7F9F8" }, cardBody: { flex: 1 }, nameLine: { flexDirection: "row", alignItems: "center", gap: 7 }, name: { color: "#18211F", fontSize: 15, lineHeight: 20, fontWeight: "800", flexShrink: 1 }, archivedPill: { backgroundColor: "#E6EBE9", borderRadius: 99, paddingHorizontal: 7, paddingVertical: 3 }, archivedPillText: { color: "#52635E", fontSize: 9, fontWeight: "900" }, meta: { color: "#60706C", fontSize: 12, marginTop: 3 }, stock: { color: "#4A5954", fontSize: 12, fontWeight: "700", marginTop: 7 }, empty: { alignItems: "center", padding: 38, backgroundColor: "#FFFFFF", borderRadius: 20, gap: 8 }, emptyText: { color: "#60706C", fontWeight: "700" }, overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "#18211F88" }, sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 28 }, handle: { width: 38, height: 4, borderRadius: 4, backgroundColor: "#C8D3CF", alignSelf: "center", marginBottom: 17 }, sheetHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: "#EEF2F0" }, sheetTitleWrap: { flex: 1 }, sheetTitle: { color: "#18211F", fontSize: 18, fontWeight: "900" }, sheetMeta: { color: "#60706C", fontSize: 12, marginTop: 3 }, action: { flexDirection: "row", alignItems: "center", minHeight: 68, gap: 11, borderBottomWidth: 1, borderBottomColor: "#EEF2F0" }, actionIcon: { width: 39, height: 39, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF5F0" }, actionIconDanger: { backgroundColor: "#FCEBEC" }, actionText: { flex: 1 }, actionTitle: { color: "#18211F", fontSize: 14, fontWeight: "800" }, actionTitleDanger: { color: "#C73737" }, actionHelper: { color: "#71817C", fontSize: 11, marginTop: 2 }, cancel: { height: 49, borderRadius: 15, backgroundColor: "#F0F4F2", marginTop: 15, alignItems: "center", justifyContent: "center" }, cancelText: { color: "#4B5A56", fontSize: 14, fontWeight: "800" }, pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
});
