import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
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
import { ICAO_TYPES } from "@/src/data/icao";
import {
  getAircraft,
  getEntries,
  getSettings,
  nowISO,
  todayISO,
  uid,
  upsertAircraft,
  upsertEntry,
} from "@/src/store/db";
import { Aircraft, LogEntry } from "@/src/store/types";
import { colors, radius, spacing, typography } from "@/src/theme";
import { formatDate, hoursDecimal } from "@/src/utils/format";

export default function NewEntry() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [hapticsOn, setHapticsOn] = useState(true);

  // Form state
  const [entryDate, setEntryDate] = useState(todayISO());
  const [registration, setRegistration] = useState("");
  const [typeCode, setTypeCode] = useState("");
  const [typeName, setTypeName] = useState("");
  const [ata, setAta] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("Line Maintenance");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [capacity, setCapacity] = useState<Capacity>("performed");
  const [supervisor, setSupervisor] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  // Sheets
  const [dateSheet, setDateSheet] = useState(false);
  const [regSheet, setRegSheet] = useState(false);
  const [typeSheet, setTypeSheet] = useState(false);
  const [ataSheet, setAtaSheet] = useState(false);
  const [catSheet, setCatSheet] = useState(false);

  // Type / reg picker filters
  const [regQuery, setRegQuery] = useState("");
  const [typeQuery, setTypeQuery] = useState("");
  const [ataQuery, setAtaQuery] = useState("");

  useEffect(() => {
    (async () => {
      const [a, entries, s] = await Promise.all([getAircraft(), getEntries(), getSettings()]);
      setAircraft(a);
      setHapticsOn(!!s.hapticsEnabled);

      if (from) {
        const src = entries.find((e) => e.id === from);
        if (src) {
          setEntryDate(todayISO());
          setRegistration(src.registration);
          setTypeCode(src.typeCode);
          setTypeName(src.typeName || "");
          setAta(src.ataChapter);
          setCategory(src.category);
          setDescription(src.description);
          setHours(String(Math.floor(src.durationMinutes / 60)));
          setMinutes(String(src.durationMinutes % 60));
          setCapacity(src.capacity);
          setSupervisor(src.supervisor || "");
        }
      }
    })();
  }, [from]);

  const buzz = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticsOn && Platform.OS !== "web") Haptics.impactAsync(style).catch(() => {});
  };

  const durationMinutes = useMemo(() => {
    const h = parseInt(hours || "0", 10) || 0;
    const m = parseInt(minutes || "0", 10) || 0;
    return h * 60 + m;
  }, [hours, minutes]);

  const canSave =
    registration.trim().length > 0 &&
    (typeCode.trim() || typeName.trim()).length > 0 &&
    description.trim().length > 0 &&
    durationMinutes > 0;

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to attach evidence.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
    });
    if (!res.canceled && res.assets?.[0]?.base64) {
      const b64 = `data:${res.assets[0].mimeType || "image/jpeg"};base64,${res.assets[0].base64}`;
      setPhotos((p) => [...p, b64]);
      buzz();
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow camera access to attach evidence.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true });
    if (!res.canceled && res.assets?.[0]?.base64) {
      const b64 = `data:${res.assets[0].mimeType || "image/jpeg"};base64,${res.assets[0].base64}`;
      setPhotos((p) => [...p, b64]);
      buzz();
    }
  };

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const chooseAircraft = (a: Aircraft) => {
    setRegistration(a.registration);
    setTypeCode(a.typeCode);
    setTypeName(a.typeName || "");
    setRegSheet(false);
    buzz();
  };

  const chooseType = (code: string, name: string) => {
    setTypeCode(code);
    setTypeName(name);
    setTypeSheet(false);
    buzz();
  };

  const chooseAta = (code: number) => {
    setAta(code);
    setAtaSheet(false);
    buzz();
  };

  const setQuickHours = (v: number) => {
    setHours(String(Math.floor(v)));
    setMinutes(String(Math.round((v - Math.floor(v)) * 60)));
    buzz();
  };

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    buzz(Haptics.ImpactFeedbackStyle.Medium);

    // Register aircraft if new
    const regUpper = registration.trim().toUpperCase();
    if (!aircraft.some((a) => a.registration.toUpperCase() === regUpper)) {
      await upsertAircraft({
        id: uid(),
        registration: regUpper,
        typeCode: typeCode.trim(),
        typeName: typeName.trim() || undefined,
        createdAt: nowISO(),
      });
    }

    const entry: LogEntry = {
      id: uid(),
      entryDate,
      registration: regUpper,
      typeCode: typeCode.trim(),
      typeName: typeName.trim() || undefined,
      ataChapter: ata,
      category,
      description: description.trim(),
      durationMinutes,
      capacity,
      supervisor: supervisor.trim() || undefined,
      photos,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    await upsertEntry(entry);
    setBusy(false);
    router.back();
  };

  const filteredAircraft = aircraft.filter((a) =>
    !regQuery.trim() ||
    a.registration.toLowerCase().includes(regQuery.toLowerCase()) ||
    (a.typeCode || "").toLowerCase().includes(regQuery.toLowerCase()) ||
    (a.typeName || "").toLowerCase().includes(regQuery.toLowerCase()),
  );

  const filteredTypes = ICAO_TYPES.filter((t) =>
    !typeQuery.trim() ||
    t.code.toLowerCase().includes(typeQuery.toLowerCase()) ||
    t.name.toLowerCase().includes(typeQuery.toLowerCase()) ||
    t.manufacturer.toLowerCase().includes(typeQuery.toLowerCase()),
  );

  const filteredAta = ATA_CHAPTERS.filter((c) =>
    !ataQuery.trim() ||
    String(c.code).includes(ataQuery.trim()) ||
    c.title.toLowerCase().includes(ataQuery.toLowerCase()),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="new-entry-screen">
      {/* Sticky header */}
      <View style={[styles.head, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          testID="new-entry-back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={typography.h3}>{from ? "Repeat Entry" : "New Entry"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date */}
          <Field label="DATE">
            <PickerButton
              testID="field-date"
              icon="calendar-outline"
              value={formatDate(entryDate)}
              onPress={() => setDateSheet(true)}
            />
          </Field>

          {/* Aircraft */}
          <View style={{ gap: 12 }}>
            <Field label="AIRCRAFT REGISTRATION">
              <PickerButton
                testID="field-registration"
                icon="pricetag-outline"
                value={registration || "Select or type registration"}
                placeholder={!registration}
                onPress={() => setRegSheet(true)}
              />
            </Field>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Field label="ICAO TYPE">
                  <PickerButton
                    testID="field-type"
                    icon="airplane-outline"
                    value={typeCode || "Select type"}
                    placeholder={!typeCode}
                    onPress={() => setTypeSheet(true)}
                  />
                </Field>
              </View>
              {typeName ? (
                <View style={{ flex: 1.3 }}>
                  <Field label="MODEL">
                    <View style={styles.readonly}>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }} numberOfLines={1}>
                        {typeName}
                      </Text>
                    </View>
                  </Field>
                </View>
              ) : null}
            </View>
          </View>

          {/* ATA & Category */}
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Field label="ATA CHAPTER">
                <PickerButton
                  testID="field-ata"
                  icon="apps-outline"
                  value={ata != null ? `ATA ${ata}` : "Select"}
                  placeholder={ata == null}
                  onPress={() => setAtaSheet(true)}
                />
              </Field>
            </View>
            <View style={{ flex: 1.4 }}>
              <Field label="CATEGORY">
                <PickerButton
                  testID="field-category"
                  icon="build-outline"
                  value={category}
                  onPress={() => setCatSheet(true)}
                />
              </Field>
            </View>
          </View>

          {/* Description */}
          <Field label="TASK DESCRIPTION">
            <View style={[styles.inputWrap, { minHeight: 100, paddingVertical: 12 }]}>
              <TextInput
                testID="field-description"
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. MLG tyre pressure check + servicing"
                placeholderTextColor={colors.textDim}
                style={[styles.input, { textAlignVertical: "top" }]}
                multiline
              />
            </View>
          </Field>

          {/* Duration */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
              <Text style={typography.label}>DURATION</Text>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "800" }}>
                {hoursDecimal(durationMinutes)}h
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={[styles.inputWrap, { flex: 1, height: 56 }]}>
                <TextInput
                  testID="field-hours"
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
                  testID="field-minutes"
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[0.5, 1, 2, 4, 8].map((v) => (
                <Pressable
                  key={v}
                  testID={`quick-hours-${v}`}
                  onPress={() => setQuickHours(v)}
                  style={({ pressed }) => [styles.quick, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 13 }}>{v}h</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Capacity */}
          <View style={{ gap: 10 }}>
            <Text style={typography.label}>CAPACITY</Text>
            <View style={styles.capGrid}>
              {CAPACITIES.map((c) => (
                <Pressable
                  key={c.key}
                  testID={`capacity-${c.key}`}
                  onPress={() => {
                    setCapacity(c.key as Capacity);
                    buzz();
                  }}
                  style={({ pressed }) => [
                    styles.capBtn,
                    capacity === c.key ? styles.capBtnActive : null,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={[styles.capLabel, capacity === c.key ? { color: colors.primary } : null]}>
                    {c.label}
                  </Text>
                  <Text style={styles.capDesc}>{c.desc}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Supervisor */}
          <Input
            testID="field-supervisor"
            label="SUPERVISOR (OPTIONAL)"
            value={supervisor}
            onChangeText={setSupervisor}
            placeholder="Free-text name"
          />

          {/* Photos */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={typography.label}>EVIDENCE PHOTOS</Text>
              <Text style={{ color: colors.textDim, fontSize: 11 }}>{photos.length} attached</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {photos.map((p, i) => (
                <View key={i} style={styles.photoBox}>
                  <Image source={{ uri: p }} style={styles.photo} />
                  <Pressable
                    testID={`photo-remove-${i}`}
                    onPress={() => removePhoto(i)}
                    style={styles.photoRemove}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={12} color="#fff" />
                  </Pressable>
                </View>
              ))}
              <Pressable
                testID="photo-add-camera"
                onPress={takePhoto}
                style={({ pressed }) => [styles.photoAdd, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Ionicons name="camera-outline" size={22} color={colors.text} />
                <Text style={styles.photoAddText}>Camera</Text>
              </Pressable>
              <Pressable
                testID="photo-add-library"
                onPress={pickPhoto}
                style={({ pressed }) => [styles.photoAdd, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Ionicons name="image-outline" size={22} color={colors.text} />
                <Text style={styles.photoAddText}>Gallery</Text>
              </Pressable>
            </ScrollView>
          </View>
        </ScrollView>

        {/* Sticky save bar */}
        <View style={[styles.saveBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            label={busy ? "Saving…" : "Save Entry"}
            onPress={save}
            disabled={!canSave || busy}
            loading={busy}
            testID="save-entry"
          />
        </View>
      </KeyboardAvoidingView>

      {/* Date sheet — simple quick pick */}
      <BottomSheet visible={dateSheet} onClose={() => setDateSheet(false)} title="Entry Date" heightRatio={0.5} testID="sheet-date">
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          {Array.from({ length: 14 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const iso = d.toISOString().slice(0, 10);
            const label = i === 0 ? "Today" : i === 1 ? "Yesterday" : formatDate(iso);
            const active = iso === entryDate;
            return (
              <Pressable
                key={iso}
                testID={`date-opt-${iso}`}
                onPress={() => {
                  setEntryDate(iso);
                  setDateSheet(false);
                  buzz();
                }}
                style={({ pressed }) => [styles.sheetRow, active ? styles.sheetRowActive : null, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={[styles.sheetRowTitle, active ? { color: colors.primary } : null]}>{label}</Text>
                <Text style={styles.sheetRowSub}>{iso}</Text>
                {active && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>

      {/* Aircraft registration sheet */}
      <BottomSheet visible={regSheet} onClose={() => setRegSheet(false)} title="Aircraft" testID="sheet-reg">
        <View style={styles.sheetSearch}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            testID="sheet-reg-search"
            value={regQuery}
            onChangeText={setRegQuery}
            placeholder="Search or type new registration…"
            placeholderTextColor={colors.textDim}
            style={styles.sheetSearchInput}
            autoCapitalize="characters"
          />
        </View>
        {regQuery.trim() && !filteredAircraft.some((a) => a.registration.toLowerCase() === regQuery.toLowerCase()) && (
          <Pressable
            testID="sheet-reg-add-custom"
            onPress={() => {
              setRegistration(regQuery.trim().toUpperCase());
              setRegSheet(false);
              buzz();
            }}
            style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetRowTitle}>Use "{regQuery.toUpperCase()}"</Text>
              <Text style={styles.sheetRowSub}>New registration</Text>
            </View>
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          </Pressable>
        )}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {filteredAircraft.length === 0 && !regQuery.trim() ? (
            <View style={styles.sheetEmpty}>
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: "center" }}>
                No aircraft yet. Type a registration above to add one.
              </Text>
            </View>
          ) : (
            filteredAircraft.map((a) => (
              <Pressable
                key={a.id}
                testID={`sheet-reg-opt-${a.registration}`}
                onPress={() => chooseAircraft(a)}
                style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetRowTitle}>{a.registration}</Text>
                  <Text style={styles.sheetRowSub}>
                    {a.typeCode}
                    {a.typeName ? ` · ${a.typeName}` : ""}
                    {a.operator ? ` · ${a.operator}` : ""}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
              </Pressable>
            ))
          )}
        </ScrollView>
      </BottomSheet>

      {/* Type sheet */}
      <BottomSheet visible={typeSheet} onClose={() => setTypeSheet(false)} title="Aircraft Type (ICAO)" testID="sheet-type">
        <View style={styles.sheetSearch}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            testID="sheet-type-search"
            value={typeQuery}
            onChangeText={setTypeQuery}
            placeholder="Search e.g. A320, 737, ATR…"
            placeholderTextColor={colors.textDim}
            style={styles.sheetSearchInput}
            autoCapitalize="characters"
          />
        </View>
        {typeQuery.trim() && !filteredTypes.some((t) => t.code.toLowerCase() === typeQuery.toLowerCase()) && (
          <Pressable
            onPress={() => chooseType(typeQuery.trim().toUpperCase(), "")}
            testID="sheet-type-add-custom"
            style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetRowTitle}>Use "{typeQuery.toUpperCase()}"</Text>
              <Text style={styles.sheetRowSub}>Custom / non-ICAO type</Text>
            </View>
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          </Pressable>
        )}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {filteredTypes.map((t) => (
            <Pressable
              key={t.code}
              testID={`sheet-type-opt-${t.code}`}
              onPress={() => chooseType(t.code, t.name)}
              style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={{ width: 60 }}>
                <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "800" }}>{t.code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetRowTitle}>{t.name}</Text>
                <Text style={styles.sheetRowSub}>{t.manufacturer}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>

      {/* ATA sheet */}
      <BottomSheet visible={ataSheet} onClose={() => setAtaSheet(false)} title="ATA Chapter" testID="sheet-ata">
        <View style={styles.sheetSearch}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            testID="sheet-ata-search"
            value={ataQuery}
            onChangeText={setAtaQuery}
            placeholder="Search chapter or number…"
            placeholderTextColor={colors.textDim}
            style={styles.sheetSearchInput}
          />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {filteredAta.map((c) => (
            <Pressable
              key={c.code}
              testID={`sheet-ata-opt-${c.code}`}
              onPress={() => chooseAta(c.code)}
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

      {/* Category sheet */}
      <BottomSheet visible={catSheet} onClose={() => setCatSheet(false)} title="Task Category" testID="sheet-category" heightRatio={0.6}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {TASK_CATEGORIES.map((c) => (
            <Pressable
              key={c}
              testID={`sheet-cat-opt-${c}`}
              onPress={() => {
                setCategory(c);
                setCatSheet(false);
                buzz();
              }}
              style={({ pressed }) => [
                styles.sheetRow,
                c === category ? styles.sheetRowActive : null,
                { opacity: pressed ? 0.85 : 1 },
              ]}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={typography.label}>{label}</Text>
      {children}
    </View>
  );
}

function PickerButton({
  value,
  onPress,
  icon,
  placeholder,
  testID,
}: {
  value: string;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.picker, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Ionicons name={icon} size={18} color={placeholder ? colors.textDim : colors.primary} />
      <Text
        style={[
          styles.pickerText,
          { color: placeholder ? colors.textDim : colors.text, fontWeight: placeholder ? "500" : "700" },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Ionicons name="chevron-down" size={16} color={colors.textDim} />
    </Pressable>
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
  pickerText: { flex: 1, fontSize: 15 },
  readonly: {
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    justifyContent: "center",
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
  unit: { color: colors.textMuted, fontSize: 14, fontWeight: "700", paddingRight: 14 },
  quick: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  capGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  capBtn: {
    width: "48%",
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 72,
  },
  capBtnActive: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primary,
  },
  capLabel: { color: colors.text, fontSize: 15, fontWeight: "800" },
  capDesc: { color: colors.textMuted, fontSize: 11, marginTop: 4, lineHeight: 15 },
  photoBox: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.card,
    position: "relative",
  },
  photo: { width: "100%", height: "100%" },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoAdd: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoAddText: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
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
  sheetRowActive: {},
  sheetRowTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  sheetRowSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  sheetEmpty: { padding: spacing.xl, alignItems: "center" },
});
