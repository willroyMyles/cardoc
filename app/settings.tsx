import { Header } from "@/components/ui/header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SectionHeader } from "@/components/ui/section-header";
import { AccentColor, Colors, StatusColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { COUNTRY_LABELS, type CountryCode } from "@/services/docs-registry";
import {
  signInWithApple,
  signInWithGoogle,
  signOutUser,
} from "@/services/firebase/auth-service";
import { syncAllStores } from "@/services/firebase/sync-manager";
import { requestNotificationPermissions } from "@/services/notifications/expiry-reminders";
import { useAuthStore, useLicenseStore, useSettingsStore } from "@/store";
import { type SyncMode } from "@/store/settings-store";
import { useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
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
  TextInput,
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

const QUICK_LINKS = [
  {
    label: "Documents",
    route: "/(tabs)/documents",
    description: "All your vehicle documents",
    icon: "doc.fill",
  },
  {
    label: "Driver's License",
    route: "/license",
    description: "View & scan your license",
    icon: "person.text.rectangle",
  },
  {
    label: "Emergency Card",
    route: "/emergency",
    description: "Quick-access emergency info",
    icon: "heart.fill",
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
  const authLoading = useAuthStore((s) => s.loading);
  const setLoading = useAuthStore((s) => s.setLoading);
  const license = useLicenseStore((s) => s.license);
  const [authError, setAuthError] = useState<string | null>(null);
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

  function handleSignIn() {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Sign In",
          message: "Choose a sign-in method",
          options: ["Cancel", "Continue with Google", "Continue with Apple"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) doGoogleSignIn();
          if (buttonIndex === 2) doAppleSignIn();
        },
      );
    } else {
      Alert.alert("Sign In", "Choose a sign-in method", [
        { text: "Cancel", style: "cancel" },
        { text: "Continue with Google", onPress: doGoogleSignIn },
      ]);
    }
  }

  async function doGoogleSignIn() {
    setAuthError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      if (e.message !== "Sign-in cancelled.") setAuthError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function doAppleSignIn() {
    setAuthError(null);
    setLoading(true);
    try {
      await signInWithApple();
    } catch (e: any) {
      if (e.message !== "Sign-in cancelled.") setAuthError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await signOutUser();
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }

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
        <Header title="Settings" onBack={() => router.back()} />

        <View
          style={[
            styles.accountCard,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          {user ? (
            <>
              <View style={styles.accountRow}>
                {user.photoURL ? (
                  <Image
                    source={{ uri: user.photoURL }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { backgroundColor: "#1A1A1A" },
                    ]}
                  >
                    <IconSymbol
                      name="person.crop.circle.fill"
                      size={28}
                      color={AccentColor}
                    />
                  </View>
                )}
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, { color: c.text }]} numberOfLines={1}>
                    {user.displayName ?? "Signed In"}
                  </Text>
                  {user.email ? (
                    <Text style={[styles.accountEmail, { color: c.subtext }]} numberOfLines={1}>
                      {user.email}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[
                    styles.signOutBtn,
                    { borderColor: StatusColors.danger + "55" },
                  ]}
                  onPress={handleSignOut}
                  disabled={authLoading}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.signOutBtnText, { color: StatusColors.danger }]}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.signInPrompt}>
              <View style={styles.signInTextBlock}>
                <Text style={[styles.signInTitle, { color: c.text }]}>Sync your data</Text>
                <Text style={[styles.signInSubtitle, { color: c.subtext }]}>Sign in to back up and sync across devices</Text>
              </View>
              <TouchableOpacity
                style={[styles.signInBtn, { backgroundColor: c.tint }]}
                onPress={handleSignIn}
                disabled={authLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.signInBtnText}>
                  {authLoading ? "Signing in…" : "Sign In"}
                </Text>
              </TouchableOpacity>
              {authError ? (
                <Text style={[styles.authError, { color: StatusColors.danger }]}>
                  {authError}
                </Text>
              ) : null}
            </View>
          )}
        </View>

        <SectionHeader title="Quick Access" />
        <View
          style={[
            styles.group,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          {QUICK_LINKS.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.menuRow,
                index < QUICK_LINKS.length - 1 && {
                  borderBottomColor: c.border,
                  borderBottomWidth: 1,
                },
              ]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIcon, { backgroundColor: "#1A1A1A" }]}> 
                <IconSymbol name={item.icon as any} size={20} color={AccentColor} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuLabel, { color: c.text }]}> {item.label}</Text>
                <Text style={[styles.menuDesc, { color: c.subtext }]}> {item.description}</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={c.subtext} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Country */}
        <SectionHeader title="Country" />
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
        <SectionHeader title="Notifications" />
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
        <SectionHeader title="Permissions" />
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
        <SectionHeader title="Cloud Sync" />
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
  labeledInput: { gap: 4, marginBottom: 8 },
  inputLabel: { fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14 },
  group: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
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
  accountCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
    gap: 12,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 15, fontWeight: "700" },
  accountEmail: { fontSize: 12, marginTop: 2 },
  signOutBtn: {
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  signOutBtnText: { fontSize: 13, fontWeight: "600" },
  signInPrompt: { gap: 12 },
  signInTextBlock: { gap: 3 },
  signInTitle: { fontSize: 16, fontWeight: "700" },
  signInSubtitle: { fontSize: 13 },
  signInBtn: {
    borderRadius: 99,
    paddingVertical: 14,
    alignItems: "center",
  },
  signInBtnText: { color: "#fff", fontSize: 13, fontWeight: "700", letterSpacing: 1 },
  authError: { fontSize: 12, marginTop: 4 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "600" },
  menuDesc: { fontSize: 12, marginTop: 1 },
});
