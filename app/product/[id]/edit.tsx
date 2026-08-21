import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useInventory } from "@/lib/inventory-context";

type ProductForm = { name: string; brand: string; category: string; volume: string; barcode: string };

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getProduct, updateProduct } = useInventory();
  const product = getProduct(id);
  const [form, setForm] = useState<ProductForm>({ name: "", brand: "", category: "", volume: "", barcode: "" });

  useEffect(() => {
    if (!product) return;
    setForm({ name: product.name, brand: product.brand, category: product.category, volume: product.volume, barcode: product.barcode });
  }, [product]);

  if (!product) return <ScreenContainer className="p-5"><Text>Produto não encontrado.</Text></ScreenContainer>;
  const update = (field: keyof ProductForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const save = () => {
    if (!form.name.trim()) { Alert.alert("Nome obrigatório", "Informe o nome do produto antes de salvar."); return; }
    if (!updateProduct(product.id, { name: form.name.trim(), brand: form.brand.trim(), category: form.category.trim(), volume: form.volume.trim(), barcode: form.barcode.trim() })) { Alert.alert("Acesso restrito", "Somente perfis de gestão podem editar produtos."); return; }
    Alert.alert("Produto atualizado", "As informações do produto foram salvas.", [{ text: "Concluir", onPress: () => router.back() }]);
  };

  return <ScreenContainer className="px-5" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled"><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={22} color="#18211F" /></Pressable><Text style={styles.title}>Editar produto</Text><Text style={styles.subtitle}>Atualize as informações conferidas na embalagem ou no cadastro interno.</Text><View style={styles.notice}><MaterialIcons name="info-outline" size={18} color="#0B5D52" /><Text style={styles.noticeText}>As mudanças serão sincronizadas para os aparelhos autorizados.</Text></View><Field label="Nome do produto" value={form.name} onChangeText={(value) => update("name", value)} autoFocus /><Field label="Marca" value={form.brand} onChangeText={(value) => update("brand", value)} /><View style={styles.row}><View style={styles.half}><Field label="Categoria" value={form.category} onChangeText={(value) => update("category", value)} /></View><View style={styles.half}><Field label="Peso / volume" value={form.volume} onChangeText={(value) => update("volume", value)} /></View></View><Field label="Código de barras" value={form.barcode} onChangeText={(value) => update("barcode", value)} /><Pressable onPress={save} style={({ pressed }) => [styles.save, pressed && styles.pressed]}><Text style={styles.saveText}>Salvar alterações</Text><MaterialIcons name="check-circle" size={20} color="#FFFFFF" /></Pressable></ScrollView></ScreenContainer>;
}

function Field({ label, value, onChangeText, autoFocus = false }: { label: string; value: string; onChangeText: (value: string) => void; autoFocus?: boolean }) { return <View style={styles.fieldWrap}><Text style={styles.label}>{label}</Text><TextInput autoFocus={autoFocus} value={value} onChangeText={onChangeText} style={styles.field} placeholderTextColor="#8A9894" /></View>; }

const styles = StyleSheet.create({ page: { paddingTop: 14, paddingBottom: 28 }, back: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5ECE9", marginBottom: 16 }, title: { color: "#18211F", fontSize: 26, lineHeight: 33, fontWeight: "800", letterSpacing: -0.7 }, subtitle: { color: "#60706C", fontSize: 13, lineHeight: 19, marginTop: 3 }, notice: { flexDirection: "row", gap: 9, padding: 13, marginTop: 19, marginBottom: 20, borderRadius: 16, backgroundColor: "#EAF5F0" }, noticeText: { flex: 1, color: "#386158", fontSize: 12, lineHeight: 17 }, fieldWrap: { marginBottom: 14 }, label: { color: "#42514D", fontSize: 12, fontWeight: "800", marginBottom: 6 }, field: { minHeight: 48, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DFE8E4", color: "#18211F", fontSize: 14, paddingHorizontal: 13 }, row: { flexDirection: "row", gap: 10 }, half: { flex: 1 }, save: { height: 53, borderRadius: 16, backgroundColor: "#0B5D52", marginTop: 10, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }, saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" }, pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] } });
