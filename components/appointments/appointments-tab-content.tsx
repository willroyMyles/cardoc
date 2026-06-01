import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, StatusColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface AppointmentItem {
  id: string;
  title: string;
  provider: string;
  date: string;
  time: string;
  vehicle: string;
  status: string;
  description: string;
}

const INITIAL_APPOINTMENTS: AppointmentItem[] = [
  {
    id: "appt-1",
    title: "Porsche Brake Wear Level Danger Warning",
    provider: "Tesla Center",
    date: "2026-05-31",
    time: "09:00",
    vehicle: "2024 Porsche 911",
    status: "Push Alarm Pending",
    description:
      "A warning alarm is ready for the upcoming service slot. Confirm the appointment or reschedule it with your service provider.",
  },
  {
    id: "appt-2",
    title: "Pre-Summer Safety Inspection",
    provider: "Precision Auto Care",
    date: "2026-06-25",
    time: "09:30",
    vehicle: "2024 Porsche 911",
    status: "Push Alarm Pending",
    description:
      "A comprehensive pre-summer inspection to verify brakes, fluids, and electrical systems before the hot season.",
  },
];

export function AppointmentsTabContent() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);

  const nextAppointment = useMemo(
    () => appointments[0],
    [appointments],
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      "Cancel appointment",
      "Remove this appointment from the list?",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: () => setAppointments((prev) => prev.filter((item) => item.id !== id)),
        },
      ],
    );
  };

  const handleSchedule = () => {
    Alert.alert(
      "Schedule Car Slot",
      "This page supports your upcoming appointments tracker. Use the service center to book a real appointment.",
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: c.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.banner,
          {
            backgroundColor: scheme === "dark" ? "#3f2b10" : "#fef3c7",
            borderColor: scheme === "dark" ? "#8c6b20" : "#fcd34d",
          },
        ]}
      >
        <View style={styles.bannerIcon}>
          <IconSymbol name="bell.fill" size={20} color={StatusColors.warning} />
        </View>
        <View style={styles.bannerText}>
          <Text style={[styles.bannerTitle, { color: c.text }]}>ACTIVE REMINDERS & WARNINGS</Text>
          <Text style={[styles.bannerMessage, { color: c.subtext }]}>Set upcoming appointments and watch for service dates inside your reminder window.</Text>
        </View>
      </View>

      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Upcoming Appointments</Text>
          <Text style={[styles.sectionSubtitle, { color: c.subtext }]}>Manage service and inspection reminders in one place.</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: c.card, borderColor: c.border }]}> 
          <Text style={[styles.badgeText, { color: c.text }]}>{appointments.length} scheduled</Text>
        </View>
      </View>

      {appointments.map((appointment) => (
        <View
          key={appointment.id}
          style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: c.background }]}> 
              <IconSymbol name="calendar" size={18} color={c.tint} />
            </View>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{appointment.title}</Text>
              <Text style={[styles.cardMeta, { color: c.subtext }]}>{appointment.provider}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: "#fef3c7", borderColor: "#fcd34d" }]}> 
              <Text style={[styles.statusText, { color: StatusColors.warning }]}>{appointment.status}</Text>
            </View>
          </View>

          <Text style={[styles.cardDescription, { color: c.subtext }]} numberOfLines={3}>
            {appointment.description}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.detailsGroup}>
              <Text style={[styles.detailLabel, { color: c.subtext }]}>Date</Text>
              <Text style={[styles.detailValue, { color: c.text }]}>{appointment.date}</Text>
            </View>
            <View style={styles.detailsGroup}>
              <Text style={[styles.detailLabel, { color: c.subtext }]}>Time</Text>
              <Text style={[styles.detailValue, { color: c.text }]}>{appointment.time}</Text>
            </View>
            <View style={styles.detailsGroup}>
              <Text style={[styles.detailLabel, { color: c.subtext }]}>Vehicle</Text>
              <Text style={[styles.detailValue, { color: c.text }]} numberOfLines={1}>{appointment.vehicle}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: c.border }]}
            onPress={() => handleDelete(appointment.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.deleteButtonText, { color: c.tint }]}>Cancel Appointment</Text>
          </TouchableOpacity>
        </View>
      ))}

      {!appointments.length && (
        <View style={[styles.emptyState, { backgroundColor: c.card, borderColor: c.border }]}> 
          <Text style={[styles.emptyTitle, { color: c.text }]}>No upcoming appointments</Text>
          <Text style={[styles.emptySubtitle, { color: c.subtext }]}>Schedule your next service appointment to get alerts and reminders.</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.scheduleButton, { backgroundColor: c.tint }]}
        onPress={handleSchedule}
        activeOpacity={0.85}
      >
        <Text style={styles.scheduleButtonText}>Schedule Car Slot</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    gap: 16,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    gap: 14,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251, 191, 36, 0.15)",
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  bannerMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleRow: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  detailsGroup: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  deleteButton: {
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  scheduleButton: {
    marginTop: 4,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  scheduleButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
