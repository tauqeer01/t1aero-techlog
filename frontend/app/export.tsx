import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ATA_CHAPTERS } from "@/src/data/ata";
import { getEntries } from "@/src/store/db";
import { LogEntry } from "@/src/store/types";
import { colors, radius, spacing, typography } from "@/src/theme";
import { capacityLabel, formatDate, hoursDecimal } from "@/src/utils/format";

export default function ExportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState<"pdf" | "csv" | null>(null);

  useEffect(() => {
    getEntries().then(setEntries);
  }, []);

  const totalMin = entries.reduce((s, e) => s + e.durationMinutes, 0);
  const types = new Set(entries.map((e) => e.typeCode).filter(Boolean));
  const regs = new Set(entries.map((e) => e.registration).filter(Boolean));

  const exportPdf = async () => {
    if (entries.length === 0) {
      Alert.alert("Nothing to export", "Log an entry first.");
      return;
    }
    setBusy("pdf");
    try {
      const html = buildHTML(entries);
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === "web") {
        setBusy(null);
        Alert.alert("PDF ready", "PDF export in the web preview isn't shareable. Open the app on a device to share the PDF.");
        return;
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "T-1 AERO Logbook" });
      } else {
        Alert.alert("PDF saved", `Saved to ${uri}`);
      }
    } catch (e) {
      Alert.alert("Export failed", String((e as Error).message || e));
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = async () => {
    if (entries.length === 0) {
      Alert.alert("Nothing to export", "Log an entry first.");
      return;
    }
    setBusy("csv");
    try {
      const csv = buildCSV(entries);
      if (Platform.OS === "web") {
        setBusy(null);
        Alert.alert("CSV ready", "CSV download in the web preview isn't supported. Open the app on a device to share the CSV.");
        return;
      }
      const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      const path = `${dir}t1aero-logbook-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, { mimeType: "text/csv", dialogTitle: "T-1 AERO Logbook (CSV)" });
      } else {
        Alert.alert("CSV saved", `Saved to ${path}`);
      }
    } catch (e) {
      Alert.alert("Export failed", String((e as Error).message || e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="export-screen">
      <View style={[styles.head, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          testID="export-back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={typography.h3}>Export</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: insets.bottom + 40 }}>
        <View style={styles.hero}>
          <Text style={typography.label}>YOUR LOGBOOK</Text>
          <Text style={styles.heroMetric}>{hoursDecimal(totalMin)}h</Text>
          <Text style={styles.heroSub}>
            {entries.length} entries · {regs.size} aircraft · {types.size} types
          </Text>
        </View>

        <View style={styles.trustCard}>
          <Ionicons name="lock-closed" size={16} color={colors.success} />
          <Text style={styles.trustText}>
            <Text style={{ color: colors.text, fontWeight: "800" }}>Unlimited export. Free forever.</Text>{"\n"}
            No account required. Data leaves your device only when you tap Share.
          </Text>
        </View>

        <ExportCard
          testID="export-pdf"
          icon="document-text"
          title="PDF logbook"
          subtitle="Chronological, printable, with per-type summary."
          badge="RECOMMENDED"
          onPress={exportPdf}
          loading={busy === "pdf"}
          disabled={!!busy}
        />

        <ExportCard
          testID="export-csv"
          icon="grid"
          title="CSV file"
          subtitle="Complete data — every field, no truncation."
          onPress={exportCsv}
          loading={busy === "csv"}
          disabled={!!busy}
        />

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textDim} />
          <Text style={styles.disclaimerText}>
            Export layouts are personal record summaries — not regulator-approved forms. The licence holder is responsible for the accuracy and sufficiency of any submitted record.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function ExportCard({
  title,
  subtitle,
  icon,
  onPress,
  loading,
  disabled,
  badge,
  testID,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  badge?: string;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        { opacity: disabled ? 0.6 : pressed ? 0.9 : 1, transform: [{ scale: pressed && !disabled ? 0.99 : 1 }] },
      ]}
    >
      <View style={styles.cardIcon}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          {badge && (
            <View style={styles.badge}>
              <Text style={{ color: colors.primary, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardSub}>{subtitle}</Text>
      </View>
      {loading ? (
        <Ionicons name="hourglass" size={20} color={colors.primary} />
      ) : (
        <Ionicons name="share-outline" size={20} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

// ---------------- CSV ----------------
function csvEscape(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildCSV(entries: LogEntry[]): string {
  const header = [
    "Date",
    "Registration",
    "Type Code",
    "Type Name",
    "ATA Chapter",
    "Category",
    "Description",
    "Duration (minutes)",
    "Duration (hours)",
    "Capacity",
    "Supervisor",
  ];
  const rows = entries.map((e) => [
    e.entryDate,
    e.registration,
    e.typeCode || "",
    e.typeName || "",
    e.ataChapter != null ? String(e.ataChapter) : "",
    e.category,
    e.description,
    String(e.durationMinutes),
    hoursDecimal(e.durationMinutes),
    e.capacity,
    e.supervisor || "",
  ]);
  return [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
}

// ---------------- PDF (HTML) ----------------
function buildHTML(entries: LogEntry[]): string {
  const sorted = [...entries].sort((a, b) => (b.entryDate > a.entryDate ? 1 : -1));
  const totalMin = sorted.reduce((s, e) => s + e.durationMinutes, 0);

  const byType = new Map<string, number>();
  const byCap = new Map<string, number>();
  const byAta = new Map<string, number>();
  for (const e of sorted) {
    const t = e.typeCode || "—";
    byType.set(t, (byType.get(t) || 0) + e.durationMinutes);
    byCap.set(e.capacity, (byCap.get(e.capacity) || 0) + e.durationMinutes);
    const ata = e.ataChapter != null ? `ATA ${e.ataChapter}` : "Unclassified";
    byAta.set(ata, (byAta.get(ata) || 0) + e.durationMinutes);
  }

  const typeRows = [...byType.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td class="num">${hoursDecimal(v)}h</td></tr>`)
    .join("");

  const capRows = [...byCap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<tr><td>${escapeHtml(capacityLabel(k))}</td><td class="num">${hoursDecimal(v)}h</td></tr>`)
    .join("");

  const ataRows = [...byAta.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([k, v]) => {
      const num = parseInt(k.replace("ATA ", ""), 10);
      const chap = ATA_CHAPTERS.find((c) => c.code === num);
      return `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(chap?.title || "")}</td><td class="num">${hoursDecimal(v)}h</td></tr>`;
    })
    .join("");

  const entryRows = sorted
    .map(
      (e) => `<tr>
        <td>${escapeHtml(formatDate(e.entryDate))}</td>
        <td><b>${escapeHtml(e.registration)}</b></td>
        <td>${escapeHtml(e.typeCode || "")}${e.typeName ? ` <span class="muted">${escapeHtml(e.typeName)}</span>` : ""}</td>
        <td>${e.ataChapter ?? ""}</td>
        <td>${escapeHtml(e.description)}${e.supervisor ? `<div class="muted small">Sup: ${escapeHtml(e.supervisor)}</div>` : ""}</td>
        <td>${escapeHtml(capacityLabel(e.capacity))}</td>
        <td class="num">${hoursDecimal(e.durationMinutes)}h</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 32px; }
  .hero { border-bottom: 3px solid #FF5A1F; padding-bottom: 20px; margin-bottom: 24px; }
  .brand { font-size: 12px; letter-spacing: 4px; font-weight: 800; color: #FF5A1F; text-transform: uppercase; }
  .title { font-size: 30px; font-weight: 800; margin: 6px 0 2px; }
  .sub { font-size: 12px; color: #6B7280; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0 24px; }
  .kpi { border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; }
  .kpi .l { font-size: 10px; letter-spacing: 1px; color: #6B7280; font-weight: 800; }
  .kpi .v { font-size: 22px; font-weight: 800; margin-top: 4px; letter-spacing: -0.5px; }
  h2 { font-size: 13px; letter-spacing: 1.5px; color: #6B7280; text-transform: uppercase; margin: 24px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #E5E7EB; vertical-align: top; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B7280; background: #F9FAFB; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .muted { color: #6B7280; }
  .small { font-size: 10px; }
  .disclaimer { margin-top: 24px; padding: 12px; background: #F9FAFB; border-radius: 8px; font-size: 10px; color: #6B7280; line-height: 1.5; }
  .foot { margin-top: 16px; text-align: center; font-size: 10px; color: #9CA3AF; }
</style></head><body>
  <div class="hero">
    <div class="brand">T-1 AERO · Tech Log</div>
    <div class="title">Maintenance Experience Record</div>
    <div class="sub">Personal record · Generated ${escapeHtml(formatDate(new Date().toISOString()))}</div>
  </div>

  <div class="grid">
    <div class="kpi"><div class="l">TOTAL HOURS</div><div class="v">${hoursDecimal(totalMin)}</div></div>
    <div class="kpi"><div class="l">ENTRIES</div><div class="v">${sorted.length}</div></div>
    <div class="kpi"><div class="l">AIRCRAFT</div><div class="v">${new Set(sorted.map((e) => e.registration)).size}</div></div>
    <div class="kpi"><div class="l">TYPES</div><div class="v">${new Set(sorted.map((e) => e.typeCode)).size}</div></div>
  </div>

  <h2>Summary by Type</h2>
  <table><thead><tr><th>Type</th><th class="num">Hours</th></tr></thead><tbody>${typeRows}</tbody></table>

  <h2>Summary by Capacity</h2>
  <table><thead><tr><th>Capacity</th><th class="num">Hours</th></tr></thead><tbody>${capRows}</tbody></table>

  <h2>Top ATA Chapters</h2>
  <table><thead><tr><th>Chapter</th><th>Title</th><th class="num">Hours</th></tr></thead><tbody>${ataRows}</tbody></table>

  <h2>All Entries (chronological, newest first)</h2>
  <table><thead><tr>
    <th>Date</th><th>Reg</th><th>Type</th><th>ATA</th><th>Task</th><th>Capacity</th><th class="num">Hours</th>
  </tr></thead><tbody>${entryRows}</tbody></table>

  <div class="disclaimer">
    This document is a personal record summary generated by T-1 AERO. It is not a regulator-approved form.
    The licence holder is solely responsible for the accuracy and sufficiency of their maintenance experience
    record under their governing civil aviation authority.
  </div>
  <div class="foot">T-1 AERO · Tech Log · v1.0</div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  heroMetric: { color: colors.text, fontSize: 44, fontWeight: "800", letterSpacing: -1.5, marginTop: 4 },
  heroSub: { color: colors.textMuted, fontSize: 13, fontWeight: "600", marginTop: 4 },
  trustCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  trustText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, flex: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  cardSub: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerText: { color: colors.textDim, fontSize: 11, lineHeight: 16, flex: 1 },
});
