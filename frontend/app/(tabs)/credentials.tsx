import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { deleteCredential, getCredentials } from "@/src/store/db";
import { Credential } from "@/src/store/types";
import { colors, radius, spacing, typography } from "@/src/theme";
import { daysUntil, formatDate } from "@/src/utils/format";

export default function CredentialsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [creds, setCreds] = useState<Credential[]>([]);

  useFocusEffect(
    useCallback(() => {
      getCredentials().then(setCreds);
    }, []),
  );

  const sorted = [...creds].sort((a, b) => {
    const da = daysUntil(a.expiryDate);
    const db = daysUntil(b.expiryDate);
    if (da === null && db === null) return a.name.localeCompare(b.name);
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  });

  const remove = (c: Credential) => {
    Alert.alert("Delete credential?", `${c.name} will be removed. This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const next = await deleteCredential(c.id);
          setCreds(next);
        },
      },
    ]);
  };

  const expiredCount = sorted.filter((c) => {
    const d = daysUntil(c.expiryDate);
    return d !== null && d < 0;
  }).length;

  const soonCount = sorted.filter((c) => {
    const d = daysUntil(c.expiryDate);
    return d !== null && d >= 0 && d <= 90;
  }).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="credentials-screen">
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.head, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.headRow}>
            <View style={{ flex: 1 }}>
              <Text style={typography.h1}>Credentials</Text>
              <Text style={[typography.bodyMuted, { marginTop: 4 }]}>Licences, ratings & authorisations</Text>
            </View>
            <Pressable
              testID="creds-add"
              onPress={() => router.push("/credential/new")}
              style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>

        {sorted.length > 0 && (
          <View style={styles.summaryRow}>
            <SummaryTile label="EXPIRED" value={String(expiredCount)} color={colors.danger} icon="alert-circle" />
            <SummaryTile label="EXPIRING ≤90d" value={String(soonCount)} color={colors.warning} icon="time" />
            <SummaryTile label="TOTAL" value={String(sorted.length)} color={colors.info} icon="shield-checkmark" />
          </View>
        )}

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.sm }}>
          {sorted.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="shield-checkmark-outline" size={26} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Track your credentials</Text>
              <Text style={styles.emptySub}>
                Add your licence, type ratings, HF, EWIS, NDT and company authorisations. Get reminders 90/30/7 days before expiry.
              </Text>
              <Pressable
                testID="creds-empty-add"
                onPress={() => router.push("/credential/new")}
                style={({ pressed }) => [styles.emptyBtn, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "800", marginLeft: 6 }}>Add credential</Text>
              </Pressable>
            </View>
          ) : (
            sorted.map((c) => <CredCard key={c.id} c={c} onDelete={() => remove(c)} />)
          )}
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textDim} />
          <Text style={styles.disclaimerText}>
            Reminders are informational. You remain responsible for keeping your credentials current under your governing authority.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryTile({ label, value, color, icon }: { label: string; value: string; color: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={[styles.summaryTile, { borderLeftColor: color }]}>
      <View style={styles.tileHeader}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={[styles.tileLabel, { color }]}>{label}</Text>
      </View>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

function CredCard({ c, onDelete }: { c: Credential; onDelete: () => void }) {
  const d = daysUntil(c.expiryDate);
  let color = colors.info;
  let statusText = "No expiry set";
  if (d !== null) {
    if (d < 0) {
      color = colors.danger;
      statusText = `Expired ${Math.abs(d)} days ago`;
    } else if (d === 0) {
      color = colors.danger;
      statusText = "Expires today";
    } else if (d <= 7) {
      color = colors.danger;
      statusText = `Expires in ${d} days`;
    } else if (d <= 30) {
      color = colors.warning;
      statusText = `Expires in ${d} days`;
    } else if (d <= 90) {
      color = colors.warning;
      statusText = `Expires in ${d} days`;
    } else {
      color = colors.success;
      statusText = `Expires in ${d} days`;
    }
  }

  return (
    <View style={[styles.credCard, { borderLeftColor: color }]} testID={`cred-card-${c.id}`}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View style={[styles.credIcon, { backgroundColor: color + "22", borderColor: color }]}>
          <Ionicons name="ribbon" size={18} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.credName} numberOfLines={2}>{c.name}</Text>
          <Text style={styles.credType}>{c.type}</Text>
          {c.authority ? <Text style={styles.credMeta}>{c.authority}{c.reference ? ` · ${c.reference}` : ""}</Text> : null}
        </View>
        <Pressable
          testID={`cred-delete-${c.id}`}
          hitSlop={8}
          onPress={onDelete}
          style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.credFooter}>
        <View style={[styles.statusPill, { backgroundColor: color + "22", borderColor: color }]}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text style={{ color, fontSize: 12, fontWeight: "800" }}>{statusText}</Text>
        </View>
        {c.expiryDate ? (
          <Text style={styles.credExp}>{formatDate(c.expiryDate)}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  headRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  summaryTile: {
    flex: 1,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
  },
  tileHeader: { flexDirection: "row", alignItems: "center", gap: 4 },
  tileLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  tileValue: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 4 },
  credCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  credIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  credName: { color: colors.text, fontSize: 15, fontWeight: "800", lineHeight: 20 },
  credType: { color: colors.textMuted, fontSize: 12, fontWeight: "600", marginTop: 2 },
  credMeta: { color: colors.textDim, fontSize: 11, marginTop: 3 },
  credFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 999 },
  credExp: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  empty: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  emptySub: { color: colors.textMuted, fontSize: 13, marginTop: 6, textAlign: "center", lineHeight: 19 },
  emptyBtn: {
    marginTop: spacing.lg,
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerText: { color: colors.textDim, fontSize: 11, lineHeight: 16, flex: 1 },
});
