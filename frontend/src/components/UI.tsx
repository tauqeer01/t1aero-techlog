import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { colors, radius, spacing, typography } from "@/src/theme";

// --------------------------- Button ---------------------------
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "lg" | "md" | "sm";

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  disabled,
  loading,
  icon,
  testID,
  style,
  fullWidth = true,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  testID?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
}) {
  const height = size === "lg" ? 56 : size === "md" ? 48 : 40;
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
      ? colors.card
      : variant === "danger"
      ? colors.danger
      : "transparent";
  const borderColor =
    variant === "secondary" ? colors.border : variant === "ghost" ? colors.border : "transparent";
  const textColor = variant === "ghost" ? colors.text : "#FFFFFF";

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height,
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === "secondary" || variant === "ghost" ? 1 : 0,
          borderRadius: radius.lg,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={{ color: textColor, fontSize: size === "sm" ? 14 : 16, fontWeight: "700", letterSpacing: 0.2 }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

// --------------------------- Input ---------------------------
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  multiline,
  numberOfLines,
  testID,
  rightSlot,
  hint,
  error,
  ...rest
}: {
  label?: string;
  hint?: string;
  error?: string;
  rightSlot?: React.ReactNode;
} & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          multiline ? { minHeight: 100, paddingVertical: 12 } : { height: 56 },
          error ? { borderColor: colors.danger } : null,
        ]}
      >
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDim}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[styles.input, multiline ? { textAlignVertical: "top" } : null]}
          {...rest}
        />
        {rightSlot ? <View style={{ paddingRight: 12 }}>{rightSlot}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

// --------------------------- Card ---------------------------
export function Card({ children, style, testID }: { children: React.ReactNode; style?: ViewStyle; testID?: string }) {
  return (
    <View testID={testID} style={[styles.card, style]}>
      {children}
    </View>
  );
}

// --------------------------- Row (tappable list row) ---------------------------
export function Row({
  title,
  subtitle,
  left,
  right,
  onPress,
  testID,
  destructive,
}: {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  testID?: string;
  destructive?: boolean;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      {left ? <View style={{ marginRight: 12 }}>{left}</View> : null}
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, destructive ? { color: colors.danger } : null]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[typography.bodyMuted, { marginTop: 2 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={{ marginLeft: 12 }}>{right}</View> : null}
    </Pressable>
  );
}

// --------------------------- Section header ---------------------------
export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={typography.label}>{title}</Text>
      {right}
    </View>
  );
}

// --------------------------- Chip ---------------------------
export function Chip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? { backgroundColor: colors.primaryDim, borderColor: colors.primary } : null,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text
        style={{
          color: active ? colors.primary : colors.textMuted,
          fontWeight: "700",
          fontSize: 13,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    marginLeft: 4,
  },
  inputWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: "500",
  },
  hint: { fontSize: 12, color: colors.textDim, marginLeft: 4 },
  error: { fontSize: 12, color: colors.danger, marginLeft: 4 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  row: {
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginTop: 4,
    marginBottom: 10,
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
