import { Card } from "@/components/ui/card";
import { ExpiryIndicator } from "@/components/ui/expiry-indicator";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, DocTypeColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CAR_DOCUMENT_TYPE_LABELS, CarDocument } from "@/models";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const DOC_TYPE_ICONS: Record<string, string> = {
  registration: "doc.text.fill",
  insurance: "shield.fill",
  inspection: "checkmark.seal.fill",
  title: "doc.badge.plus",
  roadworthy: "car.fill",
  emission: "leaf.fill",
  other: "doc.fill",
};

interface DocumentCardProps {
  document: CarDocument;
  vehicleName?: string;
}

export function DocumentCard({ document, vehicleName }: DocumentCardProps) {
  const scheme = useColorScheme() ?? "light";
  const accentColor = DocTypeColors[document.type] ?? DocTypeColors.other;

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: "/document/[id]", params: { id: document.id } })
      }
      activeOpacity={0.75}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconTile, { backgroundColor: "#1A1A1A" }]}>
            <IconSymbol
              name={(DOC_TYPE_ICONS[document.type] ?? "doc.fill") as any}
              size={20}
              color={accentColor}
            />
          </View>
          <View style={styles.info}>
            <Text style={[styles.type, { color: Colors[scheme].subtext }]}>
              {CAR_DOCUMENT_TYPE_LABELS[document.type]}
            </Text>
            <Text style={[styles.title, { color: Colors[scheme].text }]}>
              {document.title ?? CAR_DOCUMENT_TYPE_LABELS[document.type]}
            </Text>
            {vehicleName ? (
              <Text style={[styles.vehicle, { color: Colors[scheme].subtext }]}>
                {vehicleName}
              </Text>
            ) : null}
            <View style={styles.footer}>
              <ExpiryIndicator expiryDate={document.expiryDate} />
            </View>
          </View>
          <IconSymbol name="chevron.right" size={16} color={Colors[scheme].icon} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: { flex: 1, gap: 2 },
  type: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: { fontSize: 14, fontWeight: "700" },
  vehicle: { fontSize: 11 },
  footer: { marginTop: 6 },
});
