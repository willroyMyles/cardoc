import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { AppSwitch } from "@/components/ui/app-switch";
import { Header } from "@/components/ui/header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SectionHeader } from "@/components/ui/section-header";
import {
  AccentColor,
  Colors,
  Fonts,
  Radius,
  Shadows,
  Spacing,
  StatusColors,
  Type,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { COUNTRY_LABELS, type CountryCode } from "@/services/docs-registry";
import {
  signInWithApple,
  signInWithGoogle,
  signOutUser,
} from "@/services/firebase/auth-service";
import { syncAllStores } from "@/services/firebase/sync-manager";
import { haptics } from "@/services/haptics";
import { requestNotificationPermissions } from "@/services/notifications/expiry-reminders";
import { useAuthStore, useSettingsStore } from "@/store";
import { type SyncMode } from "@/store/settings-store";
import { useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { useMediaLibraryPermissions } from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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
    label: "Vehicles",
    route: "/vehicles",
    description: "Manage vehicles from scanned documents",
    icon: "car.fill",
  },
  {
    label: "Documents",
    route: "/documents",
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
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState<
    "notifications" | "camera" | "media" | null
  >(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  const currentCountryLabel = COUNTRY_LABELS[country] ?? country;

  function handleCountryPick() {
    setCountryDropdownOpen((open) => !open);
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
    if (mode !== syncMode) {
      setSyncMode(mode);
      void haptics.selection();
    }
  };

  const handleSyncNow = async () => {
    if (!user) {
      Alert.alert("Not signed in", "Sign in to sync with Firebase.");
      return;
    }
    setSyncing(true);
    try {
      await syncAllStores();
      void haptics.success();
      Alert.alert("Synced", "All stores reconciled with Firestore.");
    } catch (e: any) {
      Alert.alert("Sync failed", e?.message ?? "An error occurred.");
    } finally {
      setSyncing(false);
    }
  };

  const handleNotificationsToggle = async (val: boolean) => {
    setPermissionLoading("notifications");
    if (val) {
      try {
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
      } finally {
        setPermissionLoading(null);
      }
    }
    setNotificationsEnabled(val);
    setPermissionLoading(null);
    void haptics.selection();
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
      void haptics.success();
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
      void haptics.success();
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
            void haptics.warning();
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
    setPermissionLoading("camera");
    try {
      const result = await requestCameraPermission();
      if (result.granted) void haptics.selection();
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
    } finally {
      setPermissionLoading(null);
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
    setPermissionLoading("media");
    try {
      const result = await requestMediaPermission();
      if (result.granted) void haptics.selection();
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
    } finally {
      setPermissionLoading(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <Header title="Settings" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
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
                  <Text
                    style={[styles.accountName, { color: c.text }]}
                    numberOfLines={1}
                  >
                    {user.displayName ?? "Signed In"}
                  </Text>
                  {user.email ? (
                    <Text
                      style={[styles.accountEmail, { color: c.subtext }]}
                      numberOfLines={1}
                    >
                      {user.email}
                    </Text>
                  ) : null}
                </View>
                <AnimatedPressable
                  style={[
                    styles.signOutBtn,
                    { borderColor: StatusColors.danger + "55" },
                  ]}
                  onPress={handleSignOut}
                  disabled={authLoading}
                  pressedScale={0.96}
                >
                  {authLoading ? (
                    <ActivityIndicator color={StatusColors.danger} size="small" />
                  ) : (
                    <Text
                      style={[
                        styles.signOutBtnText,
                        { color: StatusColors.danger },
                      ]}
                    >
                      Sign Out
                    </Text>
                  )}
                </AnimatedPressable>
              </View>
            </>
          ) : (
            <View style={styles.signInPrompt}>
              <View style={styles.signInTextBlock}>
                <Text style={[styles.signInTitle, { color: c.text }]}>
                  Sync your data
                </Text>
                <Text style={[styles.signInSubtitle, { color: c.subtext }]}>
                  Sign in to back up and sync across devices
                </Text>
              </View>
              <AnimatedPressable
                style={[styles.signInBtn, { backgroundColor: c.tint }]}
                onPress={handleSignIn}
                disabled={authLoading}
                pressedScale={0.96}
              >
                {authLoading ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.signInBtnText}>Signing in</Text>
                  </>
                ) : (
                  <Text style={styles.signInBtnText}>Sign In</Text>
                )}
              </AnimatedPressable>
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
            <AnimatedPressable
              key={item.route}
              style={[
                styles.menuRow,
                index < QUICK_LINKS.length - 1 && {
                  borderBottomColor: c.border,
                  borderBottomWidth: 1,
                },
              ]}
              onPress={() => {
                // if (
                //   item.route === "/(tabs)/documents" ||
                //   item.route === "/(tabs)/vehicles"
                // ) {
                //   router.push({
                //     pathname: item.route as any,
                //     params: { backTo: "/settings" },
                //   });
                //   return;
                // }
                router.push(item.route as any);

                console.log(item);
                
              }}
            >
              <View style={[styles.menuIcon, { backgroundColor: "#1A1A1A" }]}>
                <IconSymbol
                  name={item.icon as any}
                  size={20}
                  color={AccentColor}
                />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuLabel, { color: c.text }]}>
                  {item.label}
                </Text>
                <Text style={[styles.menuDesc, { color: c.subtext }]}>
                  {item.description}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={c.subtext} />
            </AnimatedPressable>
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
          <AnimatedPressable
            style={styles.countryRow}
            onPress={handleCountryPick}
          >
            <View style={styles.rowText}>
              <Text style={[styles.countryLabel, { color: c.text }]}>
                {currentCountryLabel}
              </Text>
              <Text style={[styles.countryHint, { color: c.subtext }]}>
                Document parsing region
              </Text>
            </View>
            <View style={styles.rowTrailing}>
              <IconSymbol
                name={countryDropdownOpen ? "chevron.up" : "chevron.down"}
                size={18}
                color={c.subtext}
              />
            </View>
          </AnimatedPressable>
          {countryDropdownOpen ? (
            <View style={[styles.countryDropdown, { borderTopColor: c.border }]}>
              {COUNTRIES.map(([code, label], index) => {
                const selected = code === country;
                return (
                  <AnimatedPressable
                    key={code}
                    style={[
                      styles.countryOption,
                      index < COUNTRIES.length - 1 && {
                        borderBottomColor: c.border,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                      },
                    ]}
                    onPress={() => {
                      if (code !== country) void haptics.selection();
                      setCountry(code);
                      setCountryDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.countryOptionText,
                        { color: selected ? c.tint : c.text },
                      ]}
                    >
                      {label}
                    </Text>
                    {selected ? (
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={18}
                        color={c.tint}
                      />
                    ) : null}
                  </AnimatedPressable>
                );
              })}
            </View>
          ) : null}
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
            <View style={styles.rowText}>
              <Text style={[styles.switchLabel, { color: c.text }]}>
                Document Expiry Reminders
              </Text>
              <Text style={[styles.optionDescription, { color: c.subtext }]}>
                Get notified before registrations, insurance, and licenses expire
              </Text>
            </View>
            <AppSwitch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              disabled={permissionLoading !== null}
            />
            {permissionLoading === "notifications" ? (
              <ActivityIndicator color={c.tint} size="small" />
            ) : null}
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
            <View style={styles.rowText}>
              <Text style={[styles.switchLabel, { color: c.text }]}>
                Camera
              </Text>
              <Text style={[styles.optionDescription, { color: c.subtext }]}>
                Required for scanning documents
              </Text>
            </View>
            <AppSwitch
              value={cameraPermission?.status === "granted"}
              onValueChange={handleCameraToggle}
              disabled={permissionLoading !== null}
            />
            {permissionLoading === "camera" ? (
              <ActivityIndicator color={c.tint} size="small" />
            ) : null}
          </View>
          <View style={[styles.permDivider, { backgroundColor: c.border }]} />
          <View style={styles.switchRow}>
            <View style={styles.rowText}>
              <Text style={[styles.switchLabel, { color: c.text }]}>
                Photo Library
              </Text>
              <Text style={[styles.optionDescription, { color: c.subtext }]}>
                Required for uploading document images
              </Text>
            </View>
            <AppSwitch
              value={mediaPermission?.status === "granted"}
              onValueChange={handleMediaToggle}
              disabled={permissionLoading !== null}
            />
            {permissionLoading === "media" ? (
              <ActivityIndicator color={c.tint} size="small" />
            ) : null}
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
            <AnimatedPressable
              key={mode.value}
              style={styles.optionRow}
              onPress={() => handleSyncModeChange(mode.value)}
            >
              <View style={styles.rowText}>
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
            </AnimatedPressable>
          ))}
        </View>

        {syncMode === "online" && (
          <>
            {!user && (
              <Text style={[styles.onlineWarning, { color: c.subtext }]}>
                Sign in to enable Firestore sync.
              </Text>
            )}
            <AnimatedPressable
              style={[
                styles.syncBtn,
                {
                  backgroundColor: c.tint,
                  opacity: !user || syncing ? 0.5 : 1,
                },
              ]}
              onPress={handleSyncNow}
              disabled={!user || syncing}
              pressedScale={0.96}
            >
              {syncing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <IconSymbol name="icloud.fill" size={16} color="#fff" />
              )}
              <Text style={styles.syncBtnText}>
                {syncing ? "Syncing" : "Sync Now"}
              </Text>
            </AnimatedPressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing.page,
    paddingBottom: 40,
    gap: 10,
  },
  group: {
    borderRadius: Radius.surface,
    borderWidth: 1,
    overflow: "hidden",
    ...Shadows.card,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.page,
    paddingVertical: 14,
    gap: Spacing.rowGap,
  },
  optionLabel: {
    ...Type.title,
    fontFamily: Fonts.sans,
    fontSize: 15,
  },
  optionDescription: {
    ...Type.caption,
    fontFamily: Fonts.sans,
    marginTop: 3,
  },
  onlineWarning: {
    ...Type.caption,
    fontFamily: Fonts.sans,
    paddingHorizontal: 4,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.page,
    paddingVertical: 14,
    gap: Spacing.rowGap,
  },
  switchLabel: {
    ...Type.title,
    fontFamily: Fonts.sans,
    fontSize: 15,
  },
  permDivider: { height: 1, marginHorizontal: Spacing.page },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.page,
    paddingVertical: 14,
    gap: Spacing.rowGap,
  },
  countryLabel: {
    ...Type.title,
    fontFamily: Fonts.sans,
    fontSize: 15,
  },
  countryHint: {
    ...Type.caption,
    fontFamily: Fonts.sans,
    marginTop: 3,
  },
  countryDropdown: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  countryOption: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.page,
    paddingVertical: 12,
    gap: Spacing.rowGap,
  },
  countryOptionText: {
    ...Type.title,
    flex: 1,
    minWidth: 0,
    fontFamily: Fonts.sans,
    fontSize: 15,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTrailing: {
    width: 24,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: Radius.pill,
  },
  syncBtnText: {
    color: "#fff",
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  accountCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.cardPadding,
    marginBottom: 4,
    gap: 12,
    ...Shadows.card,
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
  accountName: {
    ...Type.title,
    fontFamily: Fonts.sans,
    fontSize: 15,
  },
  accountEmail: {
    ...Type.caption,
    fontFamily: Fonts.sans,
    marginTop: 2,
  },
  signOutBtn: {
    minWidth: 82,
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  signOutBtnText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: "700",
  },
  signInPrompt: { gap: 12 },
  signInTextBlock: { gap: 3 },
  signInTitle: {
    ...Type.title,
    fontFamily: Fonts.sans,
  },
  signInSubtitle: {
    ...Type.body,
    fontFamily: Fonts.sans,
  },
  signInBtn: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: "center",
  },
  signInBtnText: {
    color: "#fff",
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  authError: {
    ...Type.caption,
    fontFamily: Fonts.sans,
    marginTop: 4,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.page,
    paddingVertical: 16,
    gap: Spacing.rowGap,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.tile,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: { flex: 1 },
  menuLabel: {
    ...Type.title,
    fontFamily: Fonts.sans,
    fontSize: 15,
  },
  menuDesc: {
    ...Type.caption,
    fontFamily: Fonts.sans,
    marginTop: 2,
  },
});
