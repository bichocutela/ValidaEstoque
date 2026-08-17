import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useInventory } from "@/lib/inventory-context";
import { ScreenContainer } from "@/components/screen-container";

const icon = require("@/assets/images/icon.png");

export function LoginScreen() {
  const { signIn } = useInventory();
  const [employee, setEmployee] = useState("Mariana Costa");
  const [password, setPassword] = useState("123456");
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="p-6" containerClassName="bg-background">
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.page}>
      <View style={styles.brand}><Image source={icon} style={styles.logo} /><Text style={styles.title}>ValidaEstoque</Text><Text style={styles.subtitle}>Controle de validade sem perder o ritmo da operação.</Text></View>
      <View style={styles.form}>
        <Text style={styles.welcome}>Bem-vinda de volta</Text><Text style={styles.helper}>Acesse para conferir o que precisa de atenção hoje.</Text>
        <Text style={styles.label}>Funcionário</Text><View style={styles.field}><MaterialIcons name="badge" size={20} color="#60706C" /><TextInput value={employee} onChangeText={setEmployee} style={styles.input} placeholder="Nome do funcionário" placeholderTextColor="#8A9894" returnKeyType="next" /></View>
        <Text style={styles.label}>Senha</Text><View style={styles.field}><MaterialIcons name="lock-outline" size={20} color="#60706C" /><TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="Senha" placeholderTextColor="#8A9894" secureTextEntry returnKeyType="done" onSubmitEditing={() => signIn(employee)} /></View>
        <Pressable onPress={() => signIn(employee)} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}><Text style={styles.buttonText}>Entrar</Text><MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" /></Pressable>
      </View>
      <Text style={styles.footer}>Ambiente local de operação · dados salvos neste dispositivo</Text>
    </KeyboardAvoidingView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: "space-between", paddingVertical: 24 }, brand: { alignItems: "center", paddingTop: 28 }, logo: { width: 82, height: 82, borderRadius: 22, marginBottom: 18 }, title: { color: "#18211F", fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.8 }, subtitle: { color: "#60706C", fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 8, maxWidth: 280 },
  form: { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 22, borderWidth: 1, borderColor: "#E5ECE9", shadowColor: "#0B5D52", shadowOpacity: 0.08, shadowRadius: 20, elevation: 2 }, welcome: { color: "#18211F", fontSize: 21, lineHeight: 27, fontWeight: "800" }, helper: { color: "#60706C", fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 24 }, label: { color: "#394844", fontSize: 13, fontWeight: "800", marginBottom: 7 }, field: { minHeight: 52, backgroundColor: "#F6F8F7", borderRadius: 14, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, borderWidth: 1, borderColor: "#E4EAE7", marginBottom: 17 }, input: { flex: 1, color: "#18211F", fontSize: 16, marginLeft: 10, paddingVertical: 10 }, button: { height: 54, borderRadius: 16, backgroundColor: "#0B5D52", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 6 }, buttonPressed: { opacity: 0.86, transform: [{ scale: 0.98 }] }, buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" }, footer: { color: "#7A8985", fontSize: 12, lineHeight: 18, textAlign: "center" },
});
