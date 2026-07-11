import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAircraft, getCredentials, getEntries, getSettings, patchSettings, wipeAll } from "@/src/store/db";
import { loadSampleData } from "@/src/store/seed";
import { AppSettings } from "@/src/store/types";
import { colors, radius, spacing, typography } from "@/src/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [counts, setCounts] = useState({ entries: 0, aircraft: 0, creds: 0 });

  const reload = useCallback(async () => {
    const [s, e, a, c] = await Promise.all([getSettings(), getEntries(), getAircraft(), getCredentials()]);
    setSettings(s);
    setCounts({ entries: e.length, aircraft: a.length, creds: c.length });
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const toggleHaptics = async (v: boolean) => {
    if (!settings) return;
    const next = await patchSettings({ hapticsEnabled: v });
    setSettings(next);
  };

  const doSeed = () => {
    Alert.alert("Load sample data?", "Adds demo aircraft, entries and credentials so you can explore the app. Existing data will be replaced.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Load Sample",
        onPress: async () => {
          await wipeAll();
          await loadSampleData();
          await patchSettings({ onboarded: true });
          await reload();
        },
      },
    ]);
  };

  const doWipe = () => {
    Alert.alert("Erase everything?", "This deletes all entries, aircraft and credentials on this device. It cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Erase All",
        style: "destructive",
        onPress: async () => {
          await wipeAll();
          await patchSettings({ onboarded: true });
          await reload();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="settings-screen">
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.head, { paddingTop: insets.top + spacing.md }]}>
          <Text style={typography.h1}>Settings</Text>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{settings?.displayName || "Aircraft Maintenance Engineer"}</Text>
            <Text style={styles.profileSub}>
              {counts.entries} entries · {counts.aircraft} aircraft · {counts.creds} credentials
            </Text>
          </View>
        </View>

        <SectionLabel label="DATA" />
        <Group>
          <Row
            testID="settings-export"
            icon="download-outline"
            title="Export logbook"
            subtitle="PDF & CSV — offline, unlimited"
            onPress={() => router.push("/export")}
          />
          <Row
            testID="settings-bulk"
            icon="albums-outline"
            title="Bulk entry"
            subtitle="Log same task across many aircraft"
            onPress={() => router.push("/bulk-entry")}
          />
        </Group>

        <SectionLabel label="PREFERENCES" />
        <Group>
          <Row
            icon="phone-portrait-outline"
            title="Haptic feedback"
            subtitle="Vibration on key actions"
            right={
              <Switch
                testID="settings-haptics"
                value={!!settings?.hapticsEnabled}
                onValueChange={toggleHaptics}
                trackColor={{ true: colors.primary, false: colors.borderStrong }}
                thumbColor="#fff"
              />
            }
          />
          <Row
            icon="moon-outline"
            title="Appearance"
            subtitle="Dark (optimised for hangar & nightshift)"
            right={<Text style={styles.rightHint}>Dark</Text>}
          />
        </Group>

        <SectionLabel label="DEMO" />
        <Group>
          <Row
            testID="settings-seed"
            icon="sparkles-outline"
            title="Load sample data"
            subtitle="Populate the app with realistic demo entries"
            onPress={doSeed}
          />
          <Row
            testID="settings-wipe"
            icon="trash-outline"
            title="Erase all data"
            subtitle="Delete everything on this device"
            onPress={doWipe}
            destructive
          />
        </Group>

        <SectionLabel label="ABOUT" />
        <Group>
          <Row
            icon="document-text-outline"
            title="Legal disclaimer"
            subtitle="Personal record-keeping — not certified"
            onPress={() =>
              Alert.alert(
                "Disclaimer",
                "T-1 AERO is a personal record-keeping tool. The licence holder is solely responsible for the accuracy and sufficiency of their maintenance experience record under their governing authority. This product is not approved, certified, endorsed, or accepted by any civil aviation authority.",
                [{ text: "OK" }],
              )
            }
            testID="settings-disclaimer"
          />
          <Row
            icon="lock-closed-outline"
            title="Your data, your device"
            subtitle="Local-first. Nothing leaves the device."
          />
          <Row
            icon="mail-outline"
            title="Feedback"
            subtitle="feedback@alhadaf.tech"
            onPress={() => Linking.openURL("mailto:feedback@alhadaf.tech")}
            testID="settings-feedback"
          />
        </Group>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>T-1 AERO · Tech Log</Text>
          <Text style={styles.footerVer}>Version 1.0 · Phase 1</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.sm }}>
      <Text style={typography.label}>{label}</Text>
    </View>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

function Row({
  icon,
  title,
  subtitle,
  onPress,
  right,
  destructive,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
  testID?: string;
}) {
  const isPressable = !!onPress;
  const Component = isPressable ? Pressable : View;
  return (
    <Component
      testID={testID}
      onPress={onPress}
      style={
        isPressable
          ? ({ pressed }: { pressed: boolean }) => [
              styles.rowInner,
              pressed ? { backgroundColor: colors.card } : null,
            ]
          : styles.rowInner
      }
    >
      <View style={[styles.rowIcon, destructive ? { backgroundColor: "rgba(239,68,68,0.14)" } : null]}>
        <Ionicons name={icon} size={18} color={destructive ? colors.danger : colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, destructive ? { color: colors.danger } : null]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {right ? right : onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textDim} /> : null}
    </Component>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  profileCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: { color: colors.text, fontSize: 16, fontWeight: "800" },
  profileSub: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  group: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  rowSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  rightHint: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  footer: { alignItems: "center", marginTop: spacing.xxl, paddingHorizontal: spacing.lg },
  footerBrand: { color: colors.text, fontSize: 13, fontWeight: "800", letterSpacing: 2 },
  footerVer: { color: colors.textDim, fontSize: 11, marginTop: 4 },
});
