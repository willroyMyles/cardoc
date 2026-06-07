import { Header } from "@/components/ui/header";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { AppSwitch } from "@/components/ui/app-switch";
import { Colors, Radius, Spacing, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { haptics } from "@/services/haptics";
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
    Text,
    TextInput,
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
    void haptics.success();
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <Header
        title="Add Fuel Entry"
        onBack={() => router.back()}
        right={
          <AnimatedPressable onPress={handleSave} pressedScale={0.94}>
            <Text style={[styles.saveBtn, { color: c.tint }]}>Save</Text>
          </AnimatedPressable>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Vehicle */}
        <Label text="Vehicle" c={c} />
        <View style={styles.chips}>
          {vehicles.map((v) => (
            <AnimatedPressable
              key={v.id}
              style={[
                styles.chip,
                {
                  borderColor: v.id === vehicleId ? c.tint : c.border,
                  backgroundColor: v.id === vehicleId ? c.tint : c.card,
                },
              ]}
              onPress={() => setVehicleId(v.id)}
              pressedScale={0.95}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: v.id === vehicleId ? "#fff" : c.subtext },
                ]}
              >
                {v.make} {v.model}
              </Text>
            </AnimatedPressable>
          ))}
        </View>

        {/* Fuel type */}
        <Label text="Fuel Type" c={c} />
        <View style={styles.chips}>
          {FUEL_TYPES.map(([key, label]) => (
            <AnimatedPressable
              key={key}
              style={[
                styles.chip,
                {
                  borderColor: key === fuelType ? c.tint : c.border,
                  backgroundColor: key === fuelType ? c.tint : c.card,
                },
              ]}
              onPress={() => setFuelType(key)}
              pressedScale={0.95}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: key === fuelType ? "#fff" : c.subtext },
                ]}
              >
                {label}
              </Text>
            </AnimatedPressable>
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
          <AnimatedPressable
            style={[
              styles.unitToggle,
              { borderColor: c.border, backgroundColor: c.card },
            ]}
            onPress={() => {
              setUnit(unit === "liters" ? "gallons" : "liters");
              void haptics.selection();
            }}
            pressedScale={0.95}
          >
            <Text style={[styles.chipText, { color: c.tint }]}>
              {unit === "liters" ? "L" : "gal"}
            </Text>
          </AnimatedPressable>
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
            { backgroundColor: c.card, borderColor: c.border },
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
          <AppSwitch
            value={fullTank}
            onValueChange={(value) => {
              setFullTank(value);
              void haptics.selection();
            }}
          />
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
  saveBtn: { ...Type.body, fontWeight: "700" },
  scroll: { padding: Spacing.page, paddingBottom: 40, gap: 8 },
  label: { ...Type.sectionLabel, marginTop: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: { ...Type.body, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: Radius.sm, padding: 12, fontSize: 15 },
  textarea: { height: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  unitToggle: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  totalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: Radius.surface,
    borderWidth: 1,
  },
  totalLabel: { ...Type.sectionLabel },
  totalValue: { fontSize: 22, fontWeight: "800" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  switchLabel: Type.title,
});
