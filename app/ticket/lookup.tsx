import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { TicketLookupProvider } from "@/services/ticket-lookup/provider";
import {
    getProvidersByRegion
} from "@/services/ticket-lookup/registry";
import { useSettingsStore } from "@/store";
import React, { useState } from "react";
import {
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { WebView } from "react-native-webview";

export default function TicketLookupScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const country = useSettingsStore((s) => s.country);

  const providers = getProvidersByRegion(country);
  const [selected, setSelected] = useState<TicketLookupProvider | null>(null);

  if (selected) {
    const url = selected.lookupUrl();
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.background }]}
      >
        <View
          style={[
            styles.webviewHeader,
            { backgroundColor: c.card, borderBottomColor: c.border },
          ]}
        >
          <TouchableOpacity onPress={() => setSelected(null)}>
            <IconSymbol name="arrow.left" size={20} color={c.tint} />
          </TouchableOpacity>
          <Text
            style={[styles.webviewTitle, { color: c.text }]}
            numberOfLines={1}
          >
            {selected.displayName}
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(url)}>
            <IconSymbol name="square.and.arrow.up" size={20} color={c.tint} />
          </TouchableOpacity>
        </View>
        <WebView source={{ uri: url }} style={styles.webview} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.intro, { color: c.subtext }]}>
          Select a service to look up traffic fines and infringement notices via
          the official government website.
        </Text>

        {providers.length === 0 ? (
          <Text style={[styles.noProviders, { color: c.subtext }]}>
            No lookup services configured for your region. Update your region in
            Settings.
          </Text>
        ) : (
          providers.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelected(p)}
              activeOpacity={0.75}
            >
              <Card style={styles.providerCard}>
                <View style={styles.providerRow}>
                  <View style={styles.providerInfo}>
                    <Text style={[styles.providerName, { color: c.text }]}>
                      {p.displayName}
                    </Text>
                    <Text
                      style={[
                        styles.providerInstructions,
                        { color: c.subtext },
                      ]}
                    >
                      {p.instructions}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={18} color={c.icon} />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity
          style={[
            styles.settingsBtn,
            { borderColor: c.border, backgroundColor: c.card },
          ]}
          onPress={() => require("expo-router").router.push("/settings")}
        >
          <IconSymbol name="gearshape.fill" size={16} color={c.tint} />
          <Text style={[styles.settingsBtnText, { color: c.tint }]}>
            Change Region in Settings
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  intro: { fontSize: 14, lineHeight: 20 },
  noProviders: { fontSize: 14, textAlign: "center", marginVertical: 24 },
  providerCard: { marginHorizontal: 0 },
  providerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  providerInfo: { flex: 1, gap: 4 },
  providerName: { fontSize: 15, fontWeight: "700" },
  providerInstructions: { fontSize: 13, lineHeight: 18 },
  webviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  webviewTitle: { flex: 1, fontSize: 15, fontWeight: "600" },
  webview: { flex: 1 },
  settingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingsBtnText: { fontSize: 15, fontWeight: "600" },
});
