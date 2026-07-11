import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getCredentials, getEntries } from "@/src/store/db";
import { Credential, LogEntry } from "@/src/store/types";
import { colors, radius, spacing, typography } from "@/src/theme";
import { capacityColor, capacityLabel, daysUntil, hoursDecimal, shortDate } from "@/src/utils/format";

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [e, c] = await Promise.all([getEntries(), getCredentials()]);
    setEntries(e);
    setCredentials(c);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const totalMinutes = entries.reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const now = new Date();
  const start30 = new Date(now);
  start30.setDate(start30.getDate() - 30);
  const last30 = entries.filter((e) => new Date(e.entryDate) >= start30);
  const last30Minutes = last30.reduce((s, e) => s + e.durationMinutes, 0);

  const types = new Set(entries.map((e) => e.typeCode).filter(Boolean));
  const regs = new Set(entries.map((e) => e.registration).filter(Boolean));

  const expiring = credentials
    .map((c) => ({ c, d: daysUntil(c.expiryDate) }))
    .filter((x) => x.d !== null && x.d! <= 90)
    .sort((a, b) => (a.d! - b.d!))
    .slice(0, 3);

  const lastEntry = entries[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="home-screen">
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={[styles.head, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Ionicons name="airplane" size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.brand}>T-1 AERO</Text>
              <Text style={styles.brandSub}>TECH LOG</Text>
            </View>
          </View>
          <Pressable
            testID="home-header-search"
            onPress={() => router.push("/(tabs)/entries")}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="search" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Hero metric */}
        <View style={styles.hero}>
          <Text style={typography.label}>TOTAL LOGGED HOURS</Text>
          <Text style={styles.heroMetric} testID="home-total-hours">
            {hoursDecimal(totalMinutes)}
          </Text>
          <View style={styles.heroSub}>
            <Text style={styles.heroSubText}>
              <Text style={{ color: colors.primary, fontWeight: "800" }}>
                {hoursDecimal(last30Minutes)}h
              </Text>
              {" · last 30 days"}
            </Text>
            <View style={styles.dot} />
            <Text style={styles.heroSubText}>
              <Text style={{ color: colors.text, fontWeight: "800" }}>{entries.length}</Text> entries
            </Text>
          </View>

          <View style={styles.chipRow}>
            <MiniStat label="TYPES" value={String(types.size)} icon="airplane-outline" />
            <MiniStat label="REGS" value={String(regs.size)} icon="pricetag-outline" />
            <MiniStat
              label="EXPIRING"
              value={String(expiring.length)}
              icon="shield-outline"
              accent={expiring.length > 0 ? colors.warning : undefined}
            />
          </View>
        </View>

        {/* Primary actions */}
        <View style={styles.actionsRow}>
          <ActionCard
            testID="home-new-entry"
            title="New Entry"
            subtitle="Log a task"
            icon="add-circle"
            primary
            onPress={() => router.push("/entry/new")}
          />
          <ActionCard
            testID="home-repeat-last"
            title="Repeat Last"
            subtitle={lastEntry ? `${lastEntry.registration} · ATA ${lastEntry.ataChapter ?? "—"}` : "No entries yet"}
            icon="refresh"
            disabled={!lastEntry}
            onPress={() => {
              if (lastEntry) router.push({ pathname: "/entry/new", params: { from: lastEntry.id } });
            }}
          />
        </View>

        <View style={styles.actionsRow}>
          <SmallAction icon="albums-outline" label="Bulk Entry" testID="home-bulk" onPress={() => router.push("/bulk-entry")} />
          <SmallAction icon="document-text-outline" label="Export" testID="home-export" onPress={() => router.push("/export")} />
          <SmallAction icon="shield-checkmark-outline" label="Add Cred" testID="home-add-cred" onPress={() => router.push("/credential/new")} />
        </View>

        {/* Expiring credentials */}
        {expiring.length > 0 && (
          <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.lg }}>
            <View style={styles.sectionHead}>
              <Text style={typography.label}>UPCOMING EXPIRIES</Text>
              <Pressable onPress={() => router.push("/(tabs)/credentials")} testID="home-see-all-creds">
                <Text style={styles.linkText}>See all</Text>
              </Pressable>
            </View>
            <View style={{ gap: spacing.sm }}>
              {expiring.map(({ c, d }) => (
                <ExpiryRow key={c.id} c={c} days={d!} onPress={() => router.push("/(tabs)/credentials")} />
              ))}
            </View>
          </View>
        )}

        {/* Recent entries */}
        <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.lg }}>
          <View style={styles.sectionHead}>
            <Text style={typography.label}>RECENT ENTRIES</Text>
            {entries.length > 0 && (
              <Pressable onPress={() => router.push("/(tabs)/entries")} testID="home-see-all-entries">
                <Text style={styles.linkText}>See all</Text>
              </Pressable>
            )}
          </View>
          {entries.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="clipboard-outline" size={26} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptySub}>Tap New Entry to log your first task.</Text>
              <Pressable
                testID="empty-new-entry"
                onPress={() => router.push("/entry/new")}
                style={({ pressed }) => [styles.emptyBtn, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 6 }}>New Entry</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {entries.slice(0, 5).map((e) => (
                <EntryCard key={e.id} e={e} onPress={() => router.push({ pathname: "/entry/[id]", params: { id: e.id } })} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function MiniStat({ label, value, icon, accent }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; accent?: string }) {
  return (
    <View style={styles.miniStat}>
      <Ionicons name={icon} size={14} color={accent ?? colors.textMuted} />
      <View style={{ marginLeft: 8 }}>
        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>{label}</Text>
        <Text style={{ color: accent ?? colors.text, fontSize: 15, fontWeight: "800", marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
}

function ActionCard({
  title,
  subtitle,
  icon,
  onPress,
  primary,
  disabled,
  testID,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  primary?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionCard,
        primary ? { backgroundColor: colors.primary, borderColor: colors.primary } : null,
        { opacity: disabled ? 0.5 : pressed ? 0.9 : 1, transform: [{ scale: pressed && !disabled ? 0.98 : 1 }] },
      ]}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color={primary ? "#fff" : colors.primary} />
      </View>
      <Text style={[styles.actionTitle, { color: primary ? "#fff" : colors.text }]}>{title}</Text>
      <Text style={[styles.actionSub, { color: primary ? "rgba(255,255,255,0.85)" : colors.textMuted }]} numberOfLines={1}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

function SmallAction({ icon, label, onPress, testID }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.smallAction, { opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <Ionicons name={icon} size={18} color={colors.text} />
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700", marginLeft: 8 }}>{label}</Text>
    </Pressable>
  );
}

function ExpiryRow({ c, days, onPress }: { c: Credential; days: number; onPress: () => void }) {
  const color = days < 0 ? colors.danger : days <= 7 ? colors.danger : days <= 30 ? colors.warning : colors.info;
  const text = days < 0 ? `EXPIRED ${Math.abs(days)}d ago` : days === 0 ? "EXPIRES TODAY" : `IN ${days}d`;
  return (
    <Pressable
      testID={`home-expiry-${c.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.expiryRow, { opacity: pressed ? 0.75 : 1, borderLeftColor: color }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }} numberOfLines={1}>
          {c.name}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          {c.type}
        </Text>
      </View>
      <View style={[styles.expBadge, { backgroundColor: color + "22", borderColor: color }]}>
        <Text style={{ color, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 }}>{text}</Text>
      </View>
    </Pressable>
  );
}

function EntryCard({ e, onPress }: { e: LogEntry; onPress: () => void }) {
  const capColor = capacityColor(e.capacity);
  return (
    <Pressable
      testID={`home-entry-${e.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.entryCard, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.entryDate}>
        <Text style={styles.entryDay}>{shortDate(e.entryDate).split(" ")[0]}</Text>
        <Text style={styles.entryMonth}>{shortDate(e.entryDate).split(" ")[1]}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.entryReg}>{e.registration}</Text>
          <Text style={styles.entryType}>{e.typeCode || e.typeName || "—"}</Text>
          {e.ataChapter != null && (
            <View style={styles.ataPill}>
              <Text style={styles.ataPillText}>ATA {e.ataChapter}</Text>
            </View>
          )}
        </View>
        <Text style={styles.entryDesc} numberOfLines={2}>
          {e.description || "(no description)"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
          <View style={[styles.capPill, { backgroundColor: capColor + "22", borderColor: capColor }]}>
            <Text style={{ color: capColor, fontSize: 10, fontWeight: "800", letterSpacing: 0.4 }}>
              {capacityLabel(e.capacity).toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            {hoursDecimal(e.durationMinutes)}h
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,90,31,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,90,31,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: colors.text, fontSize: 15, fontWeight: "800", letterSpacing: 2 },
  brandSub: { color: colors.textMuted, fontSize: 9, letterSpacing: 2.5, marginTop: 1 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroMetric: { ...typography.metric, marginTop: spacing.xs },
  heroSub: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 },
  heroSubText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  dot: { width: 3, height: 3, borderRadius: 999, backgroundColor: colors.textDim },
  chipRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  miniStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actionCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 118,
  },
  actionIcon: { marginBottom: spacing.md },
  actionTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  actionSub: { fontSize: 12, marginTop: 2, fontWeight: "500" },
  smallAction: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingHorizontal: 2,
  },
  linkText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  entryDate: {
    width: 46,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryDay: { color: colors.text, fontSize: 18, fontWeight: "800" },
  entryMonth: { color: colors.textMuted, fontSize: 9, letterSpacing: 1, marginTop: 1, textTransform: "uppercase" },
  entryReg: { color: colors.text, fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
  entryType: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  ataPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.primaryDim,
  },
  ataPillText: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },
  entryDesc: { color: colors.textMuted, fontSize: 13, marginTop: 3, lineHeight: 18 },
  capPill: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  expBadge: {
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
  emptySub: { color: colors.textMuted, fontSize: 13, marginTop: 4, textAlign: "center" },
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
});
