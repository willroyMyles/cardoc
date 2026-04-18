import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ticket, TICKET_STATUS_LABELS, TicketStatus } from "@/models";
import { useSettingsStore, useTicketsStore, useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const STATUSES: TicketStatus[] = ["unpaid", "paid", "disputed", "dismissed"];

export default function AddTicketScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const addTicket = useTicketsStore((s) => s.addTicket);
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const currency = useSettingsStore((s) => s.currency);

  const [ticketNumber, setTicketNumber] = useState("");
  const [violation, setViolation] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<TicketStatus>("unpaid");
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [issuer, setIssuer] = useState("");
  const [region, setRegion] = useState("");
  const [notes, setNotes] = useState("");

  const inputStyle = [
    styles.input,
    { backgroundColor: c.card, borderColor: c.border, color: c.text },
  ];
  const labelStyle = [styles.label, { color: c.subtext }];

  function handleSave() {
    if (!ticketNumber || !violation || !amount) {
      Alert.alert(
        "Missing Fields",
        "Ticket number, violation, and amount are required.",
      );
      return;
    }
    const ticket: Ticket = {
      id: generateId(),
      vehicleId: vehicleId || undefined,
      ticketNumber,
      violation,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      amount: parseFloat(amount) || 0,
      currency,
      status,
      issuingAuthority: issuer,
      region,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addTicket(ticket);
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Status chips */}
        <Text style={labelStyle}>Status</Text>
        <View style={styles.chipRow}>
          {STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.chip,
                {
                  backgroundColor: status === s ? c.tint : c.card,
                  borderColor: status === s ? c.tint : c.border,
                },
              ]}
              onPress={() => setStatus(s)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: status === s ? "#fff" : c.text },
                ]}
              >
                {TICKET_STATUS_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Vehicle */}
        {vehicles.length > 0 ? (
          <>
            <Text style={labelStyle}>Vehicle (optional)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.typeScroll}
            >
              {vehicles.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: vehicleId === v.id ? c.tint : c.card,
                      borderColor: vehicleId === v.id ? c.tint : c.border,
                    },
                  ]}
                  onPress={() => setVehicleId(vehicleId === v.id ? "" : v.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: vehicleId === v.id ? "#fff" : c.text },
                    ]}
                  >
                    {v.year} {v.make} {v.model}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : null}

        <Text style={labelStyle}>Ticket Number *</Text>
        <TextInput
          style={inputStyle}
          value={ticketNumber}
          onChangeText={setTicketNumber}
          placeholder="e.g. TRF-2024-001"
          placeholderTextColor={c.subtext}
          autoCapitalize="characters"
        />

        <Text style={labelStyle}>Violation *</Text>
        <TextInput
          style={inputStyle}
          value={violation}
          onChangeText={setViolation}
          placeholder="e.g. Speeding 60 in 40"
          placeholderTextColor={c.subtext}
        />

        <Text style={labelStyle}>Amount * ({currency})</Text>
        <TextInput
          style={inputStyle}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={c.subtext}
          keyboardType="decimal-pad"
        />

        <Text style={labelStyle}>Date (YYYY-MM-DD)</Text>
        <TextInput
          style={inputStyle}
          value={date}
          onChangeText={setDate}
          placeholder="2024-03-15"
          placeholderTextColor={c.subtext}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={labelStyle}>Due Date (YYYY-MM-DD)</Text>
        <TextInput
          style={inputStyle}
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="2024-04-15"
          placeholderTextColor={c.subtext}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={labelStyle}>Issuing Authority</Text>
        <TextInput
          style={inputStyle}
          value={issuer}
          onChangeText={setIssuer}
          placeholder="e.g. City Traffic Dept."
          placeholderTextColor={c.subtext}
        />

        <Text style={labelStyle}>Region</Text>
        <TextInput
          style={inputStyle}
          value={region}
          onChangeText={setRegion}
          placeholder="e.g. California, US"
          placeholderTextColor={c.subtext}
        />

        <Text style={labelStyle}>Notes</Text>
        <TextInput
          style={[inputStyle, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          placeholderTextColor={c.subtext}
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: c.tint }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>Save Ticket</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 4, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: "600", marginTop: 12, marginBottom: 4 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  textArea: { height: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typeScroll: { marginBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  saveBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
