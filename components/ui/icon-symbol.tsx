// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // existing
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  // navigation
  "car.fill": "directions-car",
  "doc.fill": "description",
  "exclamationmark.circle.fill": "report-problem",
  ellipsis: "more-horiz",
  "person.crop.card.fill": "badge",
  "wrench.and.screwdriver.fill": "build",
  "fuelpump.fill": "local-gas-station",
  "gearshape.fill": "settings",
  "heart.fill": "favorite",
  // actions
  plus: "add",
  "plus.circle.fill": "add-circle",
  "camera.fill": "camera-alt",
  "doc.text.viewfinder": "document-scanner",
  "trash.fill": "delete",
  pencil: "edit",
  "square.and.arrow.up": "share",
  "arrow.left": "arrow-back",
  xmark: "close",
  checkmark: "check",
  magnifyingglass: "search",
  // status
  "clock.fill": "access-time",
  calendar: "calendar-today",
  "bell.fill": "notifications",
  "shield.fill": "security",
  "exclamationmark.triangle.fill": "warning",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "info.circle.fill": "info",
  // cloud
  "icloud.fill": "cloud",
  "icloud.and.arrow.up": "cloud-upload",
  "icloud.and.arrow.down": "cloud-download",
  // vin / vehicle details
  "barcode.viewfinder": "qr-code-scanner",
  "photo.fill": "photo",
  "mappin.and.ellipse": "location-on",
  speedometer: "speed",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
