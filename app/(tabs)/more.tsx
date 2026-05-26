import { ExpiryIndicator } from "@/components/ui/expiry-indicator";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, StatusColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  signInWithApple,
  signInWithGoogle,
  signOutUser,
} from "@/services/firebase/auth-service";
import { useAuthStore, useLicenseStore } from "@/store";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
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
                      { backgroundColor: c.tint + "22" },
                    ]}
                  >
                    <IconSymbol
                      name="person.crop.circle.fill"
                      size={28}
                      color={c.tint}
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
                <TouchableOpacity
                  style={[
                    styles.signOutBtn,
                    { borderColor: StatusColors.danger + "55" },
                  ]}
                  onPress={handleSignOut}
                  disabled={authLoading}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.signOutBtnText,
                      { color: StatusColors.danger },
                    ]}
                  >
                    Sign Out
                  </Text>
                </TouchableOpacity>
              </View>

              {license && (
                <>
                  <View
                    style={[styles.cardDivider, { backgroundColor: c.border }]}
                  />
                  <TouchableOpacity
                    style={styles.licenseInCard}
                    onPress={() => router.push("/license")}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.menuIcon,
                        { backgroundColor: c.tint + "18" },
                      ]}
                    >
                      <IconSymbol
                        name="person.text.rectangle"
                        size={20}
                        color={c.tint}
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
                  </TouchableOpacity>
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
                  <TouchableOpacity
                    style={styles.licenseInCard}
                    onPress={() => router.push("/license")}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.menuIcon,
                        { backgroundColor: c.tint + "18" },
                      ]}
                    >
                      <IconSymbol
                        name="person.text.rectangle"
                        size={20}
                        color={c.tint}
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
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

        {/* Menu items */}
        <View
          style={[
            styles.menuGroup,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          {MENU_ITEMS.map((item, index) => (
            <React.Fragment key={item.route}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.menuIcon, { backgroundColor: c.tint + "18" }]}
                >
                  <IconSymbol
                    name={item.icon as any}
                    size={20}
                    color={c.tint}
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
              </TouchableOpacity>
              {index < MENU_ITEMS.length - 1 && (
                <View style={[styles.divider, { backgroundColor: c.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 12, paddingBottom: 120, gap: 16 },
  // Account card
  accountCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
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
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  signOutBtnText: { fontSize: 13, fontWeight: "600" },
  signInPrompt: { gap: 12 },
  signInTextBlock: { gap: 3 },
  signInTitle: { fontSize: 16, fontWeight: "700" },
  signInSubtitle: { fontSize: 13 },
  signInBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  signInBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
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
  menuGroup: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 16, fontWeight: "600" },
  menuDesc: { fontSize: 12, marginTop: 1 },
  divider: { height: 1, marginLeft: 64 },
});
