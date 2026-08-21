import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useInventory } from "@/lib/inventory-context";

const icon = require("@/assets/images/icon.png");

export function LoginScreen() {
  const { signIn } = useInventory();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    const result = await signIn(username, password);
    setLoading(false);
    if (result.success) {
      setError(null);
      return;
    }
    setError(result.message ?? "Não foi possível iniciar a sessão.");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="p-6" containerClassName="bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.page}>
        <View style={styles.brand}>
          <Image source={icon} style={styles.logo} />
          <Text style={styles.title}>ValidaEstoque</Text>
          <Text style={styles.subtitle}>Controle de validade sem perder o ritmo da operação.</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.welcome}>Bem-vindo de volta</Text>
          <Text style={styles.helper}>Acesse para conferir o que precisa de atenção hoje.</Text>
          <Text style={styles.label}>Matrícula</Text>
          <View style={[styles.field, error && styles.fieldError]}>
            <MaterialIcons name="badge" size={20} color="#60706C" />
            <TextInput value={username} onChangeText={(value) => { setUsername(value); setError(null); }} style={styles.input} placeholder="Sua matrícula ou admin" autoCapitalize="none" autoCorrect={false} placeholderTextColor="#8A9894" returnKeyType="next" />
          </View>
          <Text style={styles.label}>Senha</Text>
          <View style={[styles.field, error && styles.fieldError]}>
            <MaterialIcons name="lock-outline" size={20} color="#60706C" />
            <TextInput value={password} onChangeText={(value) => { setPassword(value); setError(null); }} style={styles.input} placeholder="Use sua matrícula" placeholderTextColor="#8A9894" secureTextEntry returnKeyType="done" onSubmitEditing={() => void submit()} />
          </View>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <Pressable disabled={loading} accessibilityRole="button" accessibilityLabel="Entrar no ValidaEstoque" onPress={() => void submit()} style={({ pressed }) => [styles.button, (pressed || loading) && styles.buttonPressed]}>
            <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text><MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Cadastrar funcionário" onPress={() => router.push("/register" as never)} style={({ pressed }) => [styles.registerButton, pressed && styles.buttonPressed]}>
            <MaterialIcons name="person-add-alt-1" size={19} color="#0B5D52" /><Text style={styles.registerText}>Cadastrar funcionário</Text>
          </Pressable>
          <Text style={styles.accessHint}>O cadastro é liberado na hora e fica salvo para os próximos acessos.</Text>
        </View>
        <Text style={styles.footer}>Operação sincronizada com segurança entre aparelhos autorizados</Text>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: "space-between", paddingVertical: 24 }, brand: { alignItems: "center", paddingTop: 28 }, logo: { width: 82, height: 82, borderRadius: 22, marginBottom: 18 }, title: { color: "#18211F", fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.8 }, subtitle: { color: "#60706C", fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 8, maxWidth: 280 },
  form: { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 22, borderWidth: 1, borderColor: "#E5ECE9", shadowColor: "#0B5D52", shadowOpacity: 0.08, shadowRadius: 20, elevation: 2 }, welcome: { color: "#18211F", fontSize: 21, lineHeight: 27, fontWeight: "800" }, helper: { color: "#60706C", fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 24 }, label: { color: "#394844", fontSize: 13, fontWeight: "800", marginBottom: 7 }, field: { minHeight: 52, backgroundColor: "#F6F8F7", borderRadius: 14, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, borderWidth: 1, borderColor: "#E4EAE7", marginBottom: 17 }, fieldError: { borderColor: "#C73737" }, input: { flex: 1, color: "#18211F", fontSize: 16, marginLeft: 10, paddingVertical: 10 }, error: { color: "#A72F2F", fontSize: 12, fontWeight: "700", lineHeight: 17, marginTop: -8, marginBottom: 12 }, button: { height: 54, borderRadius: 16, backgroundColor: "#0B5D52", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 6 }, registerButton: { height: 48, borderRadius: 16, backgroundColor: "#EAF5F0", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 10, borderWidth: 1, borderColor: "#B9DDD2" }, registerText: { color: "#0B5D52", fontSize: 14, fontWeight: "800" }, buttonPressed: { opacity: 0.86, transform: [{ scale: 0.98 }] }, buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" }, accessHint: { color: "#60706C", fontSize: 11, textAlign: "center", marginTop: 13 }, footer: { color: "#7A8985", fontSize: 12, lineHeight: 18, textAlign: "center" },
});
