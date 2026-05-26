import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Sharing from "expo-sharing";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface ImageViewerModalProps {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export function ImageViewerModal({
  visible,
  uri,
  onClose,
}: ImageViewerModalProps) {
  const [sharing, setSharing] = React.useState(false);

  async function handleShare() {
    if (!uri) return;
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert(
        "Sharing not available",
        "Sharing is not supported on this device.",
      );
      return;
    }
    setSharing(true);
    try {
      await Sharing.shareAsync(uri, {
        dialogTitle: "Share Document",
        mimeType: "image/jpeg",
        UTI: "public.jpeg",
      });
    } catch (e: any) {
      Alert.alert("Share Error", String(e?.message ?? e));
    } finally {
      setSharing(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <IconSymbol name="xmark" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.iconBtn}
            hitSlop={8}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <IconSymbol name="square.and.arrow.up" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Image with pinch-to-zoom */}
        {uri ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            maximumZoomScale={5}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bouncesZoom
            centerContent
          >
            <Image source={{ uri }} style={styles.image} resizeMode="contain" />
          </ScrollView>
        ) : null}

        {/* Hint */}
        <View style={styles.bottomBar}>
          <Text style={styles.hint}>Pinch to zoom</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: (StatusBar.currentHeight ?? 44) + 8,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H * 0.75,
  },
  bottomBar: {
    paddingVertical: 16,
    alignItems: "center",
  },
  hint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
});
