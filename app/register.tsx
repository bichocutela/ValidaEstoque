import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { validateRegistration } from "@/lib/auth-rules";
import { useInventory } from "@/lib/inventory-context";

export default function RegisterEmployeeScreen() {
  const router = useRouter();
  const { registerEmployee } = useInventory();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const validation = validateRegistration({ firstName, lastName, registrationNumber });
    if (validation) return setMessage(validation);
    setLoading(true);
    const result = await registerEmployee(firstName, lastName, registrationNumber);
    setLoading(false);
    setMessage(result.message);
    if (result.success) setTimeout(() => router.replace("/(tabs)"), 900);
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable accessibilityRole="button" accessibilityLabel="Voltar para entrada" onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={20} color="#0B5D52" /><Text style={styles.backText}>Voltar</Text></Pressable>
    <Text style={styles.title}>Cadastrar funcionário</Text><Text style={styles.subtitle}>Informe seus dados de matrícula. O acesso será liberado automaticamente e salvo com segurança.</Text>
    <View style={styles.card}>
      <Field label="Nome" value={firstName} onChangeText={setFirstName} placeholder="Nome do colaborador" />
      <Field label="Sobrenome" value={lastName} onChangeText={setLastName} placeholder="Sobrenome do colaborador" />
      <Field label="Matrícula" value={registrationNumber} onChangeText={setRegistrationNumber} placeholder="Será também a sua senha" />
      {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
      <Pressable disabled={loading} accessibilityRole="button" accessibilityLabel="Concluir cadastro" onPress={() => void submit()} style={({ pressed }) => [styles.submit, (pressed || loading) && { opacity: 0.82 }]}><Text style={styles.submitText}>{loading ? "Cadastrando..." : "Concluir cadastro"}</Text><MaterialIcons name="send" size={19} color="#FFFFFF" /></Pressable>
    </View>
  </ScrollView></ScreenContainer>;
}

function Field({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (text: string) => void; placeholder: string }) { return <View><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} style={styles.input} placeholder={placeholder} placeholderTextColor="#8A9894" autoCapitalize={label === "Matrícula" ? "none" : "words"} /></View>; }
const styles = StyleSheet.create({ page: { paddingTop: 18, paddingBottom: 40 }, back: { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", paddingVertical: 8 }, backText: { color: "#0B5D52", fontWeight: "800" }, title: { fontSize: 28, lineHeight: 35, fontWeight: "900", color: "#18211F", marginTop: 18 }, subtitle: { color: "#60706C", fontSize: 14, lineHeight: 20, marginTop: 6 }, card: { marginTop: 24, backgroundColor: "#FFFFFF", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "#E5ECE9", gap: 9 }, label: { color: "#394844", fontSize: 13, fontWeight: "800", marginTop: 5 }, input: { minHeight: 50, backgroundColor: "#F6F8F7", borderRadius: 14, paddingHorizontal: 14, color: "#18211F", fontSize: 15, borderWidth: 1, borderColor: "#E4EAE7" }, message: { color: "#0B5D52", lineHeight: 18, fontSize: 12, fontWeight: "700", marginTop: 6 }, submit: { height: 52, marginTop: 8, backgroundColor: "#0B5D52", borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, submitText: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 } });
