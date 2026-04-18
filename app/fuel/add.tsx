import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    FUEL_TYPE_LABELS,
    type FuelEntry,
    type FuelType,
} from "@/models/fuel-log";
import { useFuelStore, useSettingsStore, useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { v4 as uuidv4 } from "uuid";

const FUEL_TYPES = Object.entries(FUEL_TYPE_LABELS) as [FuelType, string][];

export default function AddFuelScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const addEntry = useFuelStore((s) => s.addEntry);
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const currency = useSettingsStore((s) => s.currency);

  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [fuelType, setFuelType] = useState<FuelType>("petrol");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<"liters" | "gallons">("liters");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [mileage, setMileage] = useState("");
  const [station, setStation] = useState("");
  const [fullTank, setFullTank] = useState(true);
  const [notes, setNotes] = useState("");

  const totalCost =
    quantity && pricePerUnit
      ? (parseFloat(quantity) * parseFloat(pricePerUnit)).toFixed(2)
      : "0.00";

  const handleSave = () => {
    if (!vehicleId) {
      Alert.alert("Select Vehicle");
      return;
    }
    if (!quantity || !pricePerUnit || !mileage) {
      Alert.alert(
        "Missing Fields",
        "Please fill in quantity, price, and mileage.",
      );
      return;
    }
    const now = new Date().toISOString();
    const entry: FuelEntry = {
      id: uuidv4(),
      vehicleId,
      date,
      fuelType,
      quantity: parseFloat(quantity),
      unit,
      pricePerUnit: parseFloat(pricePerUnit),
      totalCost: parseFloat(totalCost),
      currency,
      mileageAtFill: parseFloat(mileage),
      station: station.trim() || undefined,
      fullTank,
      notes: notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    addEntry(entry);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={22} color={c.tint} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: c.text }]}>
          Add Fuel Entry
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveBtn, { color: c.tint }]}>Save</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Vehicle */}
        <Label text="Vehicle" c={c} />
        <View style={styles.chips}>
          {vehicles.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={[
                styles.chip,
                {
                  borderColor: v.id === vehicleId ? c.tint : c.border,
                  backgroundColor: v.id === vehicleId ? c.tint + "18" : c.card,
                },
              ]}
              onPress={() => setVehicleId(v.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: v.id === vehicleId ? c.tint : c.text },
                ]}
              >
                {v.make} {v.model}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fuel type */}
        <Label text="Fuel Type" c={c} />
        <View style={styles.chips}>
          {FUEL_TYPES.map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.chip,
                {
                  borderColor: key === fuelType ? c.tint : c.border,
                  backgroundColor: key === fuelType ? c.tint + "18" : c.card,
                },
              ]}
              onPress={() => setFuelType(key)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: key === fuelType ? c.tint : c.text },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date */}
        <Label text="Date (YYYY-MM-DD)" c={c} />
        <TextInput
          style={[
            styles.input,
            { color: c.text, borderColor: c.border, backgroundColor: c.card },
          ]}
          value={date}
          onChangeText={setDate}
          placeholder="2024-01-01"
          placeholderTextColor={c.subtext}
        />

        {/* Quantity + unit */}
        <Label text="Quantity" c={c} />
        <View style={styles.row}>
          <TextInput
            style={[
              styles.input,
              styles.flex,
              { color: c.text, borderColor: c.border, backgroundColor: c.card },
            ]}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="50"
            keyboardType="decimal-pad"
            placeholderTextColor={c.subtext}
          />
          <TouchableOpacity
            style={[
              styles.unitToggle,
              { borderColor: c.border, backgroundColor: c.card },
            ]}
            onPress={() => setUnit(unit === "liters" ? "gallons" : "liters")}
          >
            <Text style={[styles.chipText, { color: c.tint }]}>
              {unit === "liters" ? "L" : "gal"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Price per unit */}
        <Label
          text={`Price per ${unit === "liters" ? "Litre" : "Gallon"} (${currency})`}
          c={c}
        />
        <TextInput
          style={[
            styles.input,
            { color: c.text, borderColor: c.border, backgroundColor: c.card },
          ]}
          value={pricePerUnit}
          onChangeText={setPricePerUnit}
          placeholder="1.99"
          keyboardType="decimal-pad"
          placeholderTextColor={c.subtext}
        />

        {/* Total cost (computed) */}
        <View
          style={[
            styles.totalCard,
            { backgroundColor: c.tint + "18", borderColor: c.tint },
          ]}
        >
          <Text style={[styles.totalLabel, { color: c.subtext }]}>
            Total Cost
          </Text>
          <Text style={[styles.totalValue, { color: c.tint }]}>
            {currency}
            {totalCost}
          </Text>
        </View>

        {/* Mileage */}
        <Label text="Odometer / Mileage (km)" c={c} />
        <TextInput
          style={[
            styles.input,
            { color: c.text, borderColor: c.border, backgroundColor: c.card },
          ]}
          value={mileage}
          onChangeText={setMileage}
          placeholder="45000"
          keyboardType="numeric"
          placeholderTextColor={c.subtext}
        />

        {/* Station */}
        <Label text="Station (optional)" c={c} />
        <TextInput
          style={[
            styles.input,
            { color: c.text, borderColor: c.border, backgroundColor: c.card },
          ]}
          value={station}
          onChangeText={setStation}
          placeholder="Shell, BP, etc."
          placeholderTextColor={c.subtext}
        />

        {/* Full tank */}
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: c.text }]}>
            Full Tank Fill-up
          </Text>
          <Switch value={fullTank} onValueChange={setFullTank} />
        </View>

        {/* Notes */}
        <Label text="Notes" c={c} />
        <TextInput
          style={[
            styles.input,
            styles.textarea,
            { color: c.text, borderColor: c.border, backgroundColor: c.card },
          ]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional…"
          placeholderTextColor={c.subtext}
          multiline
          numberOfLines={3}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ text, c }: { text: string; c: any }) {
  return <Text style={[styles.label, { color: c.subtext }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pageTitle: { fontSize: 20, fontWeight: "700" },
  saveBtn: { fontSize: 16, fontWeight: "600" },
  scroll: { padding: 16, paddingBottom: 40, gap: 8 },
  label: { fontSize: 13, fontWeight: "600", marginTop: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  textarea: { height: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  unitToggle: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  totalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  totalLabel: { fontSize: 14, fontWeight: "600" },
  totalValue: { fontSize: 22, fontWeight: "800" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  switchLabel: { fontSize: 15, fontWeight: "500" },
});
