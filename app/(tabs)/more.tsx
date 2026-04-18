import { ExpiryIndicator } from "@/components/ui/expiry-indicator";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { COUNTRY_LABELS, type CountryCode } from "@/services/docs-registry";
import { useLicenseStore, useSettingsStore } from "@/store";
import { router } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const COUNTRIES = Object.entries(COUNTRY_LABELS) as [CountryCode, string][];

type MenuItem = {
  label: string;
  icon: string;
  route: string;
  description?: string;
};

const MENU_ITEMS: MenuItem[] = [
  {
    label: "Documents",
    icon: "doc.fill",
    route: "/(tabs)/documents",
    description: "All your vehicle documents",
  },
  {
    label: "Vehicles",
    icon: "car.fill",
    route: "/(tabs)/vehicles",
    description: "Manage your vehicles",
  },
  {
    label: "Driver's License",
    icon: "person.crop.circle.fill",
    route: "/license",
    description: "View & scan your license",
  },
  {
    label: "Maintenance Log",
    icon: "wrench.and.screwdriver.fill",
    route: "/maintenance/index",
    description: "Service history & reminders",
  },
  {
    label: "Fuel Log",
    icon: "fuelpump.fill",
    route: "/fuel/index",
    description: "Track fuel expenses & mileage",
  },
  {
    label: "Emergency Card",
    icon: "heart.fill",
    route: "/emergency",
    description: "Quick-access emergency info",
  },
  {
    label: "Settings",
    icon: "gearshape.fill",
    route: "/settings",
    description: "Region, cloud sync & notifications",
  },
];

export default function MoreScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const license = useLicenseStore((s) => s.license);
  const parsingMode = useSettingsStore((s) => s.parsingMode);
  const setParsingMode = useSettingsStore((s) => s.setParsingMode);
  const country = useSettingsStore((s) => s.country);
  const setCountry = useSettingsStore((s) => s.setCountry);
  const isEntityMode = parsingMode === "entity";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.header, { color: c.text }]}>More</Text>

        {/* Country picker */}
        <View
          style={[
            styles.settingsGroup,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <Text style={[styles.settingsGroupTitle, { color: c.subtext }]}>
            COUNTRY
          </Text>
          {COUNTRIES.map(([code, label]) => (
            <TouchableOpacity
              key={code}
              style={styles.menuItem}
              onPress={() => setCountry(code)}
              activeOpacity={0.7}
            >
              <View style={styles.menuText}>
                <Text style={[styles.menuLabel, { color: c.text }]}>
                  {label}
                </Text>
              </View>
              {country === code && (
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={20}
                  color={c.tint}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {license && (
          <TouchableOpacity
            style={[styles.licenseCard, { backgroundColor: c.tint }]}
            onPress={() => router.push("/license")}
            activeOpacity={0.8}
          >
            <View style={styles.licenseRow}>
              <IconSymbol
                name="person.crop.circle.fill"
                size={20}
                color="#fff"
              />
              <View style={styles.licenseInfo}>
                <Text style={styles.licenseCardName}>
                  {license.fields.fullName ?? ""}
                </Text>
                <Text style={styles.licenseCardSub}>
                  {license.fields.licenseNumber ?? ""}
                </Text>
              </View>
              <ExpiryIndicator expiryDate={license.fields.expiryDate ?? ""} />
            </View>
          </TouchableOpacity>
        )}

        <View
          style={[
            styles.menuGroup,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          {MENU_ITEMS.map((item, index) => (
            <React.Fragment key={item.route}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.menuIcon, { backgroundColor: c.tint + "18" }]}
                >
                  <IconSymbol
                    name={item.icon as any}
                    size={20}
                    color={c.tint}
                  />
                </View>
                <View style={styles.menuText}>
                  <Text style={[styles.menuLabel, { color: c.text }]}>
                    {item.label}
                  </Text>
                  {item.description ? (
                    <Text style={[styles.menuDesc, { color: c.subtext }]}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <IconSymbol name="chevron.right" size={16} color={c.subtext} />
              </TouchableOpacity>
              {index < MENU_ITEMS.length - 1 && (
                <View style={[styles.divider, { backgroundColor: c.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Scan parsing mode */}
        <View
          style={[
            styles.settingsGroup,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <Text style={[styles.settingsGroupTitle, { color: c.subtext }]}>
            SCANNING
          </Text>
          <View style={styles.toggleRow}>
            <View style={[styles.menuIcon, { backgroundColor: c.tint + "18" }]}>
              <IconSymbol name="text.viewfinder" size={20} color={c.tint} />
            </View>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: c.text }]}>
                Entity Extraction
              </Text>
              <Text style={[styles.menuDesc, { color: c.subtext }]}>
                {isEntityMode
                  ? "Using ML Kit entity extraction (dev build only)"
                  : "Using OCR text parsing (regex rules)"}
              </Text>
            </View>
            <Switch
              value={isEntityMode}
              onValueChange={(v) => setParsingMode(v ? "entity" : "ocr")}
              trackColor={{ true: c.tint }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  header: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
  licenseCard: { borderRadius: 14, padding: 16 },
  licenseRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  licenseInfo: { flex: 1 },
  licenseCardName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  licenseCardSub: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  menuGroup: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 16, fontWeight: "600" },
  menuDesc: { fontSize: 12, marginTop: 1 },
  divider: { height: 1, marginLeft: 64 },
  settingsGroup: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  settingsGroupTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
    marginLeft: 48,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
});
