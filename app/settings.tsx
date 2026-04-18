import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { syncFromCloud, syncToCloud } from "@/services/cloud-sync";
import { requestNotificationPermissions } from "@/services/notifications/expiry-reminders";
import { useSettingsStore } from "@/store";
import { type CloudProvider } from "@/store/settings-store";
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

const PROVIDERS: { value: CloudProvider; label: string }[] = [
  { value: "none", label: "None (local only)" },
  { value: "supabase", label: "Supabase" },
  { value: "appwrite", label: "Appwrite" },
];

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const {
    currency,
    setCurrency,
    cloudProvider,
    setCloudProvider,
    supabaseUrl,
    supabaseAnonKey,
    setSupabaseCredentials,
    appwriteEndpoint,
    appwriteProjectId,
    setAppwriteCredentials,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useSettingsStore();

  const [currencyInput, setCurrencyInput] = useState(currency);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(supabaseUrl);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(supabaseAnonKey);
  const [appwriteEndpointInput, setAppwriteEndpointInput] =
    useState(appwriteEndpoint);
  const [appwriteProjectInput, setAppwriteProjectInput] =
    useState(appwriteProjectId);
  const [syncing, setSyncing] = useState(false);

  const handleSyncUp = async () => {
    setSyncing(true);
    try {
      await syncToCloud({});
      Alert.alert("Success", "Data synced to cloud.");
    } catch (e: any) {
      Alert.alert("Sync Failed", e?.message ?? "Check your credentials.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncDown = async () => {
    setSyncing(true);
    try {
      await syncFromCloud();
      Alert.alert("Success", "Data restored from cloud.");
    } catch (e: any) {
      Alert.alert("Restore Failed", e?.message ?? "Check your credentials.");
    } finally {
      setSyncing(false);
    }
  };

  const handleNotificationsToggle = async (val: boolean) => {
    if (val) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          "Permission Denied",
          "Enable notifications in System Settings.",
        );
        return;
      }
    }
    setNotificationsEnabled(val);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={22} color={c.tint} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: c.text }]}>Settings</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Currency */}
        <SectionHeader title="Currency Symbol" c={c} />
        <View
          style={[
            styles.group,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <TextInput
            style={[styles.input, { color: c.text, borderColor: c.border }]}
            value={currencyInput}
            onChangeText={setCurrencyInput}
            onBlur={() => setCurrency(currencyInput)}
            placeholder="e.g. $ or R"
            placeholderTextColor={c.subtext}
            maxLength={4}
          />
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" c={c} />
        <View
          style={[
            styles.group,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: c.text }]}>
              Document Expiry Reminders
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
            />
          </View>
        </View>

        {/* Cloud Sync */}
        <SectionHeader title="Cloud Sync" c={c} />
        <View
          style={[
            styles.group,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          {PROVIDERS.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={styles.optionRow}
              onPress={() => setCloudProvider(p.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionLabel, { color: c.text }]}>
                {p.label}
              </Text>
              {cloudProvider === p.value && (
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={20}
                  color={c.tint}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {cloudProvider === "supabase" && (
          <>
            <SectionHeader title="Supabase Credentials" c={c} />
            <View
              style={[
                styles.group,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
            >
              <LabeledInput
                label="Project URL"
                value={supabaseUrlInput}
                onChangeText={setSupabaseUrlInput}
                onBlur={() =>
                  setSupabaseCredentials(supabaseUrlInput, supabaseKeyInput)
                }
                placeholder="https://xxx.supabase.co"
                c={c}
              />
              <LabeledInput
                label="Anon Key"
                value={supabaseKeyInput}
                onChangeText={setSupabaseKeyInput}
                onBlur={() =>
                  setSupabaseCredentials(supabaseUrlInput, supabaseKeyInput)
                }
                placeholder="eyJ..."
                c={c}
                secureTextEntry
              />
            </View>
          </>
        )}

        {cloudProvider === "appwrite" && (
          <>
            <SectionHeader title="Appwrite Credentials" c={c} />
            <View
              style={[
                styles.group,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
            >
              <LabeledInput
                label="Endpoint"
                value={appwriteEndpointInput}
                onChangeText={setAppwriteEndpointInput}
                onBlur={() =>
                  setAppwriteCredentials(
                    appwriteEndpointInput,
                    appwriteProjectInput,
                  )
                }
                placeholder="https://cloud.appwrite.io/v1"
                c={c}
              />
              <LabeledInput
                label="Project ID"
                value={appwriteProjectInput}
                onChangeText={setAppwriteProjectInput}
                onBlur={() =>
                  setAppwriteCredentials(
                    appwriteEndpointInput,
                    appwriteProjectInput,
                  )
                }
                placeholder="project-id"
                c={c}
              />
            </View>
          </>
        )}

        {cloudProvider !== "none" && (
          <View style={styles.syncButtons}>
            <TouchableOpacity
              style={[styles.syncBtn, { backgroundColor: c.tint }]}
              onPress={handleSyncUp}
              disabled={syncing}
            >
              <IconSymbol name="icloud.fill" size={16} color="#fff" />
              <Text style={styles.syncBtnText}>
                {syncing ? "Syncing…" : "Sync to Cloud"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.syncBtn,
                {
                  backgroundColor: c.card,
                  borderWidth: 1,
                  borderColor: c.tint,
                },
              ]}
              onPress={handleSyncDown}
              disabled={syncing}
            >
              <IconSymbol name="icloud.fill" size={16} color={c.tint} />
              <Text style={[styles.syncBtnText, { color: c.tint }]}>
                {syncing ? "Restoring…" : "Restore from Cloud"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, c }: { title: string; c: any }) {
  return (
    <Text style={[styles.sectionHeader, { color: c.subtext }]}>
      {title.toUpperCase()}
    </Text>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  c,
  secureTextEntry,
}: any) {
  return (
    <View style={styles.labeledInput}>
      <Text style={[styles.inputLabel, { color: c.subtext }]}>{label}</Text>
      <TextInput
        style={[styles.input, { color: c.text, borderColor: c.border }]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={c.subtext}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 10 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pageTitle: { fontSize: 20, fontWeight: "700" },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 2,
  },
  group: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionLabel: { fontSize: 15 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  switchLabel: { fontSize: 15 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 12,
    fontSize: 15,
  },
  labeledInput: { paddingHorizontal: 16, paddingVertical: 10, gap: 4 },
  inputLabel: { fontSize: 12, fontWeight: "600" },
  syncButtons: { gap: 10 },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  syncBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
