import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getEntries } from "@/src/store/db";
import { LogEntry } from "@/src/store/types";
import { colors, radius, spacing, typography } from "@/src/theme";
import { capacityColor, capacityLabel, formatDate, hoursDecimal } from "@/src/utils/format";

type Filter = "all" | "performed" | "supervised" | "certified" | "observed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "performed", label: "Performed" },
  { key: "certified", label: "Certified" },
  { key: "supervised", label: "Supervised" },
  { key: "observed", label: "Observed" },
];

export default function EntriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useFocusEffect(
    useCallback(() => {
      getEntries().then(setEntries);
    }, []),
  );

  const filtered = useMemo(() => {
    let list = entries;
    if (filter !== "all") list = list.filter((e) => e.capacity === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.registration.toLowerCase().includes(q) ||
          (e.typeCode || "").toLowerCase().includes(q) ||
          (e.typeName || "").toLowerCase().includes(q) ||
          (e.description || "").toLowerCase().includes(q) ||
          (e.category || "").toLowerCase().includes(q) ||
          String(e.ataChapter || "").includes(q),
      );
    }
    return list.sort((a, b) => (b.entryDate > a.entryDate ? 1 : -1));
  }, [entries, query, filter]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, LogEntry[]>();
    for (const e of filtered) {
      if (!map.has(e.entryDate)) map.set(e.entryDate, []);
      map.get(e.entryDate)!.push(e);
    }
    return Array.from(map.entries()).map(([date, items]) => ({
      date,
      items,
      total: items.reduce((s, i) => s + i.durationMinutes, 0),
    }));
  }, [filtered]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="entries-screen">
      {/* Sticky header */}
      <View style={[styles.head, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headRow}>
          <Text style={typography.h1}>Entries</Text>
          <Pressable
            testID="entries-add"
            onPress={() => router.push("/entry/new")}
            style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            testID="entries-search"
            value={query}
            onChangeText={setQuery}
            placeholder="Search reg, type, ATA, description…"
            placeholderTextColor={colors.textDim}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable testID="entries-search-clear" onPress={() => setQuery("")} hitSlop={10}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.lg }}
          style={styles.chipRow}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              testID={`entries-filter-${f.key}`}
              onPress={() => setFilter(f.key)}
              style={({ pressed }) => [
                styles.chip,
                filter === f.key ? styles.chipActive : null,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={{ color: filter === f.key ? colors.primary : colors.textMuted, fontWeight: "700", fontSize: 13 }}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={grouped}
        keyExtractor={(g) => g.date}
        renderItem={({ item }) => (
          <View style={{ marginBottom: spacing.lg }}>
            <View style={styles.dayHead}>
              <Text style={styles.dayHeadDate}>{formatDate(item.date)}</Text>
              <Text style={styles.dayHeadTotal}>{hoursDecimal(item.total)}h · {item.items.length} {item.items.length === 1 ? "entry" : "entries"}</Text>
            </View>
            <View style={{ gap: 8, paddingHorizontal: spacing.lg }}>
              {item.items.map((e) => (
                <EntryRow key={e.id} e={e} onPress={() => router.push({ pathname: "/entry/[id]", params: { id: e.id } })} />
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="clipboard-outline" size={26} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {query || filter !== "all" ? "No matching entries" : "No entries yet"}
            </Text>
            <Text style={styles.emptySub}>
              {query || filter !== "all"
                ? "Try clearing filters or search."
                : "Tap the + button to log your first task."}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function EntryRow({ e, onPress }: { e: LogEntry; onPress: () => void }) {
  const c = capacityColor(e.capacity);
  return (
    <Pressable
      testID={`entry-row-${e.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.entryCard, { borderLeftColor: c, opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.entryTop}>
          <Text style={styles.reg}>{e.registration}</Text>
          <Text style={styles.type}>{e.typeCode || e.typeName || "—"}</Text>
          {e.ataChapter != null && (
            <View style={styles.ataPill}>
              <Text style={styles.ataPillText}>ATA {e.ataChapter}</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <Text style={styles.hrs}>{hoursDecimal(e.durationMinutes)}h</Text>
        </View>
        <Text style={styles.desc} numberOfLines={2}>{e.description || "(no description)"}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.capBadge, { backgroundColor: c + "22", borderColor: c }]}>
            <Text style={{ color: c, fontSize: 10, fontWeight: "800", letterSpacing: 0.4 }}>
              {capacityLabel(e.capacity).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.metaText} numberOfLines={1}>{e.category}</Text>
          {e.supervisor ? (
            <>
              <View style={styles.metaDot} />
              <Text style={styles.metaText} numberOfLines={1}>Sup: {e.supervisor}</Text>
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: {
    backgroundColor: colors.bg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    marginHorizontal: spacing.lg,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  chipRow: { marginTop: spacing.md, maxHeight: 44, flexGrow: 0 },
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
  dayHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  dayHeadDate: { color: colors.text, fontSize: 13, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  dayHeadTotal: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  entryCard: {
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
  },
  entryTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  reg: { color: colors.text, fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
  type: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  ataPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.primaryDim,
  },
  ataPillText: { color: colors.primary, fontSize: 10, fontWeight: "800" },
  hrs: { color: colors.text, fontSize: 14, fontWeight: "800", fontVariant: ["tabular-nums"] },
  desc: { color: colors.textMuted, fontSize: 13, marginTop: 4, lineHeight: 18 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  capBadge: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  metaText: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  metaDot: { width: 3, height: 3, borderRadius: 999, backgroundColor: colors.textDim },
  empty: {
    margin: spacing.lg,
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
});
