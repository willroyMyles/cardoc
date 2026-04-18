import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useVehiclesStore } from "@/store";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from "react-native";

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const vehicle = useVehiclesStore((s) => s.getVehicle(id));
  const updateVehicle = useVehiclesStore((s) => s.updateVehicle);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [plate, setPlate] = useState("");
  const [color, setColor] = useState("");
  const [bodyType, setBodyType] = useState("");

  useEffect(() => {
    if (vehicle) {
      setMake(vehicle.make);
      setModel(vehicle.model);
      setYear(String(vehicle.year));
      setVin(vehicle.vin ?? "");
      setPlate(vehicle.licensePlate ?? "");
      setColor(vehicle.color ?? "");
      setBodyType(vehicle.bodyType ?? "");
    }
  }, [vehicle]);

  if (!vehicle) return null;

  const inputStyle = [
    styles.input,
    { backgroundColor: c.card, borderColor: c.border, color: c.text },
  ];
  const labelStyle = [styles.label, { color: c.subtext }];

  function handleSave() {
    if (!make || !model || !year) {
      Alert.alert("Missing Fields", "Make, model, and year are required.");
      return;
    }
    updateVehicle(id, {
      make,
      model,
      year: parseInt(year, 10),
      vin,
      licensePlate: plate,
      color,
      bodyType,
    });
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
        <Text style={labelStyle}>Make *</Text>
        <TextInput
          style={inputStyle}
          value={make}
          onChangeText={setMake}
          placeholderTextColor={c.subtext}
        />

        <Text style={labelStyle}>Model *</Text>
        <TextInput
          style={inputStyle}
          value={model}
          onChangeText={setModel}
          placeholderTextColor={c.subtext}
        />

        <Text style={labelStyle}>Year *</Text>
        <TextInput
          style={inputStyle}
          value={year}
          onChangeText={setYear}
          keyboardType="number-pad"
          maxLength={4}
          placeholderTextColor={c.subtext}
        />

        <Text style={labelStyle}>VIN</Text>
        <TextInput
          style={inputStyle}
          value={vin}
          onChangeText={(t) => setVin(t.toUpperCase())}
          autoCapitalize="characters"
          maxLength={17}
          placeholderTextColor={c.subtext}
        />

        <Text style={labelStyle}>License Plate</Text>
        <TextInput
          style={inputStyle}
          value={plate}
          onChangeText={(t) => setPlate(t.toUpperCase())}
          autoCapitalize="characters"
          placeholderTextColor={c.subtext}
        />

        <Text style={labelStyle}>Color</Text>
        <TextInput
          style={inputStyle}
          value={color}
          onChangeText={setColor}
          placeholderTextColor={c.subtext}
        />

        <Text style={labelStyle}>Body Type</Text>
        <TextInput
          style={inputStyle}
          value={bodyType}
          onChangeText={setBodyType}
          placeholderTextColor={c.subtext}
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: c.tint }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>Save Changes</Text>
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
  saveBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
