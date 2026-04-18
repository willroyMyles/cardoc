/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#1A6FE8";
const tintColorDark = "#4093F4";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#F5F6FA",
    card: "#FFFFFF",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    border: "#E5E7EB",
    subtext: "#6B7280",
  },
  dark: {
    text: "#ECEDEE",
    background: "#0F1117",
    card: "#1C1E26",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    border: "#2D3748",
    subtext: "#9BA1A6",
  },
};

/** Semantic status colors — same in both schemes for clarity */
export const StatusColors = {
  danger: "#EF4444",
  dangerBg: "#FEF2F2",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  success: "#10B981",
  successBg: "#ECFDF5",
  info: "#3B82F6",
  infoBg: "#EFF6FF",
  neutral: "#6B7280",
  neutralBg: "#F3F4F6",
};

/** Document type accent colors */
export const DocTypeColors: Record<string, string> = {
  registration: "#3B82F6",
  insurance: "#8B5CF6",
  inspection: "#F59E0B",
  title: "#10B981",
  roadworthy: "#06B6D4",
  emission: "#84CC16",
  other: "#6B7280",
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
