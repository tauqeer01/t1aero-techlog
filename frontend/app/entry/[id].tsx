import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ATA_CHAPTERS } from "@/src/data/ata";
import { deleteEntry, getEntries } from "@/src/store/db";
import { LogEntry } from "@/src/store/types";
import { colors, radius, spacing, typography } from "@/src/theme";
import { capacityColor, capacityLabel, formatDate, hoursDecimal } from "@/src/utils/format";

export default function EntryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [entry, setEntry] = useState<LogEntry | null>(null);

  useEffect(() => {
    (async () => {
      const all = await getEntries();
      setEntry(all.find((e) => e.id === id) || null);
    })();
  }, [id]);

  const remove = () => {
    if (!entry) return;
    Alert.alert("Delete entry?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteEntry(entry.id);
          router.back();
        },
      },
    ]);
  };

  if (!entry) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={typography.bodyMuted}>Entry not found</Text>
      </View>
    );
  }

  const capC = capacityColor(entry.capacity);
  const ata = ATA_CHAPTERS.find((c) => c.code === entry.ataChapter);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="entry-detail-screen">
      <View style={[styles.head, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          testID="entry-back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={typography.h3}>Entry</Text>
        <Pressable
          testID="entry-delete"
          onPress={remove}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: insets.bottom + 80 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={styles.reg}>{entry.registration}</Text>
            <View style={styles.ataPill}>
              <Text style={styles.ataPillText}>ATA {entry.ataChapter ?? "—"}</Text>
            </View>
          </View>
          <Text style={styles.typeName}>
            {entry.typeCode}
            {entry.typeName ? ` · ${entry.typeName}` : ""}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: spacing.lg }}>
            <Text style={styles.hours}>{hoursDecimal(entry.durationMinutes)}</Text>
            <Text style={styles.hoursUnit}>hours</Text>
          </View>
          <View style={[styles.capBadge, { backgroundColor: capC + "22", borderColor: capC, marginTop: spacing.md }]}>
            <View style={[styles.capDot, { backgroundColor: capC }]} />
            <Text style={{ color: capC, fontSize: 12, fontWeight: "800", letterSpacing: 0.4 }}>
              {capacityLabel(entry.capacity).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={typography.label}>TASK</Text>
          <Text style={styles.desc}>{entry.description}</Text>
        </View>

        {/* Meta */}
        <View style={styles.card}>
          <MetaRow label="Date" value={formatDate(entry.entryDate)} icon="calendar-outline" />
          <MetaRow label="Category" value={entry.category} icon="build-outline" />
          {ata && <MetaRow label="ATA" value={`${ata.code} · ${ata.title}`} icon="apps-outline" />}
          {entry.supervisor && <MetaRow label="Supervisor" value={entry.supervisor} icon="person-outline" />}
          {entry.location && <MetaRow label="Location" value={entry.location} icon="location-outline" last />}
        </View>

        {/* Photos */}
        {entry.photos.length > 0 && (
          <View style={styles.card}>
            <Text style={typography.label}>EVIDENCE · {entry.photos.length}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 10 }}>
              {entry.photos.map((p, i) => (
                <Image key={i} source={{ uri: p }} style={styles.photo} />
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.footNote}>
          Logged {formatDate(entry.createdAt)} · id {entry.id.slice(0, 8)}…
        </Text>
      </ScrollView>
    </View>
  );
}

function MetaRow({ label, value, icon, last }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; last?: boolean }) {
  return (
    <View style={[styles.metaRow, last ? { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 } : null]}>
      <View style={styles.metaIcon}>
        <Ionicons name={icon} size={16} color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaVal}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reg: { color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: 1 },
  ataPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: colors.primaryDim,
  },
  ataPillText: { color: colors.primary, fontSize: 11, fontWeight: "800" },
  typeName: { color: colors.textMuted, fontSize: 13, marginTop: 4, fontWeight: "600" },
  hours: { color: colors.text, fontSize: 46, fontWeight: "800", letterSpacing: -1.5 },
  hoursUnit: { color: colors.textMuted, fontSize: 15, fontWeight: "700", paddingBottom: 8 },
  capBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
  },
  capDot: { width: 6, height: 6, borderRadius: 999 },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  desc: { color: colors.text, fontSize: 16, lineHeight: 24, marginTop: 8 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  metaIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  metaLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
  metaVal: { color: colors.text, fontSize: 14, fontWeight: "600", marginTop: 2 },
  photo: { width: 140, height: 140, borderRadius: radius.md, backgroundColor: colors.card },
  footNote: { color: colors.textDim, fontSize: 11, textAlign: "center" },
});
