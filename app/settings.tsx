import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useInventory } from "@/lib/inventory-context";
import { activateNotifications, getNotificationDeviceState, registerNotificationDevice, sendNotificationTest, type NotificationDeviceState } from "@/lib/notification-service";
import { scannerToneOptions, scannerToneSources, type ScannerTone } from "@/lib/scanner-sounds";

export default function SettingsScreen() {
  const router = useRouter();
  const { employeeProfile, employeeRole, alertLeadDays, notificationPreferences, updateNotificationPreferences } = useInventory();
  const { enabled, scannerSoundEnabled, scannerTone } = notificationPreferences;
  const [deviceState, setDeviceState] = useState<NotificationDeviceState | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const standardPlayer = useAudioPlayer(scannerToneSources.standard);
  const crystalPlayer = useAudioPlayer(scannerToneSources.crystal);
  const softPlayer = useAudioPlayer(scannerToneSources.soft);
  const tonePlayers = { standard: standardPlayer, crystal: crystalPlayer, soft: softPlayer };

  const refreshDeviceState = useCallback(() => { void getNotificationDeviceState().then(setDeviceState).catch(() => undefined); }, []);
  useEffect(() => { refreshDeviceState(); }, [refreshDeviceState]);
  useEffect(() => { void setAudioModeAsync({ playsInSilentMode: true }); }, []);
  useEffect(() => {
    if (!employeeProfile || !deviceState?.expoPushToken || deviceState.permission !== "granted") return;
    void registerNotificationDevice(employeeProfile, deviceState.expoPushToken).catch(() => undefined);
  }, [deviceState?.expoPushToken, deviceState?.permission, employeeProfile]);

  const handleNotificationToggle = async (value: boolean) => {
    if (!value) { updateNotificationPreferences({ enabled: false }); return; }
    setIsActivating(true);
    try {
      const state = await activateNotifications();
      setDeviceState(state);
      if (state.permission === "granted") {
        if (employeeProfile && state.expoPushToken) await registerNotificationDevice(employeeProfile, state.expoPushToken);
        updateNotificationPreferences({ enabled: true });
        Alert.alert("Notificações ativadas", state.expoPushToken ? "Este aparelho foi registrado para receber os alertas do ValidaEstoque." : "Alertas locais foram ativados. O registro remoto será retomado quando houver conexão com o serviço de push.");
      } else if (state.permission === "denied") {
        updateNotificationPreferences({ enabled: false });
        Alert.alert("Permissão necessária", "Autorize as notificações nas configurações do Android para receber os alertas.");
      } else {
        updateNotificationPreferences({ enabled: false });
        Alert.alert("Dispositivo necessário", "As notificações são testadas em um aparelho Android físico.");
      }
    } finally { setIsActivating(false); }
  };

  const handleNotificationTest = async () => {
    try { await sendNotificationTest(); Alert.alert("Teste enviado", "A notificação será exibida neste aparelho em instantes."); }
    catch (error) { Alert.alert("Não foi possível testar", error instanceof Error ? error.message : "Tente novamente."); }
  };
  const selectTone = (tone: ScannerTone) => { updateNotificationPreferences({ scannerTone: tone }); const player = tonePlayers[tone]; player.seekTo(0); player.play(); };
  const notificationsActive = enabled && deviceState?.permission === "granted";
  const notificationDescription = deviceState?.permission === "granted" ? deviceState.expoPushToken ? "Este aparelho está registrado para receber os alertas remotos da loja." : "Alertas locais estão ativos. O registro remoto será concluído ao recuperar a conexão." : "Ative para autorizar os alertas deste aparelho no Android.";

  return <ScreenContainer className="px-5" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}><Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={22} color="#18211F" /></Pressable><Text style={styles.title}>Configurações</Text><Text style={styles.subtitle}>Ajuste seu aparelho e acompanhe os alertas da loja.</Text><Text style={styles.section}>Alertas de validade</Text><View style={styles.card}><SettingRow icon="notifications-active" title="Notificações" description={notificationDescription} value={notificationsActive} disabled={isActivating} onChange={handleNotificationToggle} /></View><Pressable accessibilityRole="button" accessibilityLabel="Enviar teste de notificação" onPress={handleNotificationTest} style={({ pressed }) => [styles.testButton, pressed && styles.pressed]}><MaterialIcons name="notifications" size={19} color="#FFFFFF" /><Text style={styles.testButtonText}>Testar notificação neste aparelho</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Ver configuração de antecedência" onPress={() => employeeRole === "admin" ? router.push("/admin") : Alert.alert("Configuração da loja", `Os alertas desta loja são exibidos até ${alertLeadDays} dias antes do vencimento. O administrador pode alterar essa antecedência.`)} style={({ pressed }) => [styles.alertWindow, pressed && styles.pressed]}><View style={styles.alertWindowIcon}><MaterialIcons name="event-note" size={21} color="#0B5D52" /></View><View style={styles.alertWindowText}><Text style={styles.alertWindowTitle}>Antecedência atual: {alertLeadDays} dias</Text><Text style={styles.alertWindowDescription}>Esta mesma janela vale para a tela de validades e para os alertas coletivos da equipe.</Text></View>{employeeRole === "admin" ? <MaterialIcons name="chevron-right" size={22} color="#0B5D52" /> : null}</Pressable><Text style={styles.section}>Leitor de código</Text><View style={styles.card}><SettingRow icon="volume-up" title="Som de confirmação" description="Tocar um aviso curto quando o leitor reconhecer um código" value={scannerSoundEnabled} onChange={(value) => updateNotificationPreferences({ scannerSoundEnabled: value })} /></View><Text style={styles.toneHeading}>Tom de confirmação</Text><Text style={styles.toneHelper}>Toque em uma opção para selecionar e ouvir uma prévia.</Text><View style={styles.toneChoices}>{scannerToneOptions.map((tone) => <ToneChoice key={tone.id} tone={tone} selected={scannerTone === tone.id} onPress={() => selectTone(tone.id)} />)}</View><View style={styles.note}><MaterialIcons name="info-outline" size={20} color="#0B5D52" /><Text style={styles.noteText}>Itens em até {Math.min(3, alertLeadDays)} dias são sinalizados como críticos. Entre {Math.min(3, alertLeadDays) + 1} e {alertLeadDays} dias, permanecem em atenção.</Text></View></ScrollView></ScreenContainer>;
}

function SettingRow({ icon, title, description, value, onChange, disabled = false }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; title: string; description: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) { return <View style={styles.row}><View style={styles.rowIcon}><MaterialIcons name={icon} size={21} color="#0B5D52" /></View><View style={styles.rowText}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDescription}>{description}</Text></View><Switch value={value} disabled={disabled} onValueChange={onChange} trackColor={{ false: "#D2DCD8", true: "#8FCABB" }} thumbColor={value ? "#0B5D52" : "#F7F9F8"} /></View>; }
function ToneChoice({ tone, selected, onPress }: { tone: (typeof scannerToneOptions)[number]; selected: boolean; onPress: () => void }) { return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`Usar tom ${tone.title}`} onPress={onPress} style={({ pressed }) => [styles.toneChoice, selected && styles.toneChoiceSelected, pressed && styles.pressed]}><View style={[styles.toneIcon, selected && styles.toneIconSelected]}><MaterialIcons name={tone.icon} size={20} color={selected ? "#FFFFFF" : "#0B5D52"} /></View><Text style={[styles.toneTitle, selected && styles.toneTitleSelected]}>{tone.title}</Text><Text style={[styles.toneDescription, selected && styles.toneDescriptionSelected]}>{tone.description}</Text>{selected ? <MaterialIcons name="check-circle" size={16} color="#0B5D52" style={styles.toneCheck} /> : null}</Pressable>; }

const styles = StyleSheet.create({ page: { paddingTop: 14, paddingBottom: 28 }, back: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5ECE9", marginBottom: 15 }, title: { color: "#18211F", fontSize: 27, lineHeight: 34, fontWeight: "800", letterSpacing: -0.7 }, subtitle: { color: "#60706C", fontSize: 13, marginTop: 2 }, section: { color: "#18211F", fontSize: 16, fontWeight: "800", marginTop: 25, marginBottom: 10 }, card: { backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#E5ECE9", paddingHorizontal: 14 }, row: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: 10 }, rowIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#EAF5F0", alignItems: "center", justifyContent: "center" }, rowText: { flex: 1 }, rowTitle: { color: "#18211F", fontSize: 14, fontWeight: "800" }, rowDescription: { color: "#60706C", fontSize: 11, lineHeight: 15, marginTop: 2 }, testButton: { marginTop: 12, minHeight: 46, borderRadius: 14, backgroundColor: "#0B5D52", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, testButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" }, alertWindow: { marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: "#EAF5F0", borderWidth: 1, borderColor: "#CBE5DC", flexDirection: "row", alignItems: "center", gap: 10 }, alertWindowIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }, alertWindowText: { flex: 1 }, alertWindowTitle: { color: "#0B5D52", fontSize: 13, fontWeight: "900" }, alertWindowDescription: { color: "#426159", fontSize: 11, lineHeight: 15, marginTop: 2 }, toneHeading: { color: "#18211F", fontSize: 14, fontWeight: "800", marginTop: 15 }, toneHelper: { color: "#60706C", fontSize: 11, lineHeight: 15, marginTop: 3 }, toneChoices: { flexDirection: "row", gap: 8, marginTop: 10 }, toneChoice: { flex: 1, minHeight: 138, borderRadius: 18, borderWidth: 1, borderColor: "#DFE8E4", backgroundColor: "#FFFFFF", paddingVertical: 12, paddingHorizontal: 9, alignItems: "center", justifyContent: "center" }, toneChoiceSelected: { backgroundColor: "#EAF5F0", borderColor: "#0B5D52" }, toneIcon: { width: 37, height: 37, borderRadius: 13, backgroundColor: "#EAF5F0", alignItems: "center", justifyContent: "center", marginBottom: 7 }, toneIconSelected: { backgroundColor: "#0B5D52" }, toneTitle: { color: "#18211F", fontSize: 12, fontWeight: "900", textAlign: "center" }, toneTitleSelected: { color: "#0B5D52" }, toneDescription: { color: "#60706C", fontSize: 9, lineHeight: 12, textAlign: "center", marginTop: 3 }, toneDescriptionSelected: { color: "#386158" }, toneCheck: { position: "absolute", top: 7, right: 7 }, note: { marginTop: 20, padding: 14, borderRadius: 16, flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: "#FFF0E6" }, noteText: { flex: 1, color: "#815129", fontSize: 12, lineHeight: 17 }, pressed: { opacity: 0.7, transform: [{ scale: 0.985 }] } });
