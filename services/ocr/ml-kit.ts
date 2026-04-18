/**
 * On-device OCR using @infinitered/react-native-mlkit-text-recognition.
 * Requires an Expo development build — NOT compatible with Expo Go.
 */

import { Text } from "@infinitered/react-native-mlkit-text-recognition";

export async function recognizeFromUri(imageUri: string): Promise<Text> {
  try {
    const { recognizeText } =
      await import("@infinitered/react-native-mlkit-text-recognition");
    const result = await recognizeText(imageUri);
    console.log(result);

    return result;
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (
      msg.includes("Cannot find module") ||
      msg.includes("not available") ||
      msg.includes("linked")
    ) {
      throw new Error(
        "ML Kit text recognition is not available. Make sure you are running an Expo development build.",
      );
    }
    throw e;
  }
}
