import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { barcodesMatch, parseBarcode, type BarcodeDetails } from "@/lib/barcode-intelligence";
import { type ArrivalStatus, type InventoryLot, type InventoryProduct, type Quality } from "@/lib/inventory-data";
import { useInventory } from "@/lib/inventory-context";
import { isValidDateKey, parsePositiveWholeNumber } from "@/lib/inventory-validation";
import { scannerToneSources } from "@/lib/scanner-sounds";

const qualities: Quality[] = ["Bom estado", "Deteriorado", "Estragado", "Vencido"];
const arrivalStatuses: ArrivalStatus[] = ["Normal", "Validade crítica", "Avariado"];
const todayKey = () => new Date().toISOString().slice(0, 10);
type ScanResolution = { details: BarcodeDetails; product?: InventoryProduct; existingLot?: InventoryLot };

export default function ScannerScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const focused = useIsFocused();
  const { addLot, products, lots, notificationPreferences } = useInventory();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [scanned, setScanned] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [resolution, setResolution] = useState<ScanResolution | null>(null);
  const [form, setForm] = useState({ name: "", brand: "", category: "", volume: "", barcode: "", expiryDate: "", code: "", quantity: "", receivedAt: todayKey(), arrivalStatus: "Normal" as ArrivalStatus, quality: "Bom estado" as Quality });
  const standardPlayer = useAudioPlayer(scannerToneSources.standard);
  const crystalPlayer = useAudioPlayer(scannerToneSources.crystal);
  const softPlayer = useAudioPlayer(scannerToneSources.soft);
  const successScale = useRef(new Animated.Value(0.72)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    if (!productId) return;
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    setForm((current) => ({ ...current, name: product.name, brand: product.brand, category: product.category, volume: product.volume, barcode: product.barcode }));
  }, [productId, products]);
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
    return () => { if (successTimer.current) clearTimeout(successTimer.current); };
  }, []);
  const showScanSuccess = (onComplete: () => void) => {
    setScanSuccess(true);
    successScale.setValue(0.72);
    successOpacity.setValue(0);
    if (notificationPreferences.scannerSoundEnabled) {
      const player = notificationPreferences.scannerTone === "crystal" ? crystalPlayer : notificationPreferences.scannerTone === "soft" ? softPlayer : standardPlayer;
      player.seekTo(0);
      player.play();
    }
    Animated.parallel([
      Animated.timing(successOpacity, { toValue: 1, duration: 110, useNativeDriver: true }),
      Animated.spring(successScale, { toValue: 1, damping: 13, stiffness: 240, mass: 0.65, useNativeDriver: true }),
    ]).start();
    successTimer.current = setTimeout(() => {
      Animated.timing(successOpacity, { toValue: 0, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
        setScanSuccess(false);
        onComplete();
      });
    }, 620);
  };
  const resolveBarcode = (value: string) => {
    const details = parseBarcode(value);
    const product = details.gtin ? products.find((item) => barcodesMatch(item.barcode, details.gtin!)) : undefined;
    const existingLot = product && details.lot ? lots.find((lot) => lot.productId === product.id && lot.code.trim().toLowerCase() === details.lot!.trim().toLowerCase()) : undefined;
    const barcode = details.gtin ?? value.trim();
    setForm((current) => ({
      ...current,
      barcode,
      name: product?.name ?? current.name,
      brand: product?.brand ?? current.brand,
      category: product?.category ?? current.category,
      volume: product?.volume ?? current.volume,
      code: details.lot ?? current.code,
      expiryDate: details.expiryDate ?? current.expiryDate,
      quantity: details.quantity ? String(details.quantity) : current.quantity,
    }));
    setResolution({ details, product, existingLot });
    return { details, product, existingLot };
  };
  const scan = ({ data }: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    const result = resolveBarcode(data);
    const productText = result.product ? `Produto identificado: ${result.product.name}.` : "Produto ainda não cadastrado; preencha os dados da embalagem.";
    const lotText = result.details.lot ? ` Lote ${result.details.lot} encontrado.` : "";
    const expiryText = result.details.expiryDate ? ` Validade ${formatDate(result.details.expiryDate)} encontrada.` : "";
    const quantityText = result.details.quantity ? ` Quantidade ${result.details.quantity} encontrada.` : "";
    showScanSuccess(() => { setCameraOpen(false); Alert.alert("Código lido", `${productText}${lotText}${expiryText}${quantityText}`); });
  };
  const takePicture = async () => { const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7, base64: false }); if (photo?.uri) setPhotoUri(photo.uri); setCameraOpen(false); };
  const capture = async () => { if (permission?.granted) { setScanned(false); setCameraOpen(true); return; } const requested = await requestPermission(); if (requested.granted) { setScanned(false); setCameraOpen(true); } else { Alert.alert("Permissão necessária", "Autorize o uso da câmera para escanear embalagens."); } };
  const save = () => {
    const quantity = parsePositiveWholeNumber(form.quantity);
    if (!form.name.trim() || !quantity) { Alert.alert("Revise o cadastro", "Nome e uma quantidade inteira maior que zero são obrigatórios."); return; }
    if (!isValidDateKey(form.expiryDate) || !isValidDateKey(form.receivedAt)) { Alert.alert("Datas inválidas", "Informe validade e recebimento no formato AAAA-MM-DD com datas existentes."); return; }
    const result = addLot({ product: { name: form.name, brand: form.brand, category: form.category, volume: form.volume, barcode: form.barcode }, code: form.code, expiryDate: form.expiryDate, receivedAt: form.receivedAt, initialQuantity: quantity, currentQuantity: quantity, arrivalStatus: form.arrivalStatus, quality: form.quality, photoUri });
    if (result.isCritical) Alert.alert("VALIDADE CRÍTICA", "Este produto foi recebido com prazo reduzido. O lote foi marcado para acompanhamento.", [{ text: "Ver lote", onPress: () => router.replace({ pathname: "/lot/[id]", params: { id: result.lot.id } }) }]);
    else router.replace({ pathname: "/lot/[id]", params: { id: result.lot.id } });
  };

  return <ScreenContainer className="px-5" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"><Text style={styles.title}>Scanner</Text><Text style={styles.subtitle}>Leia o código. Produtos cadastrados são preenchidos automaticamente; lote e validade aparecem quando a etiqueta usar GS1.</Text><Pressable onPress={capture} style={({ pressed }) => [styles.capture, pressed && styles.pressed]}>{photoUri ? <Image source={{ uri: photoUri }} style={styles.captureImage} /> : <><View style={styles.captureIcon}><MaterialIcons name="photo-camera" size={30} color="#0B5D52" /></View><Text style={styles.captureTitle}>Ler embalagem</Text><Text style={styles.captureHelper}>EAN, GTIN, GS1-128 e DataMatrix</Text></>}<View style={styles.captureCta}><MaterialIcons name="qr-code-scanner" size={16} color="#FFFFFF" /><Text style={styles.captureCtaText}>Abrir câmera</Text></View></Pressable>{resolution ? <ScanCard resolution={resolution} /> : <View style={styles.infoCard}><MaterialIcons name="info-outline" size={19} color="#0B5D52" /><Text style={styles.infoText}>Códigos EAN e GTIN identificam o produto. Para extrair lote e validade, a etiqueta precisa trazer dados GS1.</Text></View>}<SectionTitle icon="inventory-2" title="Produto" /><Field label="Nome" value={form.name} onChangeText={(value) => update("name", value)} /><Field label="Marca" value={form.brand} onChangeText={(value) => update("brand", value)} /><View style={styles.twoColumns}><View style={styles.half}><Field label="Categoria" value={form.category} onChangeText={(value) => update("category", value)} /></View><View style={styles.half}><Field label="Peso / volume" value={form.volume} onChangeText={(value) => update("volume", value)} /></View></View><Field label="Código de barras" value={form.barcode} keyboardType="default" onChangeText={(value) => update("barcode", value)} onBlur={() => resolveBarcode(form.barcode)} /><SectionTitle icon="fact-check" title="Lote e recebimento" /><View style={styles.twoColumns}><View style={styles.half}><Field label="Validade (AAAA-MM-DD)" value={form.expiryDate} onChangeText={(value) => update("expiryDate", value)} /></View><View style={styles.half}><Field label="Número do lote" value={form.code} placeholder="Ex.: AB123" onChangeText={(value) => update("code", value)} /></View></View><View style={styles.twoColumns}><View style={styles.half}><Field label="Quantidade" value={form.quantity} keyboardType="number-pad" onChangeText={(value) => update("quantity", value)} /></View><View style={styles.half}><Field label="Recebimento" value={form.receivedAt} onChangeText={(value) => update("receivedAt", value)} /></View></View><ChoiceGroup label="Situação na chegada" options={arrivalStatuses} value={form.arrivalStatus} onSelect={(value) => update("arrivalStatus", value)} /><ChoiceGroup label="Qualidade" options={qualities} value={form.quality} onSelect={(value) => update("quality", value)} /><Pressable onPress={save} style={({ pressed }) => [styles.save, pressed && styles.pressed]}><Text style={styles.saveText}>Salvar lote</Text><MaterialIcons name="check-circle" size={20} color="#FFFFFF" /></Pressable></ScrollView><Modal visible={cameraOpen && focused} animationType="slide" onRequestClose={() => setCameraOpen(false)}><View style={styles.cameraPage}>{permission?.granted ? <CameraView ref={cameraRef} style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "datamatrix", "pdf417", "qr"] }} onBarcodeScanned={scanned ? undefined : scan} /> : <View style={styles.cameraFallback}><Text style={styles.cameraFallbackText}>A câmera precisa de permissão para registrar a embalagem.</Text><Pressable onPress={capture} style={styles.allowButton}><Text style={styles.allowButtonText}>Permitir câmera</Text></Pressable></View>}<View style={styles.cameraOverlay}><Pressable onPress={() => setCameraOpen(false)} style={styles.roundControl}><MaterialIcons name="close" size={26} color="#FFFFFF" /></Pressable><Text style={styles.cameraGuide}>Centralize o código dentro da área.</Text><View style={styles.scanFrame} /><Pressable onPress={takePicture} style={styles.shutter}><View style={styles.shutterInner} /></Pressable></View>{scanSuccess ? <Animated.View pointerEvents="none" style={[styles.scanSuccessOverlay, { opacity: successOpacity }]}><Animated.View style={[styles.scanSuccessBadge, { transform: [{ scale: successScale }] }]}><View style={styles.scanSuccessIcon}><MaterialIcons name="check" size={38} color="#FFFFFF" /></View><Text style={styles.scanSuccessTitle}>Código identificado</Text><Text style={styles.scanSuccessText}>Leitura concluída com sucesso</Text></Animated.View></Animated.View> : null}</View></Modal></ScreenContainer>;
}

function ScanCard({ resolution }: { resolution: ScanResolution }) { const { details, product, existingLot } = resolution; const found = [details.gtin && `GTIN ${details.gtin}`, details.lot && `Lote ${details.lot}`, details.expiryDate && `Validade ${formatDate(details.expiryDate)}`, details.quantity && `Quantidade ${details.quantity}`].filter(Boolean); return <View style={[styles.scanCard, product ? styles.scanCardFound : styles.scanCardManual]}><View style={styles.scanCardIcon}><MaterialIcons name={product ? "task-alt" : "edit-note"} size={20} color={product ? "#0B5D52" : "#B34E0A"} /></View><View style={styles.scanCardBody}><Text style={styles.scanCardTitle}>{product ? product.name : details.format === "GS1" ? "Dados GS1 identificados" : "Código registrado"}</Text><Text style={styles.scanCardText}>{product ? "Dados do produto preenchidos a partir do cadastro interno." : "Complete os dados do produto uma vez; nas próximas leituras o app o reconhecerá."}</Text>{found.length ? <Text style={styles.scanCardData}>{found.join(" · ")}</Text> : null}{existingLot ? <Text style={styles.existingLot}>Este lote já existe no histórico do produto.</Text> : null}</View></View>; }
function formatDate(value: string) { const [year, month, day] = value.split("-"); return `${day}/${month}/${year}`; }
function SectionTitle({ icon, title }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; title: string }) { return <View style={styles.sectionTitle}><MaterialIcons name={icon} size={19} color="#0B5D52" /><Text style={styles.sectionTitleText}>{title}</Text></View>; }
function Field({ label, value, onChangeText, placeholder, keyboardType, onBlur }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: "default" | "number-pad"; onBlur?: () => void }) { return <View style={styles.fieldWrap}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} onBlur={onBlur} placeholder={placeholder} placeholderTextColor="#8A9894" keyboardType={keyboardType} style={styles.field} /></View>; }
function ChoiceGroup({ label, options, value, onSelect }: { label: string; options: readonly string[]; value: string; onSelect: (value: string) => void }) { return <View style={styles.choiceWrap}><Text style={styles.fieldLabel}>{label}</Text><View style={styles.choices}>{options.map((option) => <Pressable key={option} onPress={() => onSelect(option)} style={({ pressed }) => [styles.choice, value === option && styles.choiceActive, pressed && styles.pressed]}><Text style={[styles.choiceText, value === option && styles.choiceTextActive]}>{option}</Text></Pressable>)}</View></View>; }
const styles = StyleSheet.create({ page: { paddingTop: 16, paddingBottom: 28 }, title: { color: "#18211F", fontSize: 27, lineHeight: 34, fontWeight: "800", letterSpacing: -0.7 }, subtitle: { color: "#60706C", fontSize: 13, lineHeight: 19, marginTop: 2 }, capture: { minHeight: 184, marginTop: 18, borderRadius: 24, backgroundColor: "#E7F3EF", alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: "#CBE6DC" }, captureImage: { width: "100%", height: 184 }, captureIcon: { width: 55, height: 55, borderRadius: 19, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center", marginBottom: 8 }, captureTitle: { color: "#18211F", fontSize: 16, fontWeight: "800" }, captureHelper: { color: "#60706C", fontSize: 12, marginTop: 3 }, captureCta: { position: "absolute", bottom: 12, flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: "#0B5D52", borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 }, captureCtaText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" }, infoCard: { marginTop: 12, padding: 13, borderRadius: 17, backgroundColor: "#EAF5F0", flexDirection: "row", gap: 9, alignItems: "flex-start" }, infoText: { flex: 1, color: "#386158", fontSize: 11, lineHeight: 16 }, scanCard: { padding: 13, borderRadius: 17, marginTop: 12, flexDirection: "row", gap: 9, borderWidth: 1 }, scanCardFound: { backgroundColor: "#EAF5F0", borderColor: "#B9DDD2" }, scanCardManual: { backgroundColor: "#FFF0E6", borderColor: "#FFE1CB" }, scanCardIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: "#FFFFFFAA", alignItems: "center", justifyContent: "center" }, scanCardBody: { flex: 1 }, scanCardTitle: { color: "#18211F", fontSize: 13, fontWeight: "900" }, scanCardText: { color: "#536863", fontSize: 11, lineHeight: 16, marginTop: 2 }, scanCardData: { color: "#0B5D52", fontSize: 11, lineHeight: 16, fontWeight: "800", marginTop: 6 }, existingLot: { color: "#7C3A0D", fontSize: 11, fontWeight: "800", marginTop: 5 }, sectionTitle: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 25, marginBottom: 12 }, sectionTitleText: { color: "#18211F", fontSize: 16, fontWeight: "800" }, fieldWrap: { marginBottom: 13 }, fieldLabel: { color: "#42514D", fontSize: 12, fontWeight: "800", marginBottom: 6 }, field: { minHeight: 47, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DFE8E4", color: "#18211F", fontSize: 14, paddingHorizontal: 12 }, twoColumns: { flexDirection: "row", gap: 10 }, half: { flex: 1 }, choiceWrap: { marginTop: 3, marginBottom: 10 }, choices: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, choice: { paddingHorizontal: 12, paddingVertical: 9, backgroundColor: "#FFFFFF", borderRadius: 99, borderWidth: 1, borderColor: "#DFE8E4" }, choiceActive: { backgroundColor: "#DDF1EA", borderColor: "#0B5D52" }, choiceText: { color: "#60706C", fontSize: 12, fontWeight: "800" }, choiceTextActive: { color: "#0B5D52" }, save: { height: 53, borderRadius: 16, backgroundColor: "#0B5D52", marginTop: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }, saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" }, pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] }, cameraPage: { flex: 1, backgroundColor: "#000" }, camera: { flex: 1 }, cameraFallback: { flex: 1, backgroundColor: "#0B5D52", justifyContent: "center", alignItems: "center", padding: 30 }, cameraFallbackText: { color: "#FFFFFF", textAlign: "center", fontSize: 16, lineHeight: 23 }, allowButton: { marginTop: 18, backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingVertical: 11, borderRadius: 14 }, allowButtonText: { color: "#0B5D52", fontWeight: "800" }, cameraOverlay: { ...StyleSheet.absoluteFillObject, padding: 28, justifyContent: "space-between", alignItems: "center" }, roundControl: { alignSelf: "flex-end", width: 44, height: 44, borderRadius: 22, backgroundColor: "#00000080", justifyContent: "center", alignItems: "center" }, cameraGuide: { color: "#FFFFFF", backgroundColor: "#00000099", borderRadius: 99, paddingHorizontal: 14, paddingVertical: 9, fontSize: 12, fontWeight: "700" }, scanFrame: { width: "86%", aspectRatio: 1.45, borderWidth: 2, borderRadius: 20, borderColor: "#FFFFFF" }, shutter: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center" }, shutterInner: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: "#0B5D52" }, scanSuccessOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#071D18AA", alignItems: "center", justifyContent: "center" }, scanSuccessBadge: { width: 230, paddingVertical: 25, paddingHorizontal: 18, borderRadius: 26, alignItems: "center", backgroundColor: "#FFFFFF" }, scanSuccessIcon: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", backgroundColor: "#0B8A70", marginBottom: 12 }, scanSuccessTitle: { color: "#0B5D52", fontSize: 18, fontWeight: "900" }, scanSuccessText: { color: "#60706C", fontSize: 12, marginTop: 4 } });
