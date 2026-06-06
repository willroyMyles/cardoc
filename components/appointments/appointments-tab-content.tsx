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

const INITIAL_APPOINTMENTS: AppointmentItem[] = [];

export function AppointmentsTabContent() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);

  const nextAppointment = useMemo(() => appointments[0], [appointments]);

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
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: c.subtext }]}>UPCOMING APPOINTMENTS</Text>
          <Text style={[styles.sectionSubtitle, { color: c.text }]}>Keep your service visits and reminders neatly tracked.</Text>
        </View>

        <TouchableOpacity
          style={[styles.logBtn, { backgroundColor: c.text }]}
          onPress={handleSchedule}
          activeOpacity={0.85}
        >
          <Text style={[styles.logBtnText, { color: c.background }]}>Schedule</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.summaryPill, { backgroundColor: c.card, borderColor: c.border }]}> 
        <View style={styles.summaryItem}>
          <IconSymbol name="calendar" size={14} color="#f59e0b" />
          <View style={styles.summaryText}>
            <Text style={[styles.summaryLabel, { color: c.subtext }]}>Scheduled</Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>{appointments.length}</Text>
          </View>
        </View>
        <View style={[styles.summarySep, { backgroundColor: c.border }]} />
        <View style={styles.summaryItem}>
          <IconSymbol name="clock.fill" size={14} color="#f59e0b" />
          <View style={styles.summaryText}>
            <Text style={[styles.summaryLabel, { color: c.subtext }]}>Next slot</Text>
            <Text style={[styles.summaryValue, { color: c.text }]}> 
              {nextAppointment ? `${nextAppointment.date} · ${nextAppointment.time}` : "None"}
            </Text>
          </View>
        </View>
      </View>

      {appointments.length > 0 ? (
        appointments.map((appointment) => (
          <View
            key={appointment.id}
            style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.typeIcon, { backgroundColor: c.background }]}> 
                <IconSymbol name="calendar" size={18} color={c.tint} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.typeLabel, { color: c.text }]}>{appointment.title}</Text>
                <Text style={[styles.vehicleName, { color: c.subtext }]}>{appointment.provider}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.cost, { color: c.text }]}>{appointment.date}</Text>
                <Text style={[styles.date, { color: c.subtext }]}>{appointment.time}</Text>
              </View>
            </View>

            <Text style={[styles.description, { color: c.subtext }]} numberOfLines={3}>
              {appointment.description}
            </Text>

            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: c.subtext }]}>Vehicle</Text>
              <Text style={[styles.metaValue, { color: c.text }]} numberOfLines={1}>{appointment.vehicle}</Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={[styles.statusPill, { backgroundColor: "#fef3c7", borderColor: "#fcd34d" }]}> 
                <Text style={[styles.statusText, { color: StatusColors.warning }]}>{appointment.status}</Text>
              </View>
              <TouchableOpacity
                style={[styles.deleteButton, { borderColor: c.border }]}
                onPress={() => handleDelete(appointment.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.deleteButtonText, { color: c.tint }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={[styles.emptyStateContainer, { backgroundColor: c.card, borderColor: c.border }]}> 
          <Text style={[styles.emptyTitle, { color: c.text }]}>No upcoming appointments</Text>
          <Text style={[styles.emptySubtitle, { color: c.subtext }]}>Schedule a service visit to keep reminders and alerts in one place.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 260,
  },
  logBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  logBtnText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  summaryPill: {
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  summarySep: {
    width: 1,
    alignSelf: "stretch",
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  typeIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
  },
  cardRight: {
    alignItems: "flex-end",
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  vehicleName: {
    fontSize: 12,
    marginTop: 4,
  },
  cost: {
    fontSize: 14,
    fontWeight: "700",
  },
  date: {
    fontSize: 12,
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  metaLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
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
  deleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyStateContainer: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
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
