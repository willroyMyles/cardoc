import auth from "@react-native-firebase/auth";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";

/**
 * Call once at app startup (e.g. in _layout.tsx) to configure Google Sign-In.
 *
 * webClientId: The OAuth 2.0 Web Client ID from the Firebase Console.
 * Go to Firebase Console → Authentication → Sign-in method → Google →
 * expand the "Web SDK configuration" section to copy the Web client ID.
 */
export function configureGoogleSignIn(webClientId: string) {
  GoogleSignin.configure({ webClientId });
}

export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();
    const idToken = signInResult.data?.idToken;
    if (!idToken)
      throw new Error("Google Sign-In failed: no ID token returned.");
    const credential = auth.GoogleAuthProvider.credential(idToken);
    return auth().signInWithCredential(credential);
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error("Sign-in cancelled.");
    }
    if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error("Sign-in already in progress.");
    }
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error("Google Play Services not available.");
    }
    console.log(error);

    throw error;
  }
}

export async function signInWithApple() {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Sign-In is only available on iOS.");
  }

  // Dynamically import to avoid loading on Android
  const { appleAuth } =
    await import("@invertase/react-native-apple-authentication");

  const appleAuthResponse = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
  });

  const { identityToken, nonce } = appleAuthResponse;
  if (!identityToken) {
    throw new Error("Apple Sign-In failed: no identity token returned.");
  }

  const credential = auth.AppleAuthProvider.credential(identityToken, nonce);
  return auth().signInWithCredential(credential);
}

export async function signOutUser() {
  // Also sign out from Google if the user used Google Sign-In
  try {
    const isSignedIn = (await GoogleSignin.getCurrentUser()) !== null;
    if (isSignedIn) await GoogleSignin.signOut();
  } catch {
    // Not signed in via Google — ignore
  }
  return auth().signOut();
}
