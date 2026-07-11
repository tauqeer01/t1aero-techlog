import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@/src/theme";

// Sticky header. Renders inside safe area. Left slot for back button, right slot for action.
export function Header({
  title,
  subtitle,
  onBack,
  right,
  testID,
  large,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  testID?: string;
  large?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      testID={testID}
      style={[
        styles.header,
        {
          paddingTop: insets.top + spacing.sm,
          paddingBottom: large ? spacing.md : spacing.md,
        },
      ]}
    >
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            testID="header-back"
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        ) : (
          <View style={{ width: 8 }} />
        )}
        <View style={{ flex: 1, alignItems: onBack ? "center" : "flex-start" }}>
          {!large && (
            <>
              <Text style={typography.h3} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={[typography.bodyMuted, { fontSize: 12, marginTop: 1 }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </>
          )}
        </View>
        <View style={{ minWidth: 44, alignItems: "flex-end" }}>{right}</View>
      </View>
      {large ? (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
          <Text style={typography.h1}>{title}</Text>
          {subtitle ? (
            <Text style={[typography.bodyMuted, { marginTop: 2 }]}>{subtitle}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// Screen container — sets bg + safe-area sides. Bottom padding is per-screen.
export function Screen({
  children,
  style,
  testID,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}) {
  return (
    <View testID={testID} style={[styles.screen, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    minHeight: 44,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
});
