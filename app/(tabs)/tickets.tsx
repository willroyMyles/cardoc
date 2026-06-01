import { TicketTabContent } from "@/components/tickets/ticket-tab-content";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";

export default function TicketsTab() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}> 
      <TicketTabContent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });

