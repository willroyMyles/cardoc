import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function HomeScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <ThemedText type="title">Home</ThemedText>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.scanCard, { backgroundColor: c.tint }]}
          onPress={() => router.push("/scan")}
          activeOpacity={0.85}
        >
          <View style={styles.scanIconWrap}>
            <IconSymbol name="doc.text.viewfinder" size={48} color="#fff" />
          </View>
          <Text style={styles.scanTitle}>Scan to begin</Text>
          <Text style={styles.scanSubtitle}>
            Scan a document or driver's license to get started
          </Text>
        </TouchableOpacity>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[
              styles.quickBtn,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
            onPress={() => router.push("/vehicle/add")}
            activeOpacity={0.75}
          >
            <IconSymbol name="car.fill" size={22} color={c.tint} />
            <Text style={[styles.quickBtnLabel, { color: c.text }]}>
              Add Vehicle
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickBtn,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
            onPress={() => router.push("/document/add")}
            activeOpacity={0.75}
          >
            <IconSymbol name="doc.fill" size={22} color={c.tint} />
            <Text style={[styles.quickBtnLabel, { color: c.text }]}>
              Add Document
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 16,
  },
  scanCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  scanIconWrap: {
    marginBottom: 4,
  },
  scanTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  scanSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  quickRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickBtnLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
