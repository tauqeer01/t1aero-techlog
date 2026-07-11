import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "@/src/theme";

// Reusable modal bottom sheet. Not a fully gestural sheet — this keeps things
// simple, native-feeling and reliable in Expo Go. Tap outside or the close
// button to dismiss.
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  heightRatio = 0.75,
  testID,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  heightRatio?: number;
  testID?: string;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetHeight = Math.max(320, Math.min(height * heightRatio, height - insets.top - 40));
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      translateY.setValue(sheetHeight);
      backdrop.setValue(0);
    }
  }, [visible, sheetHeight, translateY, backdrop]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.6)", opacity: backdrop },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} testID={testID ? `${testID}-backdrop` : undefined} />
        </Animated.View>
        <Animated.View
          testID={testID}
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: insets.bottom + spacing.md,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />
          {title ? (
            <View style={styles.header}>
              <Text style={typography.h2}>{title}</Text>
              <Pressable
                onPress={onClose}
                testID={testID ? `${testID}-close` : undefined}
                hitSlop={12}
                style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>Done</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={{ flex: 1 }}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  closeBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
});
