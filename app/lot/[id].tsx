import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState, type ComponentProps } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ProductThumb, StatusPill } from "@/components/inventory-ui";
import { ScreenContainer } from "@/components/screen-container";
import { daysUntil, formatDate, formatDays, type ArrivalStatus, type MovementType, type Quality } from "@/lib/inventory-data";
import { useInventory } from "@/lib/inventory-context";
import { isValidDateKey } from "@/lib/inventory-validation";

const reasons: MovementType[] = ["Vendido", "Avariado", "Vencido", "Estragado", "Ajuste"];
const qualityOptions: Quality[] = ["Bom estado", "Deteriorado", "Estragado", "Vencido"];
const arrivalOptions: ArrivalStatus[] = ["Normal", "Validade crítica", "Avariado"];
type IconName = ComponentProps<typeof MaterialIcons>["name"];

function activityColor(type: MovementType) {
  if (type === "Recebido" || type === "Conferido") return "#16794D";
  if (type === "Vendido") return "#0B5D52";
  return "#C73737";
}

export default function LotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getLot, getProduct, movements, createMovement, editLot, confirmLot } = useInventory();
  const [lowStockOpen, setLowStockOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reason, setReason] = useState<MovementType>("Vendido");
  const [quantity, setQuantity] = useState("1");
  const [editDate, setEditDate] = useState("");
  const [editQuality, setEditQuality] = useState<Quality>("Bom estado");
  const [editArrival, setEditArrival] = useState<ArrivalStatus>("Normal");
  const lot = getLot(id);
  const product = lot ? getProduct(lot.productId) : undefined;
  const lotHistory = useMemo(() => movements.filter((movement) => movement.lotId === id), [id, movements]);

  if (!lot || !product) return <ScreenContainer className="p-5"><Text>Lote não encontrado.</Text></ScreenContainer>;
  const amount = Math.max(0, Number(quantity) || 0);
  const canConfirm = amount > 0 && amount <= lot.currentQuantity;
  const newBalance = Math.max(0, lot.currentQuantity - amount);
  const confirm = () => {
    if (!canConfirm) { Alert.alert("Quantidade inválida", `Informe de 1 a ${lot.currentQuantity} unidades.`); return; }
    createMovement(lot.id, reason, amount);
    setLowStockOpen(false);
    Alert.alert("Baixa registrada", `${amount} unidades foram registradas como ${reason.toLowerCase()}.`);
  };

  return <ScreenContainer className="px-5" containerClassName="bg-background">
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
      <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={22} color="#18211F" /></Pressable>
      <View style={styles.hero}><ProductThumb source={product.image} size="large" /><View style={styles.heroText}><Text style={styles.productName}>{product.name}</Text><Text style={styles.brand}>{product.brand} · {product.volume}</Text><Text style={styles.lotCode}>Lote {lot.code}</Text><StatusPill lot={lot} /></View></View>
      <View style={styles.stockCard}><View><Text style={styles.stockLabel}>Saldo atual</Text><Text style={styles.stockValue}>{lot.currentQuantity}<Text style={styles.stockUnit}> un.</Text></Text></View><View style={styles.stockDivider} /><View><Text style={styles.stockLabel}>Validade</Text><Text style={styles.stockDate}>{formatDate(lot.expiryDate)}</Text><Text style={styles.stockStatus}>{formatDays(daysUntil(lot.expiryDate))}</Text></View></View>
      <View style={styles.actions}><Action icon="task-alt" label="Conferir" color="#16794D" onPress={() => { confirmLot(lot.id); Alert.alert("Conferência registrada", "A conferência foi adicionada ao histórico do lote."); }} /><Action icon="remove-shopping-cart" label="Dar baixa" color="#C73737" onPress={() => setLowStockOpen(true)} /><Action icon="edit-note" label="Editar" color="#0B5D52" onPress={() => { setEditDate(lot.expiryDate); setEditQuality(lot.quality); setEditArrival(lot.arrivalStatus); setEditOpen(true); }} /></View>
      <Text style={styles.sectionTitle}>Informações do lote</Text>
      <View style={styles.infoCard}><Info icon="calendar-month" label="Data de recebimento" value={formatDate(lot.receivedAt)} /><Info icon="inventory" label="Quantidade inicial" value={`${lot.initialQuantity} unidades`} /><Info icon="health-and-safety" label="Qualidade" value={lot.quality} /><Info icon="local-shipping" label="Situação" value={lot.arrivalStatus} /></View>
      <View style={styles.historyHeading}><Text style={styles.sectionTitle}>Histórico do lote</Text><Pressable onPress={() => router.push("/history")}><Text style={styles.link}>Ver completo</Text></Pressable></View>
      <View style={styles.historyCard}>{lotHistory.length ? lotHistory.slice(0, 3).map((movement) => <View key={movement.id} style={styles.historyItem}><View style={[styles.historyDot, { backgroundColor: activityColor(movement.type) }]} /><View style={styles.historyText}><Text style={styles.historyType}>{movement.type}</Text><Text style={styles.historyDate}>{new Date(movement.date).toLocaleDateString("pt-BR")} · {movement.employee}</Text></View><Text style={[styles.historyQuantity, movement.type === "Recebido" && styles.historyQuantityPositive]}>{movement.type === "Recebido" ? "+" : "-"}{movement.quantity}</Text></View>) : <Text style={styles.noHistory}>Sem movimentações neste lote.</Text>}</View>
    </ScrollView>
    <Modal visible={lowStockOpen} transparent animationType="fade" onRequestClose={() => setLowStockOpen(false)}><View style={styles.modalOverlay}><View style={styles.modal}><View style={styles.modalHandle} /><Text style={styles.modalTitle}>Dar baixa</Text><Text style={styles.modalHelper}>Saldo atual: <Text style={styles.modalEmphasis}>{lot.currentQuantity} unidades</Text></Text><Text style={styles.fieldLabel}>Motivo da saída</Text><View style={styles.reasons}>{reasons.map((item) => <Pressable key={item} onPress={() => setReason(item)} style={({ pressed }) => [styles.reason, reason === item && styles.reasonActive, pressed && styles.pressed]}><Text style={[styles.reasonText, reason === item && styles.reasonTextActive]}>{item}</Text></Pressable>)}</View><Text style={styles.fieldLabel}>Quantidade retirada</Text><TextInput value={quantity} onChangeText={setQuantity} keyboardType="number-pad" style={styles.quantityInput} /><View style={styles.balance}><Text style={styles.balanceLabel}>Novo saldo</Text><Text style={styles.balanceValue}>{newBalance} unidades</Text></View><View style={styles.modalActions}><Pressable onPress={() => setLowStockOpen(false)} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}><Text style={styles.cancelText}>Cancelar</Text></Pressable><Pressable onPress={confirm} style={({ pressed }) => [styles.confirm, !canConfirm && styles.confirmDisabled, pressed && styles.pressed]}><Text style={styles.confirmText}>Confirmar baixa</Text></Pressable></View></View></View></Modal>
    <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}><View style={styles.modalOverlay}><View style={styles.modal}><View style={styles.modalHandle} /><Text style={styles.modalTitle}>Editar lote</Text><Text style={styles.modalHelper}>Atualize informações conferidas na embalagem.</Text><Text style={styles.fieldLabel}>Validade (AAAA-MM-DD)</Text><TextInput value={editDate} onChangeText={setEditDate} style={styles.quantityInput} /><Text style={editStyles.label}>Qualidade</Text><View style={styles.reasons}>{qualityOptions.map((item) => <Pressable key={item} onPress={() => setEditQuality(item)} style={({ pressed }) => [styles.reason, editQuality === item && editStyles.choiceActive, pressed && styles.pressed]}><Text style={[styles.reasonText, editQuality === item && editStyles.choiceTextActive]}>{item}</Text></Pressable>)}</View><Text style={editStyles.label}>Situação</Text><View style={styles.reasons}>{arrivalOptions.map((item) => <Pressable key={item} onPress={() => setEditArrival(item)} style={({ pressed }) => [styles.reason, editArrival === item && editStyles.choiceActive, pressed && styles.pressed]}><Text style={[styles.reasonText, editArrival === item && editStyles.choiceTextActive]}>{item}</Text></Pressable>)}</View><View style={styles.modalActions}><Pressable onPress={() => setEditOpen(false)} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}><Text style={styles.cancelText}>Cancelar</Text></Pressable><Pressable onPress={() => { if (!isValidDateKey(editDate)) { Alert.alert("Validade inválida", "Informe uma data existente no formato AAAA-MM-DD."); return; } editLot(lot.id, { expiryDate: editDate, quality: editQuality, arrivalStatus: editArrival }); setEditOpen(false); Alert.alert("Lote atualizado", "As informações conferidas foram salvas."); }} style={({ pressed }) => [editStyles.save, pressed && styles.pressed]}><Text style={styles.confirmText}>Salvar alterações</Text></Pressable></View></View></View></Modal>
  </ScreenContainer>;
}

function Action({ icon, label, color, onPress }: { icon: IconName; label: string; color: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><View style={[styles.actionIcon, { backgroundColor: `${color}18` }]}><MaterialIcons name={icon} size={22} color={color} /></View><Text style={styles.actionLabel}>{label}</Text></Pressable>; }
function Info({ icon, label, value }: { icon: IconName; label: string; value: string }) { return <View style={styles.info}><View style={styles.infoLabelWrap}><MaterialIcons name={icon} size={17} color="#60706C" /><Text style={styles.infoLabel}>{label}</Text></View><Text style={styles.infoValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  page: { paddingTop: 14, paddingBottom: 28 }, back: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5ECE9", marginBottom: 16 }, hero: { flexDirection: "row", alignItems: "center", gap: 14 }, heroText: { flex: 1 }, productName: { color: "#18211F", fontSize: 20, lineHeight: 26, fontWeight: "800" }, brand: { color: "#60706C", fontSize: 12, marginTop: 2 }, lotCode: { color: "#0B5D52", fontSize: 13, fontWeight: "800", marginTop: 8, marginBottom: 6 }, stockCard: { marginTop: 22, padding: 17, backgroundColor: "#0B5D52", borderRadius: 21, flexDirection: "row", justifyContent: "space-between" }, stockLabel: { color: "#BCE4D8", fontSize: 11, fontWeight: "800" }, stockValue: { color: "#FFFFFF", fontSize: 28, lineHeight: 35, fontWeight: "900", marginTop: 2 }, stockUnit: { fontSize: 15 }, stockDivider: { width: 1, backgroundColor: "#4F9384", marginHorizontal: 11 }, stockDate: { color: "#FFFFFF", fontSize: 15, fontWeight: "800", marginTop: 4 }, stockStatus: { color: "#D4F2E9", fontSize: 11, fontWeight: "700", marginTop: 3 }, actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 }, action: { alignItems: "center", width: "30%" }, actionIcon: { width: 51, height: 51, borderRadius: 17, justifyContent: "center", alignItems: "center" }, actionLabel: { color: "#4A5954", fontSize: 11, fontWeight: "800", marginTop: 6 }, sectionTitle: { color: "#18211F", fontSize: 18, fontWeight: "800", marginTop: 25 }, infoCard: { marginTop: 11, backgroundColor: "#FFFFFF", borderRadius: 19, borderWidth: 1, borderColor: "#E5ECE9", paddingHorizontal: 15 }, info: { minHeight: 54, borderBottomWidth: 1, borderBottomColor: "#EEF2F0", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, infoLabelWrap: { flexDirection: "row", alignItems: "center", gap: 7, flex: 1 }, infoLabel: { color: "#60706C", fontSize: 12, fontWeight: "700" }, infoValue: { color: "#18211F", fontSize: 12, fontWeight: "800", textAlign: "right" }, historyHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }, link: { color: "#0B5D52", fontSize: 12, fontWeight: "900", marginTop: 25 }, historyCard: { marginTop: 11, backgroundColor: "#FFFFFF", borderRadius: 19, borderWidth: 1, borderColor: "#E5ECE9", padding: 15 }, historyItem: { flexDirection: "row", alignItems: "center", minHeight: 45 }, historyDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 }, historyText: { flex: 1 }, historyType: { color: "#18211F", fontSize: 13, fontWeight: "800" }, historyDate: { color: "#71817C", fontSize: 10, marginTop: 2 }, historyQuantity: { color: "#C73737", fontSize: 13, fontWeight: "900" }, historyQuantityPositive: { color: "#16794D" }, noHistory: { color: "#60706C", fontSize: 12 }, modalOverlay: { flex: 1, backgroundColor: "#18211F88", justifyContent: "flex-end" }, modal: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 21, paddingBottom: 28 }, modalHandle: { width: 38, height: 4, borderRadius: 4, backgroundColor: "#C8D3CF", alignSelf: "center", marginBottom: 17 }, modalTitle: { color: "#18211F", fontSize: 21, fontWeight: "800" }, modalHelper: { color: "#60706C", fontSize: 13, marginTop: 4, marginBottom: 18 }, modalEmphasis: { color: "#18211F", fontWeight: "800" }, fieldLabel: { color: "#42514D", fontSize: 12, fontWeight: "800", marginBottom: 8 }, reasons: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 17 }, reason: { paddingHorizontal: 12, paddingVertical: 9, backgroundColor: "#FFFFFF", borderRadius: 99, borderWidth: 1, borderColor: "#DFE8E4" }, reasonActive: { backgroundColor: "#FDEBEB", borderColor: "#C73737" }, reasonText: { color: "#60706C", fontSize: 12, fontWeight: "800" }, reasonTextActive: { color: "#C73737" }, quantityInput: { height: 48, borderRadius: 13, borderWidth: 1, borderColor: "#DFE8E4", backgroundColor: "#F6F8F7", paddingHorizontal: 13, color: "#18211F", fontSize: 15, fontWeight: "800" }, balance: { marginTop: 14, flexDirection: "row", justifyContent: "space-between", padding: 13, backgroundColor: "#EAF5F0", borderRadius: 14 }, balanceLabel: { color: "#426159", fontSize: 13, fontWeight: "700" }, balanceValue: { color: "#0B5D52", fontSize: 13, fontWeight: "900" }, modalActions: { flexDirection: "row", gap: 10, marginTop: 18 }, cancel: { flex: 1, height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F4F2" }, cancelText: { color: "#4B5A56", fontSize: 14, fontWeight: "800" }, confirm: { flex: 1.35, height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#C73737" }, confirmDisabled: { opacity: 0.45 }, confirmText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});

const editStyles = StyleSheet.create({
  label: { color: "#42514D", fontSize: 12, fontWeight: "800", marginTop: 14, marginBottom: 8 },
  choiceActive: { backgroundColor: "#EAF5F0", borderColor: "#0B5D52" },
  choiceTextActive: { color: "#0B5D52" },
  save: { flex: 1.35, height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#0B5D52" },
});
