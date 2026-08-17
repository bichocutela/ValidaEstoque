import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useInventory } from "@/lib/inventory-context";

export default function TabLayout() {
  const colors = useColors();
  const { signedIn } = useInventory();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: signedIn ? {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        } : { display: "none" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Início", tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} /> }} />
      <Tabs.Screen name="products" options={{ title: "Produtos", tabBarIcon: ({ color }) => <IconSymbol size={27} name="shippingbox.fill" color={color} /> }} />
      <Tabs.Screen name="scanner" options={{ title: "Scanner", tabBarIcon: ({ color }) => <IconSymbol size={28} name="barcode.viewfinder" color={color} /> }} />
      <Tabs.Screen name="expiry" options={{ title: "Validades", tabBarIcon: ({ color }) => <IconSymbol size={25} name="calendar" color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: "Mais", tabBarIcon: ({ color }) => <IconSymbol size={28} name="ellipsis.circle.fill" color={color} /> }} />
    </Tabs>
  );
}
