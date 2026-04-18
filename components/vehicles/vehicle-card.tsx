import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Vehicle } from "@/models";
import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const scheme = useColorScheme() ?? "light";
  return (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: "/vehicle/[id]", params: { id: vehicle.id } })
      }
      activeOpacity={0.75}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          {vehicle.imageUri ? (
            <Image source={{ uri: vehicle.imageUri }} style={styles.image} />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                { backgroundColor: Colors[scheme].border },
              ]}
            >
              <IconSymbol
                name="car.fill"
                size={28}
                color={Colors[scheme].icon}
              />
            </View>
          )}
          <View style={styles.info}>
            <Text style={[styles.title, { color: Colors[scheme].text }]}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Text>
            <Text style={[styles.sub, { color: Colors[scheme].subtext }]}>
              {vehicle.licensePlate}
            </Text>
            {vehicle.vin ? (
              <Text style={[styles.vin, { color: Colors[scheme].subtext }]}>
                VIN: {vehicle.vin}
              </Text>
            ) : null}
          </View>
          <IconSymbol
            name="chevron.right"
            size={18}
            color={Colors[scheme].icon}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  image: { width: 60, height: 60, borderRadius: 8 },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: "600" },
  sub: { fontSize: 13, marginTop: 2 },
  vin: { fontSize: 11, marginTop: 2 },
});
