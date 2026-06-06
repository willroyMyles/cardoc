import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AccentColor, Colors, Radius, Spacing, Type } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Vehicle } from "@/models";
import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress?: () => void;
}

function makeLogoUrl(make: string) {
  const slug = make.toLowerCase().replace(/\s+/g, "-");
  return `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/${slug}.png`;
}

export function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  const scheme = useColorScheme() ?? "light";
  const logoUrl = makeLogoUrl(vehicle.make);
  const bgColor = vehicle.color.toLowerCase() || Colors[scheme].border;

  return (
    <TouchableOpacity
      onPress={
        onPress ??
        (() =>
          router.push({
            pathname: "/vehicle/[id]",
            params: { id: vehicle.id },
          }))
      }
      activeOpacity={0.75}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          {vehicle.imageUri ? (
            <Image source={{ uri: vehicle.imageUri }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Image
                source={{ uri: logoUrl }}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          )}
          <View style={styles.info}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={[styles.title, { color: Colors[scheme].text }]}>
                {vehicle.year} {vehicle.make.toProperCase()}{" "}
                {vehicle.model.toProperCase()}
              </Text>
              <View
                style={{
                  backgroundColor: `${bgColor.toLowerCase()}`,
                  borderRadius: 15,
                  height: 20,
                  width: 20,
                  borderWidth: 1,
                  borderColor: Colors[scheme].border,
                }}
              />
            </View>
            <Text style={[styles.sub, { color: Colors[scheme].subtext }]}>
              Plate No. {vehicle.licensePlate}
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
  card: { marginHorizontal: Spacing.page, marginVertical: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.rowGap },
  image: { width: 56, height: 56, borderRadius: Radius.tile },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: Radius.tile,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: { width: 36, height: 36, tintColor: AccentColor },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 14, fontWeight: "700" },
  sub: { ...Type.caption, marginTop: 0 },
  vin: { fontSize: 10, marginTop: 0 },
});
