import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Spacing, StatusColors, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Vehicle } from "@/models";
import { haptics } from "@/services/haptics";
import { useAuthStore } from "@/store";
import { router } from "expo-router";
import React from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type CarHeaderTab =
  | "doc vault"
  // | "maintenance"
  // | "fuel"
  // | "appointments"
  | "tickets";

interface CarHeaderProps {
  vehicles: Vehicle[];
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
  activeTab: CarHeaderTab;
  onTabChange: (tab: CarHeaderTab) => void;
  synced?: boolean;
  scrollY?: Animated.Value;
}

const TABS: { key: CarHeaderTab; label: string }[] = [
  { key: "doc vault", label: "DOC VAULT" },
  // { key: "maintenance", label: "MAINTENANCE" },
  // { key: "fuel", label: "FUEL" },
  { key: "tickets", label: "TICKETS" },
  // { key: "appointments", label: "APPOINTMENTS" },
];

function getInitials(nameOrEmail: string | null | undefined): string | null {
  if (!nameOrEmail) return null;
  const value = nameOrEmail.trim();
  if (!value) return null;

  const namePart = value.split("@")[0];
  const parts = namePart.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function CarHeader({
  vehicles,
  activeIndex,
  onPrev,
  onNext,
  activeTab,
  onTabChange,
  synced = true,
  scrollY,
}: CarHeaderProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const user = useAuthStore((s) => s.user);
  const fallbackScrollY = React.useRef(new Animated.Value(0)).current;
  const activeScrollY = scrollY ?? fallbackScrollY;

  const vehicle = vehicles[activeIndex];
  const vehicleName = vehicle
    ? `${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}`
    : "NO VEHICLE";
  const userInitials = getInitials(user?.displayName ?? user?.email);

  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < vehicles.length - 1;
  const nameRowHeight = activeScrollY.interpolate({
    inputRange: [0, 96],
    outputRange: [84, 0],
    extrapolate: "clamp",
  });
  const nameRowOpacity = activeScrollY.interpolate({
    inputRange: [0, 48, 96],
    outputRange: [1, 0.35, 0],
    extrapolate: "clamp",
  });
  const nameRowTranslateY = activeScrollY.interpolate({
    inputRange: [0, 96],
    outputRange: [0, -18],
    extrapolate: "clamp",
  });
  const compactNameOpacity = activeScrollY.interpolate({
    inputRange: [24, 96],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView
      edges={[ Platform.OS !== "ios" ? "top" : "bottom" ]}
      style={[styles.container, { backgroundColor: c.background }]}
    >
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* ── Top row ── */}
      <View style={styles.topRow}>
        <Text style={[styles.systemLabel, { color: c.subtext }]}>
          CARDOC
        </Text>

        <Animated.Text
          style={[
            styles.compactVehicleName,
            { color: c.text, opacity: compactNameOpacity },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {vehicleName}
        </Animated.Text>

        <View style={styles.topRight}>
          {false && <View style={styles.syncBadge}>
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
          </View>}
          <AnimatedPressable
            onPress={() => router.push("/settings")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.settingsButton, { backgroundColor: c.tint }]}
            pressedScale={0.92}
          >
            {userInitials ? (
              <Text style={[styles.settingsInitials, { color: c.background }]}>
                {userInitials}
              </Text>
            ) : (
              <IconSymbol name="gearshape.fill" size={20} color={c.background} />
            )}
          </AnimatedPressable>
        </View>
      </View>

      {/* ── Vehicle name row ── */}
      <Animated.View
        style={[
          styles.nameRowClip,
          {
            height: nameRowHeight,
            opacity: nameRowOpacity,
            transform: [{ translateY: nameRowTranslateY }],
          },
        ]}
      >
        <View style={styles.nameRow}>
          <AnimatedPressable
            onPress={onPrev}
            disabled={!hasPrev}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
              styles.arrowButton,
              { backgroundColor: c.background, borderColor: c.border },
            ]}
            pressedScale={0.92}
          >
            <IconSymbol
              name="chevron.left"
              size={20}
              color={hasPrev ? c.text : c.border}
            />
          </AnimatedPressable>

          <View style={styles.vehicleNameWrap}>
            <Text style={[styles.vehicleName, { color: c.text }]}>
              {vehicleName}
            </Text>
          </View>

          <AnimatedPressable
            onPress={onNext}
            disabled={!hasNext}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
              styles.arrowButton,
              { backgroundColor: c.background, borderColor: c.border },
            ]}
            pressedScale={0.92}
          >
            <IconSymbol
              name="chevron.right"
              size={20}
              color={hasNext ? c.text : c.border}
            />
          </AnimatedPressable>
        </View>
      </Animated.View>

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
              <AnimatedPressable
                key={key}
                onPress={() => {
                  if (!isActive) void haptics.selection();
                  onTabChange(key);
                }}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isActive ? c.tint : c.background,
                    borderColor: isActive ? c.tint : c.border,
                  },
                ]}
                pressedScale={0.95}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? c.background : c.text, opacity: isActive ? 1 : 0.7 },
                  ]}
                >
                  {label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.page,
    paddingTop: 0,
    paddingBottom: 8,
    gap: 8,
  },
  compactVehicleName: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
    textTransform: "uppercase",
  },

  // Top row
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  systemLabel: {
    ...Type.sectionLabel,
    letterSpacing: 1,
    lineHeight: 15,
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsInitials: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
  },

  // Name row
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameRowClip: {
    overflow: "hidden",
  },
  vehicleNameWrap: {
    flex: 1,
    minWidth: 0,
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowCircle: {
    borderRadius: 120,
    padding: 4,
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  nextArrowCircle: {
    marginLeft: -80,
  },

  vehicleName: {
    lineHeight: 30,
    flexShrink: 1,
    flexWrap: "wrap",
    textAlign: "left",
    fontSize: 30,
    fontWeight: "300",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginHorizontal: 8,
    marginBottom: 8,
  },
  dropCaret: {
    marginBottom: 6,
  },

  // Tab row
  tabRow: {
    flexDirection: "row",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tabScroll: {
    alignItems: "center",
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
});
