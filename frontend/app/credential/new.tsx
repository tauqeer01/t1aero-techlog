import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { CREDENTIAL_TYPES } from "@/src/data/icao";
import { nowISO, uid, upsertCredential } from "@/src/store/db";
import { Credential } from "@/src/store/types";
import { colors, radius, spacing, typography } from "@/src/theme";
import { formatDate } from "@/src/utils/format";

export default function NewCredential() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [type, setType] = useState<string>(CREDENTIAL_TYPES[0]);
  const [authority, setAuthority] = useState("");
  const [reference, setReference] = useState("");
  const [issueDate, setIssueDate] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [typeSheet, setTypeSheet] = useState(false);
  const [dateSheet, setDateSheet] = useState<"issue" | "expiry" | null>(null);
  const [busy, setBusy] = useState(false);

  const canSave = name.trim().length > 0;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    const c: Credential = {
      id: uid(),
      name: name.trim(),
      type,
      authority: authority.trim() || undefined,
      reference: reference.trim() || undefined,
      issueDate: issueDate || undefined,
      expiryDate: expiryDate || undefined,
      notes: notes.trim() || undefined,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    await upsertCredential(c);
    setBusy(false);
    router.back();
  };

  const chooseDate = (iso: string) => {
    if (dateSheet === "issue") setIssueDate(iso);
    else if (dateSheet === "expiry") setExpiryDate(iso);
    setDateSheet(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="new-cred-screen">
      <View style={[styles.head, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          testID="new-cred-back"
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={typography.h3}>New Credential</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            testID="cred-name"
            label="NAME"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Part-66 B1.1 Licence"
          />

          <View style={{ gap: 6 }}>
            <Text style={typography.label}>TYPE</Text>
            <Pressable
              testID="cred-type"
              onPress={() => setTypeSheet(true)}
              style={({ pressed }) => [styles.picker, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="ribbon-outline" size={18} color={colors.primary} />
              <Text style={styles.pickerText}>{type}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textDim} />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input testID="cred-authority" label="AUTHORITY" value={authority} onChangeText={setAuthority} placeholder="e.g. DGCA" />
            </View>
            <View style={{ flex: 1 }}>
              <Input testID="cred-reference" label="REFERENCE #" value={reference} onChangeText={setReference} placeholder="e.g. AME/B1/…" />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={typography.label}>ISSUE DATE</Text>
              <Pressable
                testID="cred-issue-date"
                onPress={() => setDateSheet("issue")}
                style={({ pressed }) => [styles.picker, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={[styles.pickerText, { color: issueDate ? colors.text : colors.textDim }]}>
                  {issueDate ? formatDate(issueDate) : "Optional"}
                </Text>
              </Pressable>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={typography.label}>EXPIRY DATE</Text>
              <Pressable
                testID="cred-expiry-date"
                onPress={() => setDateSheet("expiry")}
                style={({ pressed }) => [styles.picker, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Ionicons name="alarm-outline" size={18} color={colors.warning} />
                <Text style={[styles.pickerText, { color: expiryDate ? colors.text : colors.textDim }]}>
                  {expiryDate ? formatDate(expiryDate) : "Set to enable reminders"}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={typography.label}>NOTES</Text>
            <View style={[styles.inputWrap, { minHeight: 90, paddingVertical: 12 }]}>
              <TextInput
                testID="cred-notes"
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional notes"
                placeholderTextColor={colors.textDim}
                style={[styles.input, { textAlignVertical: "top" }]}
                multiline
              />
            </View>
          </View>

          <View style={styles.reminderCard}>
            <Ionicons name="notifications-outline" size={16} color={colors.info} />
            <Text style={styles.reminderText}>
              When you set an expiry date, T-1 AERO shows reminders 90 / 30 / 7 days before it lapses. Reminders are informational.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.saveBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button label="Save Credential" onPress={save} disabled={!canSave || busy} loading={busy} testID="cred-save" />
        </View>
      </KeyboardAvoidingView>

      <BottomSheet visible={typeSheet} onClose={() => setTypeSheet(false)} title="Credential Type" heightRatio={0.7} testID="sheet-cred-type">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {CREDENTIAL_TYPES.map((t) => (
            <Pressable
              key={t}
              testID={`cred-type-opt-${t}`}
              onPress={() => {
                setType(t);
                setTypeSheet(false);
              }}
              style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={[styles.sheetRowTitle, t === type ? { color: colors.primary } : null]}>{t}</Text>
              {t === type && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={dateSheet !== null}
        onClose={() => setDateSheet(null)}
        title={dateSheet === "issue" ? "Issue Date" : "Expiry Date"}
        heightRatio={0.6}
        testID="sheet-cred-date"
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {dateSheet === "expiry" && (
            <>
              {[30, 60, 90, 180, 365, 730].map((n) => {
                const d = new Date();
                d.setDate(d.getDate() + n);
                const iso = d.toISOString().slice(0, 10);
                return (
                  <Pressable
                    key={n}
                    testID={`cred-date-ahead-${n}`}
                    onPress={() => chooseDate(iso)}
                    style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.85 : 1 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sheetRowTitle}>In {n} days</Text>
                      <Text style={styles.sheetRowSub}>{iso}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
                  </Pressable>
                );
              })}
            </>
          )}
          {dateSheet === "issue" && (
            <>
              {[0, 30, 90, 180, 365, 730].map((n) => {
                const d = new Date();
                d.setDate(d.getDate() - n);
                const iso = d.toISOString().slice(0, 10);
                return (
                  <Pressable
                    key={n}
                    testID={`cred-date-ago-${n}`}
                    onPress={() => chooseDate(iso)}
                    style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.85 : 1 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sheetRowTitle}>{n === 0 ? "Today" : `${n} days ago`}</Text>
                      <Text style={styles.sheetRowSub}>{iso}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
                  </Pressable>
                );
              })}
            </>
          )}
          <Pressable
            testID="cred-date-clear"
            onPress={() => chooseDate("")}
            style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={[styles.sheetRowTitle, { color: colors.danger }]}>Clear date</Text>
          </Pressable>
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
  },
  input: { color: colors.text, paddingHorizontal: 14, fontSize: 15, flex: 1 },
  reminderCard: {
    flexDirection: "row",
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  reminderText: { color: colors.textMuted, fontSize: 12, lineHeight: 17, flex: 1 },
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
  sheetRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetRowTitle: { color: colors.text, fontSize: 15, fontWeight: "700", flex: 1 },
  sheetRowSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
