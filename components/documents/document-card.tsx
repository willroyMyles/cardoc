import { Card } from "@/components/ui/card";
import { ExpiryIndicator } from "@/components/ui/expiry-indicator";
import { Colors, DocTypeColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CAR_DOCUMENT_TYPE_LABELS, CarDocument } from "@/models";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
          <View style={[styles.typeAccent, { backgroundColor: accentColor }]} />
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
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 6, overflow: "hidden" },
  row: { flexDirection: "row", gap: 12 },
  typeAccent: { width: 4, borderRadius: 2, alignSelf: "stretch" },
  info: { flex: 1, gap: 2 },
  type: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: { fontSize: 16, fontWeight: "600" },
  vehicle: { fontSize: 13 },
  footer: { marginTop: 8 },
});
