import { ExpiryIndicator } from "@/components/ui/expiry-indicator";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Colors, DocTypeColors, Spacing, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CAR_DOCUMENT_TYPE_LABELS, CarDocument } from "@/models";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface DocumentCardProps {
  document: CarDocument;
  vehicleName?: string;
  onPress?: () => void;
}

export function DocumentCard({
  document,
  vehicleName,
  onPress,
}: DocumentCardProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const accentColor = DocTypeColors[document.type] ?? DocTypeColors.other;
  const expiryDate = new Date(document.expiryDate);
  const expiryLabel = isNaN(expiryDate.getTime())
    ? document.expiryDate
    : expiryDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  return (
    <AnimatedPressable
      onPress={
        onPress ??
        (() =>
          router.push({
            pathname: "/document/[id]",
            params: { id: document.id },
          }))
      }
      style={[
        styles.card,
        { backgroundColor: c.card, borderColor: c.border },
      ]}
    >
      <View style={[styles.statusRail, { backgroundColor: accentColor }]} />

      <View style={styles.topRow}>
        <Text style={[styles.number, { color: c.subtext }]} numberOfLines={1}>
          {document.documentNumber || "No document number"}
        </Text>
        <ExpiryIndicator expiryDate={document.expiryDate} />
      </View>

      <View style={styles.mainRow}>
        <View style={styles.info}>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
            {document.title ?? CAR_DOCUMENT_TYPE_LABELS[document.type]}
          </Text>
        </View>
        <Text
          style={[styles.type, { color: c.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {CAR_DOCUMENT_TYPE_LABELS[document.type]}
        </Text>
      </View>

      <Text style={[styles.sub, { color: c.subtext }]} numberOfLines={1}>
        {vehicleName
          ? `${vehicleName} / Expires ${expiryLabel}`
          : `Expires ${expiryLabel}`}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.page,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "hidden",
  },
  statusRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 5,
  },
  mainRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  info: { flex: 1, gap: 2, minWidth: 0 },
  number: {
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: { fontSize: 13, lineHeight: 17, fontWeight: "700" },
  sub: Type.caption,
  type: {
    maxWidth: 116,
    minWidth: 74,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
});
