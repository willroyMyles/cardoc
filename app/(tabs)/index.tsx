import { DocVaultScreen } from "@/components/documents/doc-vault-screen";
import { TicketTabContent } from "@/components/tickets/ticket-tab-content";
import { CarHeader, CarHeaderTab } from "@/components/vehicles/car-header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useVehiclesStore } from "@/store";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";

type ScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

function TabPlaceholder({
  title,
  description,
  style,
  titleColor,
  textColor,
}: {
  title: string;
  description: string;
  style?: object;
  titleColor?: string;
  textColor?: string;
}) {
  return (
    <View style={[styles.placeholderContainer, style]}>
      <Text style={[styles.placeholderTitle, { color: titleColor ?? "#000" }]}>{title}</Text>
      <Text style={[styles.placeholderText, { color: textColor ?? "#666" }]}>{description}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<CarHeaderTab>("doc vault");
  const vehicles = useVehiclesStore((s) => s.vehicles);

  const handleContentScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false },
      ) as ScrollHandler,
    [scrollY],
  );

  useEffect(() => {
    scrollY.setValue(0);
  }, [activeTab, scrollY]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const renderTabContent = () => {
    return (
      <View style={styles.contentContainer}>
        {activeTab === "doc vault" && (
          <DocVaultScreen
            onScroll={handleContentScroll}
            scrollEventThrottle={16}
          />
        )}
        {/* {activeTab === "maintenance" && <MaintenanceTabContent />}
        {activeTab === "appointments" && <AppointmentsTabContent />}
        {activeTab === "fuel" && <FuelTabContent />} */}
        {activeTab === "tickets" && (
          <TicketTabContent
            onScroll={handleContentScroll}
            scrollEventThrottle={16}
          />
        )}

      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}> 
      <CarHeader
        vehicles={vehicles}
        activeIndex={0}
        onPrev={() => {}}
        onNext={() => {}}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        scrollY={scrollY}
      />

      {renderTabContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { flex: 1 },
  scroll: { paddingBottom: 48 },
  placeholderContainer: {
    marginTop: 24,
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
  },
});
