import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, DocTypeColors, StatusColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { FuelEntry, MaintenanceEntry } from "@/models";
import {
  useDocumentsStore,
  useFuelStore,
  useMaintenanceStore,
  useVehiclesStore,
} from "@/store";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

function computeAvgEfficiency(entries: FuelEntry[]): number | null {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  if (sorted.length < 2) return null;

  let totalMiles = 0;
  let totalGallons = 0;

  for (let i = 1; i < sorted.length; i++) {
    const miles = sorted[i].mileageAtFill - sorted[i - 1].mileageAtFill;
    if (miles <= 0) continue;
    const gallons =
      sorted[i].unit === "gallons"
        ? sorted[i].quantity
        : sorted[i].quantity * 0.264172;
    if (gallons <= 0) continue;
    totalMiles += miles;
    totalGallons += gallons;
  }

  if (totalGallons === 0) return null;
  return Math.round((totalMiles / totalGallons) * 10) / 10;
}

function getNextService(entries: MaintenanceEntry[]): MaintenanceEntry | null {
  if (entries.length === 0) return null;
  const future = entries
    .filter((entry) => new Date(entry.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (future.length > 0) return future[0];
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function computeBarHeights(entries: FuelEntry[]) {
  const recent = [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7)
    .reverse();
  if (recent.length === 0) return [0.45, 0.6, 0.5, 0.85, 0.65, 0.95, 0.4];
  const max = Math.max(...recent.map((entry) => entry.quantity));
  const heights = recent.map((entry) => (max > 0 ? entry.quantity / max : 0.5));
  while (heights.length < 7) heights.unshift(0.45);
  return heights;
}

export default function DashboardOverview() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const fuelEntries = useFuelStore((state) => state.entries);
  const maintenanceEntries = useMaintenanceStore((state) => state.entries);
  const documents = useDocumentsStore((state) => state.documents);

  const avgMPG = useMemo(() => computeAvgEfficiency(fuelEntries), [fuelEntries]);
  const nextService = useMemo(() => getNextService(maintenanceEntries), [maintenanceEntries]);
  const barHeights = useMemo(() => computeBarHeights(fuelEntries), [fuelEntries]);
  const insuranceDocs = useMemo(
    () => documents.filter((doc) => doc.type === "insurance"),
    [documents],
  );
  const featuredDoc = insuranceDocs[0] ?? documents[0] ?? null;

  const totalSpend = useMemo(() => {
    const fuelSpend = fuelEntries.reduce((sum, entry) => sum + (entry.totalCost ?? 0), 0);
    const maintenanceSpend = maintenanceEntries.reduce((sum, entry) => sum + (entry.cost ?? 0), 0);
    return fuelSpend + maintenanceSpend;
  }, [fuelEntries, maintenanceEntries]);

  const avgEconomy = avgMPG ?? 0;
  const totalFuelSpend = useMemo(
    () => fuelEntries.reduce((sum, entry) => sum + (entry.totalCost ?? 0), 0),
    [fuelEntries],
  );
  const totalMaintenanceSpend = useMemo(
    () => maintenanceEntries.reduce((sum, entry) => sum + (entry.cost ?? 0), 0),
    [maintenanceEntries],
  );

  const vehicles = useVehiclesStore((state) => state.vehicles);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  const handleUploadChoice = (choice: "gallery" | "files") => {
    setUploadSheetVisible(false);
    router.push(`/scan?source=${choice}`);
  };

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [pulse]);

  const budgetRatio = useMemo(() => {
    const total = totalFuelSpend + totalMaintenanceSpend;
    return total > 0
      ? {
          fuel: totalFuelSpend / total,
          maintenance: totalMaintenanceSpend / total,
        }
      : { fuel: 0.5, maintenance: 0.5 };
  }, [totalFuelSpend, totalMaintenanceSpend]);

  const upcomingReminder = nextService
    ? `Reminder for your upcoming service: "${nextService.type.replace(/_/g, " ").toUpperCase()}" scheduled for ${fmtDate(
        nextService.date,
      )}.`
    : "No upcoming service reminders at this time.";

  if (vehicles.length === 0) {
    return (
      <View style={[styles.content, styles.emptyStateContainer]}>
        <View style={[styles.emptyCard, { backgroundColor: c.card, borderColor: c.border }]}> 
          <View style={styles.emptyIconTile}>
            <IconSymbol name="doc.text.fill" size={28} color={c.tint} />
          </View>
          <Text style={[styles.emptyTitle, { color: c.text }]}>Scan to get started</Text>
          <Text style={[styles.emptySubtitle, { color: c.subtext }]}>Add your first vehicle by scanning a document.</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: c.tint }]}
              onPress={() => router.push("/scan")}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionButtonText, { color: "#fff" }]}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: c.card, borderColor: c.border, borderWidth: 1 }]}
              onPress={() => setUploadSheetVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionButtonText, { color: c.text }]}>Upload</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={uploadSheetVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setUploadSheetVisible(false)}
        >
          <TouchableOpacity
            style={styles.sheetOverlay}
            activeOpacity={1}
            onPress={() => setUploadSheetVisible(false)}
          >
            <View style={[styles.sheet, { backgroundColor: c.card, borderColor: c.border }]}> 
              <View style={styles.sheetHandle} />
              <Text style={[styles.sheetTitle, { color: c.text }]}>Upload from</Text>
              <TouchableOpacity
                style={[styles.sheetOption, { borderColor: c.border }]}
                onPress={() => handleUploadChoice("gallery")}
                activeOpacity={0.75}
              >
                <Text style={[styles.sheetOptionText, { color: c.text }]}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetOption, { borderColor: c.border }]}
                onPress={() => handleUploadChoice("files")}
                activeOpacity={0.75}
              >
                <Text style={[styles.sheetOptionText, { color: c.text }]}>Files</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetCancel}
                onPress={() => setUploadSheetVisible(false)}
                activeOpacity={0.75}
              >
                <Text style={[styles.sheetCancelText, { color: c.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.content}>
      {bannerVisible && (
        <Animated.View
          style={[
            styles.banner,
            {
              backgroundColor: "#fee2e2",
              borderColor: "#fca5a5",
              transform: [{ scale: pulse }],
            },
          ]}
        >
          <View style={styles.bannerIcon}>
            <IconSymbol name="bell.fill" size={16} color="#b91c1c" />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitle, { color: "#991b1b" }]}>Active Reminders & Warnings</Text>
            <Text style={[styles.bannerMessage, { color: "#7f1d1d" }]}>{upcomingReminder}</Text>
          </View>
          <TouchableOpacity onPress={() => setBannerVisible(false)} style={styles.bannerCloseButton}>
            <Text style={styles.bannerCloseText}>×</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={[styles.efficiencyCard, { backgroundColor: c.card, borderColor: c.border }]}> 
          <Text style={[styles.cardLabel, { color: c.subtext }]}>CORE EFFICIENCY</Text>
          <View style={styles.metricRow}>
            <Text style={[styles.metricValue, { color: c.text }]}> {avgMPG !== null ? String(avgMPG) : "—"} </Text>
            <Text style={[styles.metricUnit, { color: c.subtext }]}> {avgMPG !== null ? "MPGe" : "No data"} </Text>
          </View>
          <Text style={[styles.metricSub, { color: c.subtext }]}>+4.2% from last cycle</Text>
          <View style={styles.miniChart}>
            {barHeights.map((height, index) => (
              <View
                key={index}
                style={[
                  styles.bar,
                  {
                    height: `${Math.round(height * 100)}%` as any,
                    backgroundColor: index === barHeights.length - 1 ? c.tint : c.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={[styles.serviceCard, { backgroundColor: c.tint }]}> 
          <Text style={styles.serviceLabel}>UPCOMING SERVICE FOCUS</Text>
          <Text style={styles.serviceTitle} numberOfLines={2}>
            {nextService ? nextService.type.replace(/_/g, " ").toUpperCase() : "No service scheduled yet."}
          </Text>
          {nextService ? (
            <Text style={styles.serviceDescription} numberOfLines={3}>
              {nextService.description ?? "Simulated alerts trigger."}
            </Text>
          ) : null}
          <View style={styles.serviceFooter}>
            <View>
              <Text style={styles.serviceFooterLabel}>SCHEDULED ON</Text>
              <Text style={styles.serviceFooterValue}>
                {nextService ? fmtDate(nextService.date) : "—"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.serviceButton}
              onPress={() => router.push("/maintenance")}
            >
              <Text style={styles.serviceButtonText}>PLANNER</Text>
            </TouchableOpacity>
          </View>
        </View>

      <View style={[styles.vaultCard, { backgroundColor: c.card, borderColor: c.border }]}> 
        <View style={styles.vaultHeader}>
          <Text style={[styles.cardLabel, { color: c.subtext }]}>DOCUMENT VAULT SUMMARY</Text>
          <TouchableOpacity onPress={() => router.push("/documents")}> 
            <Text style={[styles.vaultAction, { color: c.tint }]}>MANAGE ALL ({documents.length})</Text>
          </TouchableOpacity>
        </View>
        {featuredDoc ? (
          <View style={[styles.docRow, { backgroundColor: c.background, borderColor: c.border }]}> 
            <View style={[styles.docIcon, { backgroundColor: (DocTypeColors[featuredDoc.type] ?? DocTypeColors.other) + "22" }]}> 
              <IconSymbol name="doc.fill" size={16} color={DocTypeColors[featuredDoc.type] ?? DocTypeColors.other} />
            </View>
            <View style={styles.docInfo}>
              <Text style={[styles.docTitle, { color: c.text }]} numberOfLines={1}>
                {featuredDoc.title ?? featuredDoc.type.replace(/_/g, " ").toUpperCase()}
              </Text>
              <Text style={[styles.docNumber, { color: c.subtext }]} numberOfLines={1}>
                {featuredDoc.documentNumber ?? "No policy number"}
              </Text>
            </View>
            <Text style={[styles.docStatus, { color: featuredDoc.expiryDate && new Date(featuredDoc.expiryDate) < new Date() ? StatusColors.danger : StatusColors.success }]}> 
              {featuredDoc.expiryDate && new Date(featuredDoc.expiryDate) < new Date() ? "EXPIRED" : "VALID"}
            </Text>
          </View>
        ) : (
          <Text style={[styles.vaultEmpty, { color: c.subtext }]}>No documents scanned yet. Add a file or scan a policy to populate this summary.</Text>
        )}
      </View>

      <View style={[styles.analyticsCard, { backgroundColor: c.card, borderColor: c.border }]}> 
        <Text style={[styles.cardLabel, { color: c.subtext }]}>ANALYTICS ENGINE</Text>
        <View style={styles.sectionBlock}>
          <View style={styles.statsRow}>
            <View style={[styles.statsCard, { backgroundColor: c.background, borderColor: c.border }]}> 
              <Text style={[styles.statsLabel, { color: c.subtext }]}>TOTAL SPEND</Text>
              <Text style={[styles.statsValue, { color: c.text }]}>${totalSpend.toFixed(2)}</Text>
              <Text style={[styles.statsMeta, { color: c.subtext }]}>Synced logs</Text>
            </View>
            <View style={[styles.statsCard, { backgroundColor: c.background, borderColor: c.border }]}> 
              <Text style={[styles.statsLabel, { color: c.subtext }]}>AVG ECONOMY</Text>
              <Text style={[styles.statsValue, { color: c.text }]}>{avgEconomy ? `${avgEconomy} MPG` : "N/A"}</Text>
              <Text style={[styles.statsMeta, { color: c.subtext }]}>{fuelEntries.length} fillups logged</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.trendCard, { backgroundColor: c.card, borderColor: c.border }]}> 
        <Text style={[styles.cardLabel, { color: c.subtext }]}>FUEL EFFICIENCY</Text>
        <View style={styles.sectionBlock}>
          <Text style={[styles.graphTitle, { color: c.text }]}>Fuel Efficiency Trend</Text>
          <Text style={[styles.graphSubtitle, { color: c.subtext }]}>Real-time calculations between sequential tank fills</Text>
          <View style={styles.trendChart}>
            {barHeights.map((height, index) => (
              <View key={index} style={[styles.trendBar, { height: `${Math.round(height * 100)}%` as any, backgroundColor: index === barHeights.length - 1 ? c.tint : c.border }]} />
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.budgetCard, { backgroundColor: c.card, borderColor: c.border }]}> 
        <Text style={[styles.cardLabel, { color: c.subtext }]}>SPENDING & BUDGET</Text>
        <View style={styles.sectionBlock}>
          <Text style={[styles.graphTitle, { color: c.text }]}>Monthly Spending Profile</Text>
          <View style={styles.stackChart}> 
            <View style={[styles.stackBar, { flex: budgetRatio.fuel, backgroundColor: "#f59e0b" }]} />
            <View style={[styles.stackBar, { flex: budgetRatio.maintenance, backgroundColor: "#0ea5e9" }]} />
          </View>
          <View style={styles.budgetLegendRow}> 
            <View style={styles.budgetLegendItem}> 
              <View style={[styles.legendDot, { backgroundColor: "#f59e0b" }]} />
              <Text style={[styles.legendLabel, { color: c.text }]}>Fuel</Text>
            </View>
            <View style={styles.budgetLegendItem}> 
              <View style={[styles.legendDot, { backgroundColor: "#0ea5e9" }]} />
              <Text style={[styles.legendLabel, { color: c.text }]}>Maintenance</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.graphTitle, { color: c.text }]}>Budget Allocation</Text>
          <View style={styles.budgetRow}> 
            <View style={[styles.donut, { borderColor: c.border }]}> 
              <View style={[styles.donutSegment, { backgroundColor: "#f59e0b", flex: budgetRatio.fuel }]} />
              <View style={[styles.donutSegment, { backgroundColor: "#0ea5e9", flex: budgetRatio.maintenance }]} />
            </View>
            <View style={styles.budgetText}> 
              <Text style={[styles.budgetHeading, { color: c.text }]}>Budget Allocation</Text>
              <Text style={[styles.budgetDetail, { color: c.subtext }]}>Fueling Expenses</Text>
              <Text style={[styles.budgetAmount, { color: c.text }]}>${totalFuelSpend.toFixed(2)}</Text>
              <Text style={[styles.budgetDetail, { color: c.subtext, marginTop: 8 }]}>Vehicle Maintenance</Text>
              <Text style={[styles.budgetAmount, { color: c.text }]}>${totalMaintenanceSpend.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 48 },
  banner: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(192,68,68,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTextContainer: { flex: 1, gap: 2 },
  bannerTitle: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  bannerMessage: { fontSize: 12, lineHeight: 18 },
  topRow: { flexDirection: "row", gap: 12 },
  efficiencyCard: { flex: 5, borderRadius: 28, borderWidth: 1, padding: 20, minHeight: 220, gap: 8 },
  serviceCard: { flex: 4, borderRadius: 28, padding: 20, minHeight: 220, justifyContent: "space-between" },
  cardLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
  metricRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginTop: 8 },
  metricValue: { fontSize: 48, fontWeight: "300", lineHeight: 52 },
  metricUnit: { fontSize: 14, fontWeight: "300", marginBottom: 6 },
  metricSub: { fontSize: 10, fontWeight: "500" },
  miniChart: { flexDirection: "row", alignItems: "flex-end", height: 52, gap: 4, marginTop: 16 },
  bar: { flex: 1, borderRadius: 4, minHeight: 6 },
  serviceLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 2, color: "rgba(255,255,255,0.65)", textTransform: "uppercase" },
  serviceTitle: { fontSize: 18, fontWeight: "300", color: "#fff", marginTop: 10, lineHeight: 24, textTransform: "capitalize" },
  serviceDescription: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 10, lineHeight: 18 },
  serviceFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", paddingTop: 16 },
  serviceFooterLabel: { fontSize: 8, fontWeight: "700", color: "rgba(255,255,255,0.55)", letterSpacing: 1.5, textTransform: "uppercase" },
  serviceFooterValue: { fontSize: 13, fontWeight: "700", color: "#fff", marginTop: 4 },
  serviceButton: { borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  serviceButtonText: { color: "#fff", fontSize: 10, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" },
  vaultCard: { borderRadius: 28, borderWidth: 1, padding: 20 },
  vaultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  vaultAction: { fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
  docRow: { borderRadius: 24, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  docIcon: { width: 40, height: 40, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  docInfo: { flex: 1, gap: 2 },
  docTitle: { fontSize: 14, fontWeight: "700" },
  docNumber: { fontSize: 11, fontWeight: "500" },
  docStatus: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  vaultEmpty: { fontSize: 12, lineHeight: 18 },
  analyticsCard: { borderRadius: 28, borderWidth: 1, padding: 20, gap: 16 },
  trendCard: { borderRadius: 28, borderWidth: 1, padding: 20, gap: 16 },
  budgetCard: { borderRadius: 28, borderWidth: 1, padding: 20, gap: 16 },
  statsRow: { flexDirection: "row", gap: 12 },
  statsCard: { flex: 1, borderRadius: 24, borderWidth: 1, padding: 16, gap: 8 },
  statsLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" },
  statsValue: { fontSize: 22, fontWeight: "700" },
  statsMeta: { fontSize: 10, color: "#8b8b8b" },
  graphSection: { gap: 10 },
  sectionBlock: {
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  budgetRowSection: {
    gap: 16,
    paddingTop: 12,
  },
  bannerCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerCloseText: {
    fontSize: 18,
    lineHeight: 18,
    color: "#991b1b",
    fontWeight: "700",
  },
  emptyStateContainer: {
    minHeight: 520,
    justifyContent: "center",
  },
  emptyCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 16,
    marginHorizontal: 12,
  },
  emptyIconTile: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(59,130,246,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 99,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 99,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },
  sheetOption: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sheetOptionText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  sheetCancel: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  graphTitle: { fontSize: 12, fontWeight: "700" },
  graphSubtitle: { fontSize: 10, lineHeight: 14 },
  trendChart: { flexDirection: "row", alignItems: "flex-end", height: 96, gap: 6, paddingHorizontal: 4 },
  trendBar: { flex: 1, borderRadius: 6, minHeight: 10 },
  stackChart: { flexDirection: "row", height: 18, borderRadius: 12, overflow: "hidden", marginTop: 10 },
  stackBar: { minHeight: 18 },
  budgetLegendRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  budgetLegendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 99 },
  legendLabel: { fontSize: 11, fontWeight: "600" },
  budgetRow: { flexDirection: "row", gap: 16, alignItems: "center", marginTop: 14 },
  donut: { width: 84, height: 84, borderRadius: 42, borderWidth: 6, overflow: "hidden", flexDirection: "row" },
  donutSegment: { minHeight: 84 },
  budgetText: { flex: 1, gap: 8 },
  budgetHeading: { fontSize: 13, fontWeight: "700" },
  budgetDetail: { fontSize: 10, lineHeight: 14 },
  budgetAmount: { fontSize: 16, fontWeight: "700" },
});
