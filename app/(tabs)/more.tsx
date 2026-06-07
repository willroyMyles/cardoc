import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { ExpiryIndicator } from "@/components/ui/expiry-indicator";
import { Header } from "@/components/ui/header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AccentColor, Colors, Radius, Shadows, Spacing, StatusColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  signInWithApple,
  signInWithGoogle,
  signOutUser,
} from "@/services/firebase/auth-service";
import { haptics } from "@/services/haptics";
import { useAuthStore, useLicenseStore } from "@/store";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type MenuItem = {
  label: string;
  icon: string;
  route: string;
  description?: string;
};

const MENU_ITEMS: MenuItem[] = [
  {
    label: "Documents",
    icon: "doc.fill",
    route: "/(tabs)/documents",
    description: "All your vehicle documents",
  },
  {
    label: "Driver's License",
    icon: "person.text.rectangle",
    route: "/license",
    description: "View & scan your license",
  },
  {
    label: "Emergency Card",
    icon: "heart.fill",
    route: "/emergency",
    description: "Quick-access emergency info",
  },
  {
    label: "Settings",
    icon: "gearshape.fill",
    route: "/settings",
    description: "Region, cloud sync & notifications",
  },
];

export default function MoreScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const license = useLicenseStore((s) => s.license);

  const user = useAuthStore((s) => s.user);
  const setLoading = useAuthStore((s) => s.setLoading);
  const authLoading = useAuthStore((s) => s.loading);
  const [authError, setAuthError] = useState<string | null>(null);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <Header title="More" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Account / Sign-In card — merges license info when signed in */}
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

              {license && (
                <>
                  <View
                    style={[styles.cardDivider, { backgroundColor: c.border }]}
                  />
                  <AnimatedPressable
                    style={styles.licenseInCard}
                    onPress={() => router.push("/license")}
                    pressedScale={0.98}
                  >
                    <View
                      style={[
                        styles.menuIcon,
                        { backgroundColor: "#1A1A1A" },
                      ]}
                    >
                      <IconSymbol
                        name="person.text.rectangle"
                        size={20}
                        color={AccentColor}
                      />
                    </View>
                    <View style={styles.licenseInCardInfo}>
                      <Text
                        style={[styles.licenseInCardName, { color: c.text }]}
                      >
                        {license.fields.fullName ?? "Driver's License"}
                      </Text>
                      <Text
                        style={[styles.licenseInCardSub, { color: c.subtext }]}
                      >
                        {license.fields.licenseNumber ?? ""}
                      </Text>
                    </View>
                    <ExpiryIndicator
                      expiryDate={license.fields.expiryDate ?? ""}
                    />
                    <IconSymbol
                      name="chevron.right"
                      size={16}
                      color={c.subtext}
                    />
                  </AnimatedPressable>
                </>
              )}
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
                <Text
                  style={[styles.authError, { color: StatusColors.danger }]}
                >
                  {authError}
                </Text>
              ) : null}

              {license && (
                <>
                  <View
                    style={[styles.cardDivider, { backgroundColor: c.border }]}
                  />
                  <AnimatedPressable
                    style={styles.licenseInCard}
                    onPress={() => router.push("/license")}
                    pressedScale={0.98}
                  >
                    <View
                      style={[
                        styles.menuIcon,
                        { backgroundColor: "#1A1A1A" },
                      ]}
                    >
                      <IconSymbol
                        name="person.text.rectangle"
                        size={20}
                        color={AccentColor}
                      />
                    </View>
                    <View style={styles.licenseInCardInfo}>
                      <Text
                        style={[styles.licenseInCardName, { color: c.text }]}
                      >
                        {license.fields.fullName ?? "Driver's License"}
                      </Text>
                      <Text
                        style={[styles.licenseInCardSub, { color: c.subtext }]}
                      >
                        {license.fields.licenseNumber ?? ""}
                      </Text>
                    </View>
                    <ExpiryIndicator
                      expiryDate={license.fields.expiryDate ?? ""}
                    />
                    <IconSymbol
                      name="chevron.right"
                      size={16}
                      color={c.subtext}
                    />
                  </AnimatedPressable>
                </>
              )}
            </View>
          )}
        </View>

        {/* Menu items — each as its own card */}
        {MENU_ITEMS.map((item) => (
          <AnimatedPressable
            key={item.route}
            style={[
              styles.menuItem,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
            onPress={() => router.push(item.route as any)}
            pressedScale={0.98}
          >
            <View
              style={[styles.menuIcon, { backgroundColor: "#1A1A1A" }]}
            >
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
              {item.description ? (
                <Text style={[styles.menuDesc, { color: c.subtext }]}>
                  {item.description}
                </Text>
              ) : null}
            </View>
            <IconSymbol name="chevron.right" size={16} color={c.subtext} />
          </AnimatedPressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.page, paddingBottom: 120, gap: 12 },
  // Account card
  accountCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 20,
    gap: 0,
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
    minWidth: 82,
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  signOutBtnText: { fontSize: 13, fontWeight: "600" },
  signInPrompt: { gap: 12 },
  signInTextBlock: { gap: 3 },
  signInTitle: { fontSize: 16, fontWeight: "700" },
  signInSubtitle: { fontSize: 13 },
  signInBtn: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: "center",
  },
  signInBtnText: { color: "#fff", fontSize: 13, fontWeight: "700", letterSpacing: 1 },
  authError: { fontSize: 12, marginTop: 4 },
  cardDivider: { height: 1, marginVertical: 14 },
  licenseInCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  licenseInCardInfo: { flex: 1 },
  licenseInCardName: { fontSize: 14, fontWeight: "600" },
  licenseInCardSub: { fontSize: 12, marginTop: 1 },
  // Menu
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.cardPadding,
    gap: 14,
    borderRadius: Radius.card,
    borderWidth: 1,
    ...Shadows.card,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.tile,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "600" },
  menuDesc: { fontSize: 12, marginTop: 1 },
});
