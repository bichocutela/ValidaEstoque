import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { roleLabel } from "@/lib/auth-rules";
import { useInventory } from "@/lib/inventory-context";
import { supabase, type EmployeeRole, type EmployeeStatus } from "@/lib/supabase-client";

type Staff = { id: string; full_name: string; registration_number: string | null; role: EmployeeRole; status: EmployeeStatus; last_login_at: string | null; created_at: string };
type AuditEvent = { id: string; user_id: string; event_type: string; entity_type: string | null; occurred_at: string };

const eventLabels: Record<string, string> = { login: "Entrou no aplicativo", logout: "Encerrou a sessão", signup: "Criou o cadastro", product_created: "Cadastrou produto", lot_created: "Cadastrou lote", movement_created: "Registrou movimentação" };
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Ainda não acessou";

export default function AdminScreen() {
  const router = useRouter();
  const { employeeRole } = useInventory();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    const [staffResult, eventsResult] = await Promise.all([
      supabase.from("employee_profiles").select("id,full_name,registration_number,role,status,last_login_at,created_at").order("created_at", { ascending: false }),
      supabase.from("employee_access_events").select("id,user_id,event_type,entity_type,occurred_at").order("occurred_at", { ascending: false }).limit(40),
    ]);
    if (!staffResult.error) setStaff((staffResult.data ?? []) as Staff[]);
    if (!eventsResult.error) setEvents((eventsResult.data ?? []) as AuditEvent[]);
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { if (employeeRole !== "admin") router.replace("/(tabs)"); }, [employeeRole, router]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => { const interval = setInterval(() => void load(true), 15000); return () => clearInterval(interval); }, [load]);

  const staffNames = useMemo(() => new Map(staff.map((item) => [item.id, item.full_name])), [staff]);
  const updateStatus = async (person: Staff) => {
    const nextStatus: EmployeeStatus = person.status === "suspended" ? "active" : "suspended";
    const { error } = await supabase.from("employee_profiles").update({ status: nextStatus }).eq("id", person.id);
    if (!error) await load(true);
  };

  if (loading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color="#0B5D52" /></ScreenContainer>;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5" containerClassName="bg-background"><FlatList data={events} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor="#0B5D52" />} ListHeaderComponent={<><View style={styles.header}><Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Voltar" style={styles.back}><MaterialIcons name="arrow-back" size={20} color="#0B5D52" /></Pressable><View><Text style={styles.title}>Administração</Text><Text style={styles.subtitle}>Acompanhamento atualizado automaticamente</Text></View></View><View style={styles.summary}><Summary label="Funcionários" value={String(staff.length)} icon="groups" /><Summary label="Ativos" value={String(staff.filter((item) => item.status === "active").length)} icon="verified-user" /><Summary label="Eventos" value={String(events.length)} icon="fact-check" /></View><Text style={styles.sectionTitle}>Funcionários cadastrados</Text><View style={styles.staffList}>{staff.map((person) => <View key={person.id} style={styles.staffCard}><View style={styles.initials}><Text style={styles.initialsText}>{person.full_name.slice(0, 2).toUpperCase()}</Text></View><View style={styles.staffText}><Text style={styles.staffName}>{person.full_name}</Text><Text style={styles.staffMeta}>Matrícula: {person.registration_number ?? "—"} · {roleLabel(person.role)}</Text><Text style={styles.staffMeta}>Último acesso: {formatDate(person.last_login_at)}</Text></View>{person.role !== "admin" ? <Pressable onPress={() => void updateStatus(person)} style={[styles.statusButton, person.status === "suspended" && styles.statusSuspended]}><Text style={styles.statusText}>{person.status === "suspended" ? "Reativar" : "Suspender"}</Text></Pressable> : <View style={styles.adminTag}><Text style={styles.adminTagText}>Admin</Text></View>}</View>)}</View><Text style={styles.sectionTitle}>Eventos recentes</Text></>} renderItem={({ item }) => <View style={styles.eventCard}><View style={styles.eventIcon}><MaterialIcons name="history" size={18} color="#0B5D52" /></View><View style={styles.eventText}><Text style={styles.eventTitle}>{eventLabels[item.event_type] ?? item.event_type}</Text><Text style={styles.eventMeta}>{staffNames.get(item.user_id) ?? "Funcionário"} · {formatDate(item.occurred_at)}</Text></View></View>} ListEmptyComponent={<Text style={styles.empty}>Ainda não há eventos sincronizados.</Text>} contentContainerStyle={styles.content} /></ScreenContainer>;
}

function Summary({ label, value, icon }: { label: string; value: string; icon: React.ComponentProps<typeof MaterialIcons>["name"] }) { return <View style={styles.summaryItem}><MaterialIcons name={icon} size={19} color="#0B5D52" /><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({ content: { paddingTop: 14, paddingBottom: 34 }, header: { flexDirection: "row", gap: 12, alignItems: "center" }, back: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#EAF5F0", alignItems: "center", justifyContent: "center" }, title: { color: "#18211F", fontSize: 25, fontWeight: "900" }, subtitle: { color: "#60706C", fontSize: 12, marginTop: 3 }, summary: { flexDirection: "row", gap: 9, marginTop: 21 }, summaryItem: { flex: 1, minHeight: 100, padding: 12, borderRadius: 18, backgroundColor: "#EAF5F0", justifyContent: "space-between" }, summaryValue: { color: "#18211F", fontSize: 23, fontWeight: "900", marginTop: 4 }, summaryLabel: { color: "#4D645E", fontSize: 11, fontWeight: "700" }, sectionTitle: { color: "#18211F", fontSize: 16, fontWeight: "900", marginTop: 25, marginBottom: 10 }, staffList: { gap: 9 }, staffCard: { padding: 12, borderWidth: 1, borderColor: "#E5ECE9", borderRadius: 17, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 10 }, initials: { width: 39, height: 39, borderRadius: 13, backgroundColor: "#DDF1EA", alignItems: "center", justifyContent: "center" }, initialsText: { color: "#0B5D52", fontWeight: "900", fontSize: 12 }, staffText: { flex: 1 }, staffName: { color: "#18211F", fontSize: 14, fontWeight: "900" }, staffMeta: { color: "#60706C", fontSize: 10, marginTop: 3 }, statusButton: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10, backgroundColor: "#FDEBEB" }, statusSuspended: { backgroundColor: "#EAF5F0" }, statusText: { color: "#A72F2F", fontSize: 10, fontWeight: "900" }, adminTag: { paddingHorizontal: 8, paddingVertical: 5, backgroundColor: "#DDF1EA", borderRadius: 8 }, adminTagText: { color: "#0B5D52", fontSize: 10, fontWeight: "900" }, eventCard: { flexDirection: "row", gap: 11, padding: 13, marginBottom: 8, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5ECE9" }, eventIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#EAF5F0", alignItems: "center", justifyContent: "center" }, eventText: { flex: 1 }, eventTitle: { color: "#18211F", fontSize: 13, fontWeight: "800" }, eventMeta: { color: "#60706C", fontSize: 11, marginTop: 4 }, empty: { color: "#60706C", textAlign: "center", paddingVertical: 18 } });
