import { ExpiryIndicator } from "@/components/ui/expiry-indicator";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { AccentColor, Colors, Radius, Shadows, Spacing, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DynamicDriverLicense } from "@/models";
import {
    getDriverLicenseSpec,
    type DriverLicenseSpec,
} from "@/services/docs-registry";
import React, { useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";

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
  const c = Colors[scheme];
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  let spec: DriverLicenseSpec | null = specProp ?? null;
  if (!spec) {
    try {
      spec = getDriverLicenseSpec(license.country);
    } catch {
      spec = null;
    }
  }

  const cardBackground = c.card;
  const borderColor = c.border;

  if (!spec) {
    return (
      <AnimatedPressable onPress={onPress}>
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}> 
          <Text style={[styles.headerLabel, { color: c.subtext }]}>{"DRIVER'S LICENSE"}</Text>
          <Text style={[styles.field, { color: c.text }]}>
            {Object.entries(license.fields)
              .filter(([, v]) => v)
              .slice(0, 4)
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n")}
          </Text>
        </View>
      </AnimatedPressable>
    );
  }

  const canPreviewFront =
    license.imageUriFront &&
    (license.imageMimeTypeFront?.startsWith("image/") ||
      /\.(jpe?g|png|webp|gif)$/i.test(license.imageUriFront));

  return (
    <>
      <AnimatedPressable onPress={onPress}>
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}> 
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <Text style={[styles.headerLabel, { color: c.subtext }]}>
                {spec.label.toUpperCase()}
              </Text>
              <Text style={[styles.issuer, { color: c.text }]}>{spec.issuing_authority}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: c.tint }]}>
              <Text style={styles.badgeText}>{"Driver's licence"}</Text>
            </View>
          </View>

          <View style={styles.body}> 
            <View style={styles.photoContainer}>
              {license.imageUriFront ? (
                <AnimatedPressable
                  onPress={() =>
                    canPreviewFront
                      ? setViewerUri(license.imageUriFront!)
                      : Alert.alert(
                          "Cannot preview",
                          "This license file cannot be previewed here.",
                        )
                  }
                  pressedScale={0.98}
                >
                  {canPreviewFront ? (
                    <Image
                      source={{ uri: license.imageUriFront }}
                      style={[styles.photo, { borderColor: c.border }]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.photo,
                        styles.photoPlaceholder,
                        { backgroundColor: c.background, borderColor: c.border },
                      ]}
                    >
                      <Text style={[styles.photoPlaceholderText, { color: c.subtext }]}>Doc</Text>
                    </View>
                  )}
                </AnimatedPressable>
              ) : (
                <View
                  style={[
                    styles.photo,
                    styles.photoPlaceholder,
                    { backgroundColor: c.background, borderColor: c.border },
                  ]}
                >
                  <Text style={[styles.photoPlaceholderText, { color: AccentColor }]}>Photo</Text>
                </View>
              )}
            </View>

            <View style={styles.details}> 
              {Object.entries(spec.fields).map(([key, fieldSpec]) => {
                const val = license.fields[key];
                if (!val) return null;
                if (key === "fullName") {
                  return (
                    <Text key={key} style={[styles.name, { color: c.text }]} numberOfLines={2}>
                      {val}
                    </Text>
                  );
                }
                return (
                  <Text key={key} style={[styles.field, { color: c.text }]} numberOfLines={1}>
                    <Text style={[styles.fieldLabel, { color: c.subtext }]}>{(fieldSpec.label ?? key) + ": "}</Text>
                    {fieldSpec.type === "date"
                      ? new Date(val).toLocaleDateString()
                      : val}
                  </Text>
                );
              })}
            </View>
          </View>

          <View style={[styles.footer, { borderTopColor: c.border }]}> 
            <View style={styles.footerRow}> 
              {!!license.fields.issueDate && (
                <Text style={[styles.footerField, { color: c.text }]}>
                  <Text style={[styles.expiryLabel, { color: c.subtext }]}>Issued:</Text>{" "}
                  <Text style={[styles.expiryDate, { color: c.text }]}>
                    {new Date(license.fields.issueDate).toLocaleDateString()}
                  </Text>
                </Text>
              )}
            </View>
            {!!license.fields.expiryDate && (
              <> 
                <Text style={[styles.expiryLabel, { color: c.subtext }]}>Expires</Text>
                <View style={styles.expiryRow}> 
                  <Text style={[styles.expiryDate, { color: c.text }]}>
                    {new Date(license.fields.expiryDate).toLocaleDateString()}
                  </Text>
                  <ExpiryIndicator expiryDate={license.fields.expiryDate} />
                </View>
              </>
            )}
          </View>
        </View>
      </AnimatedPressable>

      <ImageViewerModal visible={!!viewerUri} uri={viewerUri} onClose={() => setViewerUri(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.page,
    borderRadius: Radius.card,
    padding: Spacing.cardPadding,
    gap: Spacing.stackGap,
    borderWidth: 1,
    ...Shadows.card,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerLabel: {
    ...Type.sectionLabel,
  },
  issuer: {
    ...Type.caption,
    fontWeight: "600",
    marginTop: 4,
  },
  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  body: {
    flexDirection: "row",
    gap: 16,
  },
  photoContainer: {
    width: 98,
  },
  photo: {
    width: 98,
    height: 118,
    borderRadius: Radius.surface,
    borderWidth: 1,
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: {
    ...Type.caption,
    fontWeight: "700",
  },
  details: {
    flex: 1,
    gap: 8,
    justifyContent: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  field: {
    ...Type.body,
  },
  fieldLabel: {
    ...Type.caption,
    fontWeight: "600",
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 10,
  },
  footerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  footerField: {
    ...Type.caption,
    fontWeight: "600",
  },
  expiryLabel: {
    ...Type.sectionLabel,
    fontWeight: "700",
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  expiryDate: {
    ...Type.body,
    fontWeight: "700",
  },
});
