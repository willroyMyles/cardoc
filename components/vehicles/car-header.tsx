import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, StatusColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Vehicle } from "@/models";
import { useAuthStore } from "@/store";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type CarHeaderTab =
  | "dashboard"
  | "doc vault"
  | "maintenance"
  | "fuel"
  | "appointments"
  | "tickets";

interface CarHeaderProps {
  vehicles: Vehicle[];
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
  activeTab: CarHeaderTab;
  onTabChange: (tab: CarHeaderTab) => void;
  synced?: boolean;
}

const TABS: { key: CarHeaderTab; label: string }[] = [
  { key: "dashboard", label: "DASHBOARD" },
  { key: "doc vault", label: "DOC VAULT" },
  { key: "maintenance", label: "MAINTENANCE" },
  { key: "fuel", label: "FUEL" },
  { key: "tickets", label: "TICKETS" },
  { key: "appointments", label: "APPOINTMENTS" },
];

function getInitials(displayName: string | null | undefined): string {
  if (!displayName) return "?";
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CarHeader({
  vehicles,
  activeIndex,
  onPrev,
  onNext,
  activeTab,
  onTabChange,
  synced = true,
}: CarHeaderProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const user = useAuthStore((s) => s.user);

  const vehicle = vehicles[activeIndex];
  const vehicleName = vehicle
    ? `${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}`
    : "NO VEHICLE";

  const initials = getInitials(user?.displayName);
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < vehicles.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: c.card }]}>
      {/* ── Top row ── */}
      <View style={styles.topRow}>
        <Text style={[styles.systemLabel, { color: c.subtext }]}>
          CARDOC
        </Text>

        <View style={styles.topRight}>
          <View style={styles.syncBadge}>
            <View
              style={[
                styles.syncDot,
                {
                  backgroundColor: synced
                    ? StatusColors.success
                    : StatusColors.warning,
                },
              ]}
            />
            <Text style={[styles.syncText, { color: c.text }]}>
              {synced ? "SYNCED" : "SYNCING"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.avatar, { backgroundColor: c.tint }]}
          >
            <Text style={[styles.avatarText, { color: c.background }]}> 
              {initials}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Vehicle name row ── */}
      <View style={styles.nameRow}>
        <TouchableOpacity
          onPress={onPrev}
          disabled={!hasPrev}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={{ borderRadius: 120, padding: 4, height: 48, width: 48, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background }}>
            <IconSymbol
              name="chevron.left"
              size={20}
              color={hasPrev ? c.text : c.border}
            />
          </View>
        </TouchableOpacity>

        <View>
          <Text style={[styles.vehicleName, { color: c.text }]}>
            {vehicleName}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onNext}
          disabled={!hasNext}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style= {{borderRadius: 120, marginLeft: -80, padding: 4, height: 48, width: 48, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background}}>
            <IconSymbol
            name="chevron.right"
            size={20}
            color={hasNext ? c.text : c.border}
          />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Tab row ── */}
      <View style={styles.tabRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {TABS.map(({ key, label }) => {
            const isActive = key === activeTab;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => onTabChange(key)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isActive ? c.tint : c.background,
                    borderColor: isActive ? c.tint : c.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? c.background : c.text, opacity: isActive ? 1 : 0.7 },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 10,
  },

  // Top row
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  systemLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
    lineHeight: 15,
    textTransform: "uppercase",
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Name row
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  arrowBtn: {
    padding: 4,
  },

  vehicleName: {
    maxWidth: '70%',
    lineHeight: 30,
    flexShrink: 1,
    flexGrow: 1,
    flexWrap: "wrap",
    textAlign: "left",
    fontSize: 30,
    fontWeight: "300",
    letterSpacing: 2,
    textTransform: "uppercase",
    textOverflow: "ellipsis",
    textRendering: "optimizeLegibility",
    marginHorizontal: 15,
    marginBottom: 8,
    marginTop: 2,
  },
  dropCaret: {
    marginBottom: 6,
  },

  // Tab row
  tabRow: {
    flexDirection: "row",
    paddingBottom: 4,
    marginBottom: 8,

  },
  tabScroll: {
    alignItems: "center",
    paddingHorizontal: 2,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    marginRight: 6,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
});
