import { InlineDataPart, TextPart } from "@react-native-firebase/ai";
import { File } from "expo-file-system";
import { getModel } from "./index";

export interface AIImageInput {
  /** Local file URI (e.g. from ImagePicker) or a remote http/https URL. */
  uri: string;
  /** MIME type of the image. Defaults to "image/jpeg". */
  mimeType?: string;
}

/**
 * Sends one or more images along with a text prompt to Gemini and returns
 * the model's text response.
 *
 * @param images - One or more images to include in the request.
 * @param prompt - The text instruction / question about the images.
 * @param modelName - Gemini model to use (default: "gemini-2.5-flash").
 */
export async function processImagesWithAI(
  images: AIImageInput[],
  prompt: string,
  modelName = "gemini-2.5-flash",
): Promise<string> {
  const model = getModel(modelName);

  const imageParts: InlineDataPart[] = await Promise.all(
    images.map(async ({ uri, mimeType = "image/jpeg" }) => {
      const base64 = await uriToBase64(uri);
      return {
        inlineData: { mimeType, data: base64 },
      } satisfies InlineDataPart;
    }),
  );

  const textPart: TextPart = { text: prompt };

  const result = await model.generateContent([...imageParts, textPart]);
  return result.response.text();
}

/** Converts a local file URI or remote URL to a base64 string (no prefix). */
async function uriToBase64(uri: string): Promise<string> {
  let buffer: ArrayBuffer;
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    buffer = await (await fetch(uri)).arrayBuffer();
  } else {
    buffer = await new File(uri).arrayBuffer();
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
