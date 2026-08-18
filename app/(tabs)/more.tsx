import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Constants from "expo-constants";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { checkForUpdate, downloadApk, formatApkSize, openAndroidInstaller, type AppRelease } from "@/lib/app-update";
import { ScreenContainer } from "@/components/screen-container";
import { useInventory } from "@/lib/inventory-context";

type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "installing" | "error";
const CURRENT_VERSION = Constants.expoConfig?.version ?? "1.0.0";

export default function MoreScreen() {
  const router = useRouter();
  const { employeeName, signOut } = useInventory();
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const checkUpdate = useCallback(async () => {
    setStatus("checking");
    setError(null);
    try {
      const available = await checkForUpdate(CURRENT_VERSION);
      setRelease(available);
      setStatus(available ? "available" : "idle");
    } catch (reason) {
      setRelease(null);
      setError(reason instanceof Error ? reason.message : "Não foi possível verificar atualizações.");
      setStatus("error");
    }
  }, []);

  useFocusEffect(useCallback(() => { void checkUpdate(); }, [checkUpdate]));

  const installUpdate = useCallback(async () => {
    if (!release) return;
    setStatus("downloading");
    setProgress(0);
    setError(null);
    try {
      const apkUri = await downloadApk(release, setProgress);
      setStatus("installing");
      await openAndroidInstaller(apkUri);
      setStatus("available");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível preparar a atualização.");
      setStatus("error");
    }
  }, [release]);

  return <ScreenContainer className="px-5" containerClassName="bg-background"><View style={styles.page}>
    <Text style={styles.title}>Mais</Text><Text style={styles.subtitle}>Acompanhe a operação e ajuste preferências.</Text>
    <View style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{employeeName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</Text></View><View><Text style={styles.profileName}>{employeeName}</Text><Text style={styles.profileRole}>Controle de estoque</Text></View></View>
    <View style={styles.menu}><MenuItem icon="history" title="Histórico" description="Entradas, baixas e responsáveis" onPress={() => router.push("/history")} /><MenuItem icon="insights" title="Relatórios" description="Perdas e indicadores do período" onPress={() => router.push("/reports")} /><MenuItem icon="notifications-active" title="Configurações" description="Alertas de validade e notificações" onPress={() => router.push("/settings")} /></View>
    {release ? <UpdateCard release={release} status={status} progress={progress} error={error} onInstall={() => void installUpdate()} onRetry={() => void checkUpdate()} /> : null}
    <Pressable accessibilityRole="button" accessibilityLabel="Encerrar sessão" onPress={signOut} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}><MaterialIcons name="logout" size={20} color="#C73737" /><Text style={styles.logoutText}>Encerrar sessão</Text></Pressable>
  </View></ScreenContainer>;
}

function UpdateCard({ release, status, progress, error, onInstall, onRetry }: { release: AppRelease; status: UpdateStatus; progress: number; error: string | null; onInstall: () => void; onRetry: () => void }) {
  const busy = status === "downloading" || status === "installing";
  const percentage = Math.round(progress * 100);
  return <View style={styles.updateCard}>
    <View style={styles.updateTop}><View style={styles.updateIcon}><MaterialIcons name="system-update-alt" size={22} color="#0B5D52" /></View><View style={styles.updateText}><Text style={styles.updateTitle}>Atualização disponível</Text><Text style={styles.updateDescription}>Versão {release.version} · {formatApkSize(release.apkSize)}</Text></View></View>
    {status === "downloading" ? <View style={styles.progressBlock}><View style={styles.progressLabels}><Text style={styles.progressText}>Baixando atualização</Text><Text style={styles.progressText}>{percentage}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${percentage}%` }]} /></View></View> : null}
    {status === "installing" ? <View style={styles.installing}><ActivityIndicator size="small" color="#0B5D52" /><Text style={styles.installingText}>Abrindo instalador do Android...</Text></View> : null}
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
    {!busy ? <Pressable accessibilityRole="button" accessibilityLabel={error ? "Tentar baixar atualização novamente" : "Baixar e instalar atualização"} onPress={error ? onRetry : onInstall} style={({ pressed }) => [styles.updateButton, pressed && styles.pressed]}><MaterialIcons name={error ? "refresh" : "download"} size={19} color="#FFFFFF" /><Text style={styles.updateButtonText}>{error ? "Tentar novamente" : "Baixar e instalar"}</Text></Pressable> : null}
    <Text style={styles.updateNote}>Ao terminar, o Android pedirá sua confirmação para instalar a nova versão.</Text>
  </View>;
}

function MenuItem({ icon, title, description, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; title: string; description: string; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}><View style={styles.menuIcon}><MaterialIcons name={icon} size={22} color="#0B5D52" /></View><View style={styles.menuText}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuDescription}>{description}</Text></View><MaterialIcons name="chevron-right" size={23} color="#92A09C" /></Pressable>; }

const styles = StyleSheet.create({ page: { paddingTop: 16 }, title: { color: "#18211F", fontSize: 27, lineHeight: 34, fontWeight: "800", letterSpacing: -0.7 }, subtitle: { color: "#60706C", fontSize: 13, marginTop: 2 }, profile: { marginTop: 24, backgroundColor: "#DDF1EA", borderRadius: 22, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }, avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#0B5D52" }, avatarText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 }, profileName: { color: "#18211F", fontSize: 16, fontWeight: "800" }, profileRole: { color: "#4D645E", fontSize: 12, marginTop: 3 }, menu: { marginTop: 16, backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 1, borderColor: "#E5ECE9", overflow: "hidden" }, menuItem: { minHeight: 77, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: "#EEF2F0" }, menuIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: "#EAF5F0", alignItems: "center", justifyContent: "center" }, menuText: { flex: 1 }, menuTitle: { color: "#18211F", fontSize: 15, fontWeight: "800" }, menuDescription: { color: "#60706C", fontSize: 12, marginTop: 3 }, updateCard: { marginTop: 12, borderRadius: 22, padding: 15, backgroundColor: "#EAF5F0", borderWidth: 1, borderColor: "#B9DDD2" }, updateTop: { flexDirection: "row", gap: 11, alignItems: "center" }, updateIcon: { width: 41, height: 41, borderRadius: 13, backgroundColor: "#D4ECE3", alignItems: "center", justifyContent: "center" }, updateText: { flex: 1 }, updateTitle: { color: "#18211F", fontSize: 15, fontWeight: "900" }, updateDescription: { color: "#4D645E", fontSize: 12, marginTop: 3 }, updateButton: { height: 44, marginTop: 14, borderRadius: 13, backgroundColor: "#0B5D52", flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" }, updateButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, updateNote: { color: "#60706C", fontSize: 11, lineHeight: 15, marginTop: 10 }, progressBlock: { marginTop: 14 }, progressLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }, progressText: { color: "#0B5D52", fontSize: 12, fontWeight: "800" }, progressTrack: { height: 8, borderRadius: 99, backgroundColor: "#CDE5DD", overflow: "hidden" }, progressFill: { height: "100%", backgroundColor: "#0B5D52", borderRadius: 99 }, installing: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 14 }, installingText: { color: "#0B5D52", fontSize: 12, fontWeight: "800" }, errorText: { color: "#B02727", fontSize: 12, lineHeight: 17, marginTop: 12 }, logout: { height: 52, borderRadius: 16, marginTop: 18, backgroundColor: "#FDEBEB", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }, logoutText: { color: "#C73737", fontWeight: "800", fontSize: 14 }, pressed: { opacity: 0.7, transform: [{ scale: 0.985 }] } });
