import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { COUNTRY_LABELS, type CountryCode } from "@/services/docs-registry";
import { syncAllStores } from "@/services/firebase/sync-manager";
import { requestNotificationPermissions } from "@/services/notifications/expiry-reminders";
import { useAuthStore, useSettingsStore } from "@/store";
import { type SyncMode } from "@/store/settings-store";
import { useCameraPermissions } from "expo-camera";
import { useMediaLibraryPermissions } from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActionSheetIOS,
    Alert,
    Linking,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const COUNTRIES = Object.entries(COUNTRY_LABELS) as [CountryCode, string][];

const SYNC_MODES: { value: SyncMode; label: string; description: string }[] = [
  {
    value: "local",
    label: "Local only",
    description: "Data stored on this device",
  },
  {
    value: "online",
    label: "Online (Firebase)",
    description: "Sync across devices via Firestore",
  },
];

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const {
    country,
    setCountry,
    syncMode,
    setSyncMode,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useSettingsStore();

  const user = useAuthStore((s) => s.user);

  const [syncing, setSyncing] = useState(false);

  const currentCountryLabel = COUNTRY_LABELS[country] ?? country;

  function handleCountryPick() {
    const options = COUNTRIES.map(([, label]) => label);
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancel", ...options], cancelButtonIndex: 0 },
        (i) => {
          if (i > 0) setCountry(COUNTRIES[i - 1][0]);
        },
      );
    } else {
      Alert.alert("Select Country", undefined, [
        { text: "Cancel", style: "cancel" },
        ...COUNTRIES.map(([code, label]) => ({
          text: label,
          onPress: () => setCountry(code),
        })),
      ]);
    }
  }

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    useMediaLibraryPermissions();

  const handleSyncModeChange = (mode: SyncMode) => {
    if (mode === "online" && !user) {
      Alert.alert(
        "Sign In Required",
        "Online sync requires an account. Sign in from the More tab.",
        [
          { text: "Later", style: "cancel" },
          { text: "Go to More", onPress: () => router.push("/(tabs)/more") },
        ],
      );
      return;
    }
    setSyncMode(mode);
  };

  const handleSyncNow = async () => {
    if (!user) {
      Alert.alert("Not signed in", "Sign in to sync with Firebase.");
      return;
    }
    setSyncing(true);
    try {
      await syncAllStores();
      Alert.alert("Synced", "All stores reconciled with Firestore.");
    } catch (e: any) {
      Alert.alert("Sync failed", e?.message ?? "An error occurred.");
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
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
    }
    setNotificationsEnabled(val);
  };

  const handleCameraToggle = async (val: boolean) => {
    if (!val) {
      Alert.alert(
        "Revoke Camera Access",
        "To revoke camera access, go to System Settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    if (cameraPermission?.status === "granted") return;
    const result = await requestCameraPermission();
    if (!result.granted) {
      Alert.alert(
        "Camera Permission Denied",
        "Enable camera access in System Settings to scan documents.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
    }
  };

  const handleMediaToggle = async (val: boolean) => {
    if (!val) {
      Alert.alert(
        "Revoke Photo Library Access",
        "To revoke access, go to System Settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    if (mediaPermission?.status === "granted") return;
    const result = await requestMediaPermission();
    if (!result.granted) {
      Alert.alert(
        "Photo Library Permission Denied",
        "Enable photo library access in System Settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="xmark" size={22} color={c.tint} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: c.text }]}>Settings</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Country */}
        <SectionHeader title="Country" c={c} />
        <View
          style={[
            styles.group,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <TouchableOpacity
            style={styles.countryRow}
            onPress={handleCountryPick}
            activeOpacity={0.7}
          >
            <Text style={[styles.countryLabel, { color: c.text }]}>
              {currentCountryLabel}
            </Text>
            <IconSymbol name="chevron.right" size={16} color={c.subtext} />
          </TouchableOpacity>
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

        {/* Permissions */}
        <SectionHeader title="Permissions" c={c} />
        <View
          style={[
            styles.group,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.switchLabel, { color: c.text }]}>
                Camera
              </Text>
              <Text style={[styles.optionDescription, { color: c.subtext }]}>
                Required for scanning documents
              </Text>
            </View>
            <Switch
              value={cameraPermission?.status === "granted"}
              onValueChange={handleCameraToggle}
            />
          </View>
          <View style={[styles.permDivider, { backgroundColor: c.border }]} />
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.switchLabel, { color: c.text }]}>
                Photo Library
              </Text>
              <Text style={[styles.optionDescription, { color: c.subtext }]}>
                Required for uploading document images
              </Text>
            </View>
            <Switch
              value={mediaPermission?.status === "granted"}
              onValueChange={handleMediaToggle}
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
          {SYNC_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.value}
              style={styles.optionRow}
              onPress={() => handleSyncModeChange(mode.value)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: c.text }]}>
                  {mode.label}
                </Text>
                <Text style={[styles.optionDescription, { color: c.subtext }]}>
                  {mode.description}
                </Text>
              </View>
              {syncMode === mode.value && (
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={20}
                  color={c.tint}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {syncMode === "online" && (
          <>
            {!user && (
              <Text style={[styles.onlineWarning, { color: c.subtext }]}>
                Sign in to enable Firestore sync.
              </Text>
            )}
            <TouchableOpacity
              style={[
                styles.syncBtn,
                {
                  backgroundColor: c.tint,
                  opacity: !user || syncing ? 0.5 : 1,
                },
              ]}
              onPress={handleSyncNow}
              disabled={!user || syncing}
            >
              <IconSymbol name="icloud.fill" size={16} color="#fff" />
              <Text style={styles.syncBtnText}>
                {syncing ? "Syncing…" : "Sync Now"}
              </Text>
            </TouchableOpacity>
          </>
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
  optionDescription: { fontSize: 12, marginTop: 2 },
  onlineWarning: { fontSize: 13, paddingHorizontal: 4 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  switchLabel: { fontSize: 15 },
  permDivider: { height: 1, marginHorizontal: 16 },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  countryLabel: { fontSize: 15, fontWeight: "500" },
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
