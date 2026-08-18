import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { formatCopyrightRange } from "@/lib/app-info-core";

const APP_VERSION = Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? "1.0.0";
const COPYRIGHT_PERIOD = formatCopyrightRange(new Date().getFullYear());

const resources = [
  { label: "Site Nordestão", url: "https://www.nordestaomaisvoce.com.br" },
  { label: "App Nossa Gente", url: "https://app.nordestao.com.br" },
  { label: "Nordestão Pra Você", url: "https://pravoce.nordestao.com.br/home" },
  { label: "Encarte", url: "https://pravoce.nordestao.com.br/tabloides" },
];

export default function AboutScreen() {
  const router = useRouter();
  const goBack = () => router.canGoBack() ? router.back() : router.replace("/(tabs)/more");

  return <ScreenContainer className="px-5" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={goBack} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" color="#0B5D52" size={22} /></Pressable><View style={styles.headerText}><Text style={styles.eyebrow}>INFORMAÇÕES DO APLICATIVO</Text><Text style={styles.title}>Sobre o Valida Estoque</Text></View></View>

    <View style={styles.versionCard}><View style={styles.versionIcon}><MaterialIcons name="inventory-2" size={24} color="#0B5D52" /></View><View style={styles.versionContent}><Text style={styles.versionLabel}>Versão instalada</Text><Text style={styles.versionValue}>v{APP_VERSION}</Text></View><View style={styles.liveDot} /></View>

    <Section title="Sobre o Valida Estoque"><Paragraph>O Valida Estoque foi desenvolvido por Alessandro P., colaborador e Operador de Caixa, a partir da observação das rotinas e necessidades presentes no dia a dia do supermercado.</Paragraph><Paragraph>O aplicativo foi idealizado como uma ferramenta de apoio para repositores, profissionais do estoque, gestores e demais colaboradores, buscando contribuir para uma gestão mais organizada e eficiente dos produtos.</Paragraph><Paragraph>Por meio do acompanhamento de datas de validade, lotes, quantidades, condições dos produtos e outras informações relevantes, o Valida Estoque tem como propósito facilitar a identificação de produtos próximos do vencimento, melhorar o acompanhamento das mercadorias e auxiliar na redução de perdas e desperdícios.</Paragraph></Section>

    <Section title="Agradecimentos"><Paragraph>Agradeço especialmente aos gestores, fiscais, repositores, operadores e demais colegas de trabalho que, direta ou indiretamente, contribuíram com experiências, sugestões e apoio para o desenvolvimento e aprimoramento desta ferramenta.</Paragraph><Paragraph>Cada contribuição é importante para que o aplicativo esteja cada vez mais próximo das necessidades reais de quem trabalha diariamente na operação.</Paragraph></Section>

    <Section title="Aviso institucional"><Paragraph>O Valida Estoque é uma ferramenta independente de apoio operacional e não substitui sistemas oficiais, procedimentos internos, normas, políticas ou orientações estabelecidas pela empresa.</Paragraph><Paragraph>Todas as marcas, nomes, logotipos, informações institucionais e demais elementos relacionados ao Supermercado Nordestão pertencem aos seus respectivos titulares e são utilizados exclusivamente no contexto de apoio às atividades internas.</Paragraph><Paragraph>O desenvolvimento deste aplicativo não implica transferência ou reivindicação de propriedade sobre marcas, dados ou materiais pertencentes à empresa.</Paragraph></Section>

    <View style={styles.signature}><Text style={styles.signatureName}>Desenvolvido por Alessandro P.</Text><Text style={styles.signatureText}>Da experiência na operação para facilitar o trabalho de toda a equipe.</Text><Text style={styles.handle}>@bichocutela · @haydendanex</Text></View>

    <View style={styles.resources}><Text style={styles.resourcesTitle}>Canais e informações</Text>{resources.map((resource) => <Pressable key={resource.url} accessibilityRole="link" accessibilityLabel={`Abrir ${resource.label}`} onPress={() => void Linking.openURL(resource.url)} style={({ pressed }) => [styles.resource, pressed && styles.pressed]}><MaterialIcons name="language" size={18} color="#0B5D52" /><Text style={styles.resourceText}>{resource.label}</Text><MaterialIcons name="open-in-new" size={17} color="#60706C" /></Pressable>)}</View>

    <Text style={styles.copyright}>© {COPYRIGHT_PERIOD} — Valida Estoque{"\n"}Todos os direitos reservados.</Text>
  </ScrollView></ScreenContainer>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }
function Paragraph({ children }: { children: React.ReactNode }) { return <Text style={styles.paragraph}>{children}</Text>; }

const styles = StyleSheet.create({ content: { paddingTop: 14, paddingBottom: 34 }, header: { flexDirection: "row", alignItems: "center", gap: 12 }, back: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF5F0" }, headerText: { flex: 1 }, eyebrow: { color: "#0B5D52", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, title: { color: "#18211F", fontSize: 23, fontWeight: "900", letterSpacing: -0.5, marginTop: 2 }, versionCard: { marginTop: 22, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#DDF1EA", borderRadius: 20, borderWidth: 1, borderColor: "#B9DDD2", padding: 15 }, versionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }, versionContent: { flex: 1 }, versionLabel: { color: "#4D645E", fontSize: 12, fontWeight: "700" }, versionValue: { color: "#18211F", fontSize: 19, fontWeight: "900", marginTop: 2 }, liveDot: { width: 9, height: 9, borderRadius: 9, backgroundColor: "#1E9E64" }, section: { marginTop: 26 }, sectionTitle: { color: "#18211F", fontSize: 17, fontWeight: "900", marginBottom: 9 }, paragraph: { color: "#4D5D59", fontSize: 14, lineHeight: 21, marginBottom: 12 }, signature: { marginTop: 14, padding: 17, borderRadius: 20, backgroundColor: "#0B5D52" }, signatureName: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" }, signatureText: { color: "#DDF1EA", fontSize: 13, lineHeight: 19, marginTop: 5 }, handle: { color: "#BCE5D6", fontSize: 12, fontWeight: "800", marginTop: 12 }, resources: { marginTop: 22, overflow: "hidden", backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#E5ECE9" }, resourcesTitle: { color: "#18211F", fontSize: 15, fontWeight: "900", paddingHorizontal: 15, paddingTop: 16, paddingBottom: 7 }, resource: { minHeight: 50, paddingHorizontal: 15, flexDirection: "row", gap: 10, alignItems: "center", borderTopWidth: 1, borderTopColor: "#EEF2F0" }, resourceText: { flex: 1, color: "#285247", fontSize: 13, fontWeight: "800" }, copyright: { color: "#788783", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 24 }, pressed: { opacity: 0.7, transform: [{ scale: 0.985 }] } });
