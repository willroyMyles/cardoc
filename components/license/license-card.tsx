import { ExpiryIndicator } from "@/components/ui/expiry-indicator";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { JamaicanDriverLicense } from "@/models";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface LicenseCardProps {
  license: JamaicanDriverLicense;
  onPress?: () => void;
}

export function LicenseCard({ license, onPress }: LicenseCardProps) {
  const scheme = useColorScheme() ?? "light";
  const isDark = scheme === "dark";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.8 : 1}>
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>DRIVER'S LICENCE</Text>
          <Text style={styles.issuer}>GOVERNMENT OF JAMAICA</Text>
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
            <Text style={styles.name}>{license.fullName}</Text>
            {!!license.licenseNumber && (
              <Text style={styles.field}>
                <Text style={styles.fieldLabel}>Lic No: </Text>
                {license.licenseNumber}
              </Text>
            )}
            {!!license.trn && (
              <Text style={styles.field}>
                <Text style={styles.fieldLabel}>TRN: </Text>
                {license.trn}
              </Text>
            )}
            {!!license.dateOfBirth && (
              <Text style={styles.field}>
                <Text style={styles.fieldLabel}>DOB: </Text>
                {new Date(license.dateOfBirth).toLocaleDateString()}
              </Text>
            )}
            {!!license.sex && (
              <Text style={styles.field}>
                <Text style={styles.fieldLabel}>Sex: </Text>
                {license.sex === "M" ? "Male" : "Female"}
              </Text>
            )}
            {!!license.licenseClass && (
              <Text style={styles.field}>
                <Text style={styles.fieldLabel}>Class: </Text>
                {license.licenseClass}
              </Text>
            )}
            {!!license.nationality && (
              <Text style={styles.field}>
                <Text style={styles.fieldLabel}>Nationality: </Text>
                {license.nationality}
              </Text>
            )}
            {!!license.collectorate && (
              <Text style={styles.field}>
                <Text style={styles.fieldLabel}>Collectorate: </Text>
                {license.collectorate}
              </Text>
            )}
            {!!license.licenseToDrive && (
              <Text style={styles.field}>
                <Text style={styles.fieldLabel}>Lic to Drive: </Text>
                {license.licenseToDrive}
              </Text>
            )}
            {!!license.controlNumber && (
              <Text style={styles.field}>
                <Text style={styles.fieldLabel}>Control No: </Text>
                {license.controlNumber}
              </Text>
            )}
          </View>
        </View>
        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            {!!license.issueDate && (
              <Text style={styles.footerField}>
                <Text style={styles.expiryLabel}>Issued: </Text>
                <Text style={styles.expiryDate}>
                  {new Date(license.issueDate).toLocaleDateString()}
                </Text>
              </Text>
            )}
            {!!license.originalIssueDate &&
              license.originalIssueDate !== license.issueDate && (
                <Text style={styles.footerField}>
                  <Text style={styles.expiryLabel}>Orig Issue: </Text>
                  <Text style={styles.expiryDate}>
                    {new Date(license.originalIssueDate).toLocaleDateString()}
                  </Text>
                </Text>
              )}
          </View>
          <Text style={styles.expiryLabel}>Expires</Text>
          <View style={styles.expiryRow}>
            <Text style={styles.expiryDate}>
              {new Date(license.expiryDate).toLocaleDateString()}
            </Text>
            <ExpiryIndicator expiryDate={license.expiryDate} />
          </View>
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
