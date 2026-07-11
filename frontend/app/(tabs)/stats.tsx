import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getEntries } from "@/src/store/db";
import { LogEntry } from "@/src/store/types";
import { colors, radius, spacing, typography } from "@/src/theme";
import { capacityColor, capacityLabel, hoursDecimal } from "@/src/utils/format";

type Dim = "type" | "ata" | "capacity";
type Window = "30" | "90" | "365" | "all";

const DIMS: { key: Dim; label: string }[] = [
  { key: "type", label: "By Type" },
  { key: "ata", label: "By ATA" },
  { key: "capacity", label: "By Capacity" },
];

const WINDOWS: { key: Window; label: string }[] = [
  { key: "30", label: "30d" },
  { key: "90", label: "90d" },
  { key: "365", label: "12mo" },
  { key: "all", label: "All time" },
];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [dim, setDim] = useState<Dim>("type");
  const [window, setWindow] = useState<Window>("365");

  useFocusEffect(
    useCallback(() => {
      getEntries().then(setEntries);
    }, []),
  );

  const filtered = useMemo(() => {
    if (window === "all") return entries;
    const days = parseInt(window, 10);
    const start = new Date();
    start.setDate(start.getDate() - days);
    return entries.filter((e) => new Date(e.entryDate) >= start);
  }, [entries, window]);

  const totalMin = filtered.reduce((s, e) => s + e.durationMinutes, 0);
  const uniqueTypes = new Set(filtered.map((e) => e.typeCode).filter(Boolean));
  const uniqueRegs = new Set(filtered.map((e) => e.registration).filter(Boolean));

  const groups = useMemo(() => {
    const bucket = new Map<string, { label: string; minutes: number; count: number; sub?: string }>();
    for (const e of filtered) {
      let key = "";
      let label = "";
      let sub: string | undefined;
      if (dim === "type") {
        key = e.typeCode || e.typeName || "UNK";
        label = e.typeCode || "—";
        sub = e.typeName;
      } else if (dim === "ata") {
        key = String(e.ataChapter ?? "—");
        label = e.ataChapter != null ? `ATA ${e.ataChapter}` : "Unclassified";
      } else {
        key = e.capacity;
        label = capacityLabel(e.capacity);
      }
      const cur = bucket.get(key) || { label, minutes: 0, count: 0, sub };
      cur.minutes += e.durationMinutes;
      cur.count += 1;
      cur.sub = cur.sub || sub;
      bucket.set(key, cur);
    }
    return Array.from(bucket.entries())
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [filtered, dim]);

  const maxMin = groups[0]?.minutes || 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="stats-screen">
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.head, { paddingTop: insets.top + spacing.md }]}>
          <Text style={typography.h1}>Stats</Text>
          <Text style={[typography.bodyMuted, { marginTop: 4 }]}>Roll-ups by type, ATA and capacity</Text>
        </View>

        {/* Window selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.lg }}
          style={{ maxHeight: 44, flexGrow: 0, marginTop: spacing.md }}
        >
          {WINDOWS.map((w) => (
            <Pressable
              key={w.key}
              testID={`stats-window-${w.key}`}
              onPress={() => setWindow(w.key)}
              style={({ pressed }) => [
                styles.chip,
                window === w.key ? styles.chipActive : null,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={{ color: window === w.key ? colors.primary : colors.textMuted, fontWeight: "700", fontSize: 13 }}>{w.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* KPI cards */}
        <View style={styles.kpiRow}>
          <Kpi label="TOTAL HRS" value={hoursDecimal(totalMin)} big />
          <Kpi label="ENTRIES" value={String(filtered.length)} />
        </View>
        <View style={[styles.kpiRow, { marginTop: 0 }]}>
          <Kpi label="TYPES" value={String(uniqueTypes.size)} />
          <Kpi label="AIRCRAFT" value={String(uniqueRegs.size)} />
        </View>

        {/* Dimension tabs */}
        <View style={styles.dimTabs}>
          {DIMS.map((d) => (
            <Pressable
              key={d.key}
              testID={`stats-dim-${d.key}`}
              onPress={() => setDim(d.key)}
              style={({ pressed }) => [
                styles.dimTab,
                dim === d.key ? styles.dimTabActive : null,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={{ color: dim === d.key ? colors.text : colors.textMuted, fontWeight: "700", fontSize: 13 }}>
                {d.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Bars */}
        <View style={styles.barsCard}>
          {groups.length === 0 ? (
            <View style={{ padding: spacing.xl, alignItems: "center" }}>
              <Ionicons name="stats-chart-outline" size={32} color={colors.textDim} />
              <Text style={[typography.body, { marginTop: spacing.md }]}>No data in this window.</Text>
              <Text style={[typography.bodyMuted, { marginTop: 4 }]}>Log entries or widen the range.</Text>
            </View>
          ) : (
            groups.map((g) => {
              const pct = Math.max(0.03, g.minutes / maxMin);
              const color = dim === "capacity" ? capacityColor(g.key) : colors.primary;
              return (
                <View key={g.key} style={styles.barRow} testID={`stats-bar-${g.key}`}>
                  <View style={styles.barLabel}>
                    <Text style={styles.barLabelTitle} numberOfLines={1}>{g.label}</Text>
                    {g.sub ? <Text style={styles.barLabelSub} numberOfLines={1}>{g.sub}</Text> : null}
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
                  </View>
                  <View style={styles.barValue}>
                    <Text style={styles.barValueText}>{hoursDecimal(g.minutes)}h</Text>
                    <Text style={styles.barValueSub}>{g.count} entries</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textDim} />
          <Text style={styles.footerText}>
            Personal record only. Not a certification of experience under any authority.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Kpi({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={[styles.kpi, big ? { flex: 1.4 } : null]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, big ? { fontSize: 32 } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chipActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  kpiRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  kpi: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  kpiValue: { color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 4, letterSpacing: -0.5 },
  dimTabs: {
    flexDirection: "row",
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dimTab: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  dimTabActive: { backgroundColor: colors.card },
  barsCard: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  barRow: { flexDirection: "row", alignItems: "center" },
  barLabel: { width: 96 },
  barLabelTitle: { color: colors.text, fontSize: 13, fontWeight: "800" },
  barLabelSub: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.card,
    overflow: "hidden",
    marginHorizontal: 10,
  },
  barFill: { height: "100%", borderRadius: 5 },
  barValue: { width: 68, alignItems: "flex-end" },
  barValueText: { color: colors.text, fontSize: 14, fontWeight: "800", fontVariant: ["tabular-nums"] },
  barValueSub: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerText: { color: colors.textDim, fontSize: 11, lineHeight: 16, flex: 1 },
});
