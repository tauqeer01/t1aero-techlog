import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/src/components/UI";
import { loadSampleData } from "@/src/store/seed";
import { patchSettings } from "@/src/store/db";
import { colors, radius, spacing, typography } from "@/src/theme";

const BG =
  "https://images.pexels.com/photos/36095631/pexels-photo-36095631.jpeg";

export default function Onboarding() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const finish = async (withSample: boolean) => {
    setBusy(true);
    if (withSample) await loadSampleData();
    await patchSettings({ onboarded: true });
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.root} testID="onboarding-screen">
      <Image source={{ uri: BG }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      <LinearGradient
        colors={[
          "rgba(10,14,23,0.55)",
          "rgba(10,14,23,0.85)",
          "rgba(10,14,23,1)",
        ]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, justifyContent: "space-between" }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: spacing.xxl }}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Ionicons name="airplane" size={22} color={colors.primary} />
              </View>
              <Text style={styles.brand}>T-1 AERO</Text>
            </View>
            <Text style={styles.tagline}>Tech Log</Text>
          </View>

          <View style={{ gap: spacing.md }}>
            <Text style={styles.headline}>
              Your maintenance{"\n"}experience,{" "}
              <Text style={{ color: colors.primary }}>owned by you.</Text>
            </Text>
            <Text style={styles.sub}>
              A personal, career-long logbook for licensed AMEs and technicians. Offline first. No account required. Your data, your export, forever.
            </Text>

            <View style={styles.pointRow}>
              <Feature icon="flash" text="≤10 seconds per repeat entry" />
              <Feature icon="cloud-offline" text="Works fully offline" />
              <Feature icon="download" text="Unlimited PDF & CSV export" />
            </View>

            <View style={styles.disclaimer}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
              <Text style={styles.disclaimerText}>
                Personal record-keeping tool. The licence holder is responsible for the accuracy and sufficiency of records under their governing authority. Not certified or approved by any regulator.
              </Text>
            </View>
          </View>

          <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
            <Button
              label={busy ? "Setting up…" : "Accept & Get Started"}
              onPress={() => finish(false)}
              testID="onboarding-accept"
              disabled={busy}
            />
            <Pressable
              onPress={() => finish(true)}
              disabled={busy}
              testID="onboarding-sample"
              style={({ pressed }) => ({ alignSelf: "center", padding: spacing.md, opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: "600" }}>
                Load sample data to explore →
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Feature({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.feat}>
      <View style={styles.featIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600", flex: 1 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,90,31,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,90,31,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 3,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 4,
    marginTop: 4,
    marginLeft: 46,
    textTransform: "uppercase",
  },
  headline: {
    ...typography.display,
    fontSize: 40,
    lineHeight: 46,
  },
  sub: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  pointRow: { gap: spacing.sm, marginTop: spacing.md },
  feat: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,90,31,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerText: { color: colors.textMuted, fontSize: 12, lineHeight: 17, flex: 1 },
});
