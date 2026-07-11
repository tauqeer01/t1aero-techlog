import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/src/components/BottomSheet";
import { Button, Input } from "@/src/components/UI";
import { ATA_CHAPTERS, CAPACITIES, Capacity, TASK_CATEGORIES } from "@/src/data/ata";
import {
  getAircraft,
  nowISO,
  todayISO,
  uid,
  upsertEntry,
} from "@/src/store/db";
import { Aircraft, LogEntry } from "@/src/store/types";
import { colors, radius, spacing, typography } from "@/src/theme";
import { hoursDecimal } from "@/src/utils/format";

export default function BulkEntry() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customReg, setCustomReg] = useState("");

  const [entryDate] = useState(todayISO());
  const [ata, setAta] = useState<number | null>(null);
  const [category, setCategory] = useState("Line Maintenance");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [capacity, setCapacity] = useState<Capacity>("performed");
  const [supervisor, setSupervisor] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);

  const [ataSheet, setAtaSheet] = useState(false);
  const [catSheet, setCatSheet] = useState(false);
  const [ataQuery, setAtaQuery] = useState("");

  useEffect(() => {
    getAircraft().then(setAircraft);
  }, []);

  const durationMinutes = useMemo(() => {
    const h = parseInt(hours || "0", 10) || 0;
    const m = parseInt(minutes || "0", 10) || 0;
    return h * 60 + m;
  }, [hours, minutes]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const addCustom = () => {
    const reg = customReg.trim().toUpperCase();
    if (!reg) return;
    const virtualId = `virt::${reg}`;
    const next = new Set(selected);
    next.add(virtualId);
    setSelected(next);
    setCustomReg("");
  };

  const selectedList: { id: string; registration: string; typeCode?: string; typeName?: string }[] = [];
  for (const id of selected) {
    if (id.startsWith("virt::")) {
      selectedList.push({ id, registration: id.replace("virt::", "") });
    } else {
      const a = aircraft.find((x) => x.id === id);
      if (a) selectedList.push({ id, registration: a.registration, typeCode: a.typeCode, typeName: a.typeName });
    }
  }

  const canSave = selectedList.length > 0 && description.trim().length > 0 && durationMinutes > 0;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    let count = 0;
    for (const s of selectedList) {
      const entry: LogEntry = {
        id: uid(),
        entryDate,
        registration: s.registration,
        typeCode: s.typeCode || "",
        typeName: s.typeName,
        ataChapter: ata,
        category,
        description: description.trim(),
        durationMinutes,
        capacity,
        supervisor: supervisor.trim() || undefined,
        photos: [],
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      await upsertEntry(entry);
      count += 1;
      setDone(count);
    }
    setBusy(false);
    router.back();
  };

  const filteredAta = ATA_CHAPTERS.filter((c) =>
    !ataQuery.trim() || String(c.code).includes(ataQuery.trim()) || c.title.toLowerCase().includes(ataQuery.toLowerCase()),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="bulk-entry-screen">
      <View style={[styles.head, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          testID="bulk-back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={typography.h3}>Bulk Entry</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.banner}>
            <Ionicons name="albums-outline" size={16} color={colors.primary} />
            <Text style={styles.bannerText}>
              Log the <Text style={{ color: colors.text, fontWeight: "800" }}>same task</Text> across many aircraft.
              Common on the line: pack pushback tows, fuel checks, transit inspections.
            </Text>
          </View>

          {/* Aircraft select */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={typography.label}>SELECT AIRCRAFT</Text>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>
                {selectedList.length} selected
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              {aircraft.length === 0 && (
                <View style={styles.emptyBox}>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    No aircraft yet. Add one below.
                  </Text>
                </View>
              )}
              {aircraft.map((a) => {
                const active = selected.has(a.id);
                return (
                  <Pressable
                    key={a.id}
                    testID={`bulk-ac-${a.registration}`}
                    onPress={() => toggle(a.id)}
                    style={({ pressed }) => [
                      styles.acRow,
                      active ? styles.acRowActive : null,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <View style={[styles.check, active ? styles.checkActive : null]}>
                      {active && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800", letterSpacing: 0.5 }}>
                        {a.registration}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                        {a.typeCode}
                        {a.typeName ? ` · ${a.typeName}` : ""}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Add custom */}
            <View style={styles.addRow}>
              <TextInput
                testID="bulk-custom-reg"
                value={customReg}
                onChangeText={setCustomReg}
                placeholder="Add registration (e.g. VT-XYZ)"
                placeholderTextColor={colors.textDim}
                autoCapitalize="characters"
                style={styles.addInput}
              />
              <Pressable
                testID="bulk-custom-add"
                onPress={addCustom}
                disabled={!customReg.trim()}
                style={({ pressed }) => [
                  styles.addBtn,
                  { opacity: !customReg.trim() ? 0.4 : pressed ? 0.8 : 1 },
                ]}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Shared task fields */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={typography.label}>ATA CHAPTER</Text>
              <Pressable
                testID="bulk-ata"
                onPress={() => setAtaSheet(true)}
                style={({ pressed }) => [styles.picker, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Ionicons name="apps-outline" size={18} color={colors.primary} />
                <Text style={styles.pickerText}>{ata != null ? `ATA ${ata}` : "Select"}</Text>
              </Pressable>
            </View>
            <View style={{ flex: 1.3, gap: 6 }}>
              <Text style={typography.label}>CATEGORY</Text>
              <Pressable
                testID="bulk-category"
                onPress={() => setCatSheet(true)}
                style={({ pressed }) => [styles.picker, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Ionicons name="build-outline" size={18} color={colors.primary} />
                <Text style={styles.pickerText} numberOfLines={1}>{category}</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={typography.label}>TASK DESCRIPTION</Text>
            <View style={[styles.inputWrap, { minHeight: 90, paddingVertical: 12 }]}>
              <TextInput
                testID="bulk-desc"
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Transit inspection + tyre pressure check"
                placeholderTextColor={colors.textDim}
                style={[styles.input, { textAlignVertical: "top" }]}
                multiline
              />
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
              <Text style={typography.label}>DURATION PER AIRCRAFT</Text>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "800" }}>
                {hoursDecimal(durationMinutes)}h × {selectedList.length} = {hoursDecimal(durationMinutes * selectedList.length)}h
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={[styles.inputWrap, { flex: 1, height: 56 }]}>
                <TextInput
                  testID="bulk-hours"
                  value={hours}
                  onChangeText={(v) => setHours(v.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  placeholderTextColor={colors.textDim}
                  keyboardType="number-pad"
                  style={[styles.input, { textAlign: "center", fontSize: 20, fontWeight: "800" }]}
                />
                <Text style={styles.unit}>h</Text>
              </View>
              <View style={[styles.inputWrap, { flex: 1, height: 56 }]}>
                <TextInput
                  testID="bulk-minutes"
                  value={minutes}
                  onChangeText={(v) => setMinutes(v.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  placeholderTextColor={colors.textDim}
                  keyboardType="number-pad"
                  style={[styles.input, { textAlign: "center", fontSize: 20, fontWeight: "800" }]}
                />
                <Text style={styles.unit}>m</Text>
              </View>
            </View>
          </View>

          {/* Capacity */}
          <View style={{ gap: 10 }}>
            <Text style={typography.label}>CAPACITY</Text>
            <View style={styles.capGrid}>
              {CAPACITIES.map((c) => (
                <Pressable
                  key={c.key}
                  testID={`bulk-cap-${c.key}`}
                  onPress={() => setCapacity(c.key as Capacity)}
                  style={({ pressed }) => [
                    styles.capBtn,
                    capacity === c.key ? styles.capBtnActive : null,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={[styles.capLabel, capacity === c.key ? { color: colors.primary } : null]}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Input testID="bulk-supervisor" label="SUPERVISOR (OPTIONAL)" value={supervisor} onChangeText={setSupervisor} />
        </ScrollView>

        <View style={[styles.saveBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            testID="bulk-save"
            label={busy ? `Saving ${done}/${selectedList.length}…` : `Log ${selectedList.length} ${selectedList.length === 1 ? "entry" : "entries"}`}
            onPress={save}
            disabled={!canSave || busy}
            loading={busy}
          />
        </View>
      </KeyboardAvoidingView>

      <BottomSheet visible={ataSheet} onClose={() => setAtaSheet(false)} title="ATA Chapter" testID="sheet-bulk-ata">
        <View style={styles.sheetSearch}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={ataQuery}
            onChangeText={setAtaQuery}
            placeholder="Search chapter…"
            placeholderTextColor={colors.textDim}
            style={styles.sheetSearchInput}
          />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredAta.map((c) => (
            <Pressable
              key={c.code}
              onPress={() => {
                setAta(c.code);
                setAtaSheet(false);
              }}
              style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={{ width: 60 }}>
                <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "800" }}>{c.code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetRowTitle}>{c.title}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={catSheet} onClose={() => setCatSheet(false)} title="Task Category" heightRatio={0.6} testID="sheet-bulk-cat">
        <ScrollView showsVerticalScrollIndicator={false}>
          {TASK_CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => {
                setCategory(c);
                setCatSheet(false);
              }}
              style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={[styles.sheetRowTitle, c === category ? { color: colors.primary } : null]}>{c}</Text>
              {c === category && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
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
  banner: {
    flexDirection: "row",
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  bannerText: { color: colors.textMuted, fontSize: 12, lineHeight: 17, flex: 1 },
  acRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  acRowActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  addRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  addInput: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
  },
  picker: {
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pickerText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: "600" },
  inputWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { color: colors.text, paddingHorizontal: 14, fontSize: 15, flex: 1 },
  unit: { color: colors.textMuted, fontSize: 14, fontWeight: "700", paddingRight: 14 },
  capGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  capBtn: {
    flex: 1,
    minWidth: "45%",
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  capBtnActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  capLabel: { color: colors.text, fontSize: 14, fontWeight: "800" },
  saveBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sheetSearch: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: spacing.md,
  },
  sheetSearchInput: { flex: 1, color: colors.text, fontSize: 15 },
  sheetRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetRowTitle: { color: colors.text, fontSize: 15, fontWeight: "700", flex: 1 },
});
