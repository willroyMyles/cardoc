import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Vehicle } from "@/models";
import { decodeVIN } from "@/services/vin-decoder";
import { useVehiclesStore } from "@/store";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
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

export default function AddVehicleScreen() {
  const scheme = useColorScheme() ?? "light";
  const addVehicle = useVehiclesStore((s) => s.addVehicle);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [plate, setPlate] = useState("");
  const [color, setColor] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [decodingVin, setDecodingVin] = useState(false);

  const c = Colors[scheme];

  const inputStyle = [
    styles.input,
    { backgroundColor: c.card, borderColor: c.border, color: c.text },
  ];
  const labelStyle = [styles.label, { color: c.subtext }];

  async function handleDecodeVin() {
    if (vin.length < 11) {
      Alert.alert("Invalid VIN", "Please enter a valid 17-character VIN.");
      return;
    }
    setDecodingVin(true);
    try {
      const result = await decodeVIN(vin);
      if (result.make) setMake(result.make);
      if (result.model) setModel(result.model);
      if (result.year) setYear(String(result.year));
      if (result.bodyType) setBodyType(result.bodyType);
    } catch {
      Alert.alert(
        "VIN Decode Failed",
        "Could not decode VIN. Please fill in details manually.",
      );
    } finally {
      setDecodingVin(false);
    }
  }

  function handleSave() {
    if (!make || !model || !year) {
      Alert.alert("Missing Fields", "Make, model, and year are required.");
      return;
    }
    const vehicle: Vehicle = {
      id: generateId(),
      make,
      model,
      year: parseInt(year, 10),
      vin,
      licensePlate: plate,
      color,
      bodyType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addVehicle(vehicle);
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
        {/* VIN */}
        <View style={styles.vinRow}>
          <View style={styles.vinInput}>
            <Text style={labelStyle}>VIN (optional)</Text>
            <TextInput
              style={inputStyle}
              value={vin}
              onChangeText={(t) => setVin(t.toUpperCase())}
              placeholder="e.g. 1HGCM82633A004352"
              placeholderTextColor={c.subtext}
              autoCapitalize="characters"
              maxLength={17}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.decodeBtn,
              { backgroundColor: c.tint, opacity: decodingVin ? 0.6 : 1 },
            ]}
            onPress={handleDecodeVin}
            disabled={decodingVin}
          >
            {decodingVin ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <IconSymbol name="barcode.viewfinder" size={16} color="#fff" />
                <Text style={styles.decodeBtnText}>Decode</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={labelStyle}>Make *</Text>
        <TextInput
          style={inputStyle}
          value={make}
          onChangeText={setMake}
          placeholder="e.g. Toyota"
          placeholderTextColor={c.subtext}
        />

        <Text style={labelStyle}>Model *</Text>
        <TextInput
          style={inputStyle}
          value={model}
          onChangeText={setModel}
          placeholder="e.g. Camry"
          placeholderTextColor={c.subtext}
        />

        <Text style={labelStyle}>Year *</Text>
        <TextInput
          style={inputStyle}
          value={year}
          onChangeText={setYear}
          placeholder="e.g. 2022"
          placeholderTextColor={c.subtext}
          keyboardType="number-pad"
          maxLength={4}
        />

        <Text style={labelStyle}>License Plate</Text>
        <TextInput
          style={inputStyle}
          value={plate}
          onChangeText={(t) => setPlate(t.toUpperCase())}
          placeholder="e.g. ABC 123"
          placeholderTextColor={c.subtext}
          autoCapitalize="characters"
        />

        <Text style={labelStyle}>Color</Text>
        <TextInput
          style={inputStyle}
          value={color}
          onChangeText={setColor}
          placeholder="e.g. Pearl White"
          placeholderTextColor={c.subtext}
        />

        <Text style={labelStyle}>Body Type</Text>
        <TextInput
          style={inputStyle}
          value={bodyType}
          onChangeText={setBodyType}
          placeholder="e.g. Sedan"
          placeholderTextColor={c.subtext}
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: c.tint }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>Save Vehicle</Text>
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
  vinRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 4,
  },
  vinInput: { flex: 1 },
  decodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    marginBottom: 0,
  },
  decodeBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  saveBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
