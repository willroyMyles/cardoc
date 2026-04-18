import { DocumentCard } from "@/components/documents/document-card";
import { ThemedText } from "@/components/themed-text";
import { TicketCard } from "@/components/tickets/ticket-card";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    useDocumentsStore,
    useTicketsStore,
    useVehiclesStore
} from "@/store";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const vehicle = useVehiclesStore((s) => s.vehicles.find((v) => v.id === id));
  const deleteVehicle = useVehiclesStore((s) => s.deleteVehicle);
  const allDocs = useDocumentsStore((s) => s.documents);
  const allTickets = useTicketsStore((s) => s.tickets);
  const docs = useMemo(() => allDocs.filter((d) => d.vehicleId === id), [allDocs, id]);
  const tickets = useMemo(() => allTickets.filter((t) => t.vehicleId === id), [allTickets, id]);

  const [showDelete, setShowDelete] = useState(false);

  if (!vehicle) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.background }]}
      >
        <ThemedText>Vehicle not found.</ThemedText>
      </SafeAreaView>
    );
  }

  function handleDelete() {
    deleteVehicle(id);
    router.back();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Vehicle Info */}
        <Card style={styles.infoCard}>
          <ThemedText type="title">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </ThemedText>
          <View style={styles.detailRow}>
            <IconSymbol name="mappin.and.ellipse" size={14} color={c.subtext} />
            <Text style={[styles.detail, { color: c.subtext }]}>
              {vehicle.licensePlate || "—"}
            </Text>
          </View>
          {vehicle.vin ? (
            <Text style={[styles.vin, { color: c.subtext }]}>
              VIN: {vehicle.vin}
            </Text>
          ) : null}
          {vehicle.color ? (
            <Text style={[styles.detail, { color: c.subtext }]}>
              Color: {vehicle.color}
            </Text>
          ) : null}
          {vehicle.bodyType ? (
            <Text style={[styles.detail, { color: c.subtext }]}>
              Body: {vehicle.bodyType}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.tint }]}
              onPress={() =>
                router.push({ pathname: "/vehicle/edit/[id]", params: { id } })
              }
            >
              <IconSymbol name="pencil" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => setShowDelete(true)}
            >
              <IconSymbol name="trash.fill" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={[
              styles.quickLink,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
            onPress={() => router.push("/maintenance/index")}
          >
            <IconSymbol
              name="wrench.and.screwdriver.fill"
              size={20}
              color={c.tint}
            />
            <Text style={[styles.quickLinkText, { color: c.text }]}>
              Maintenance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickLink,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
            onPress={() => router.push("/fuel/index")}
          >
            <IconSymbol name="fuelpump.fill" size={20} color={c.tint} />
            <Text style={[styles.quickLinkText, { color: c.text }]}>
              Fuel Log
            </Text>
          </TouchableOpacity>
        </View>

        {/* Documents */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            Documents ({docs.length})
          </Text>
          <TouchableOpacity onPress={() => router.push("/document/add")}>
            <IconSymbol name="plus.circle.fill" size={22} color={c.tint} />
          </TouchableOpacity>
        </View>
        {docs.map((d) => (
          <DocumentCard key={d.id} document={d} />
        ))}

        {/* Tickets */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            Tickets ({tickets.length})
          </Text>
          <TouchableOpacity onPress={() => router.push("/ticket/add")}>
            <IconSymbol name="plus.circle.fill" size={22} color={c.tint} />
          </TouchableOpacity>
        </View>
        {tickets.map((t) => (
          <TicketCard key={t.id} ticket={t} />
        ))}
      </ScrollView>

      <ConfirmDialog
        visible={showDelete}
        title="Delete Vehicle"
        message="This will permanently delete the vehicle and all its data. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 4, paddingBottom: 40 },
  infoCard: { marginBottom: 12, gap: 6 },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  detail: { fontSize: 14 },
  vin: { fontSize: 12 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteBtn: { backgroundColor: "#EF4444" },
  actionBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  quickLinks: { flexDirection: "row", gap: 8, marginVertical: 8 },
  quickLink: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickLinkText: { fontSize: 14, fontWeight: "600" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
});
