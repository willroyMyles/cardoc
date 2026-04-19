import { ExpiryIndicator } from "@/components/ui/expiry-indicator";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DynamicDriverLicense } from "@/models";
import {
  getDriverLicenseSpec,
  type DriverLicenseSpec,
} from "@/services/docs-registry";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface LicenseCardProps {
  license: DynamicDriverLicense;
  spec?: DriverLicenseSpec;
  onPress?: () => void;
}

export function LicenseCard({
  license,
  spec: specProp,
  onPress,
}: LicenseCardProps) {
  const scheme = useColorScheme() ?? "light";
  const isDark = scheme === "dark";

  let spec: DriverLicenseSpec | null = specProp ?? null;
  if (!spec) {
    try {
      spec = getDriverLicenseSpec(license.country);
    } catch {
      spec = null;
    }
  }

  if (!spec) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.8 : 1}>
        <View
          style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
        >
          <Text style={styles.headerLabel}>DRIVER'S LICENSE</Text>
          <Text style={styles.field}>
            {Object.entries(license.fields)
              .filter(([, v]) => v)
              .slice(0, 4)
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.8 : 1}>
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>{spec.label.toUpperCase()}</Text>
          <Text style={styles.issuer}>{spec.issuing_authority}</Text>
        </View>
        {/* Body */}
        <View style={styles.body}>
          {license.imageUriFront ? (
            <Image
              source={{ uri: license.imageUriFront }}
              style={styles.photo}
            />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={styles.photoPlaceholderText}>📷</Text>
            </View>
          )}
          <View style={styles.details}>
            {Object.entries(spec.fields).map(([key, fieldSpec]) => {
              const val = license.fields[key];
              if (!val) return null;
              if (key === "fullName") {
                return (
                  <Text key={key} style={styles.name}>
                    {val}
                  </Text>
                );
              }
              return (
                <Text key={key} style={styles.field}>
                  <Text style={styles.fieldLabel}>
                    {(fieldSpec.label ?? key) + ": "}
                  </Text>
                  {fieldSpec.type === "date"
                    ? new Date(val).toLocaleDateString()
                    : val}
                </Text>
              );
            })}
          </View>
        </View>
        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            {!!license.fields.issueDate && (
              <Text style={styles.footerField}>
                <Text style={styles.expiryLabel}>Issued: </Text>
                <Text style={styles.expiryDate}>
                  {new Date(license.fields.issueDate).toLocaleDateString()}
                </Text>
              </Text>
            )}
          </View>
          {!!license.fields.expiryDate && (
            <>
              <Text style={styles.expiryLabel}>Expires</Text>
              <View style={styles.expiryRow}>
                <Text style={styles.expiryDate}>
                  {new Date(license.fields.expiryDate).toLocaleDateString()}
                </Text>
                <ExpiryIndicator expiryDate={license.fields.expiryDate} />
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardLight: { backgroundColor: "#1A4C8F" },
  cardDark: { backgroundColor: "#0D2A55" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  issuer: { color: "#fff", fontSize: 12, fontWeight: "600" },
  body: { flexDirection: "row", gap: 16 },
  photo: { width: 72, height: 88, borderRadius: 8 },
  photoPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: { fontSize: 28 },
  details: { flex: 1, gap: 4 },
  name: { color: "#fff", fontSize: 17, fontWeight: "700" },
  field: { color: "rgba(255,255,255,0.9)", fontSize: 13 },
  fieldLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 12,
    gap: 4,
  },
  footerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 6,
  },
  footerField: { color: "rgba(255,255,255,0.9)", fontSize: 12 },
  expiryLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
  },
  expiryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  expiryDate: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
