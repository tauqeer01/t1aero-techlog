// Local-first data layer. AsyncStorage-backed via the shared storage util.
// All reads/writes are async and never throw (silent fallback).

import { storage } from "@/src/utils/storage";
import { Aircraft, AppSettings, Credential, LogEntry } from "./types";

const KEYS = {
  entries: "t1aero.entries",
  aircraft: "t1aero.aircraft",
  credentials: "t1aero.credentials",
  settings: "t1aero.settings",
} as const;

// ---------------- Entries ----------------
export async function getEntries(): Promise<LogEntry[]> {
  const raw = await storage.getItem<string>(KEYS.entries, "");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveEntries(entries: LogEntry[]): Promise<void> {
  await storage.setItem(KEYS.entries, JSON.stringify(entries));
}

export async function upsertEntry(entry: LogEntry): Promise<LogEntry[]> {
  const all = await getEntries();
  const idx = all.findIndex((e) => e.id === entry.id);
  if (idx >= 0) all[idx] = entry;
  else all.unshift(entry);
  await saveEntries(all);
  return all;
}

export async function deleteEntry(id: string): Promise<LogEntry[]> {
  const all = await getEntries();
  const next = all.filter((e) => e.id !== id);
  await saveEntries(next);
  return next;
}

// ---------------- Aircraft ----------------
export async function getAircraft(): Promise<Aircraft[]> {
  const raw = await storage.getItem<string>(KEYS.aircraft, "");
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Aircraft[];
  } catch {
    return [];
  }
}

export async function saveAircraft(list: Aircraft[]): Promise<void> {
  await storage.setItem(KEYS.aircraft, JSON.stringify(list));
}

export async function upsertAircraft(a: Aircraft): Promise<Aircraft[]> {
  const all = await getAircraft();
  const idx = all.findIndex((x) => x.id === a.id);
  if (idx >= 0) all[idx] = a;
  else all.unshift(a);
  await saveAircraft(all);
  return all;
}

// ---------------- Credentials ----------------
export async function getCredentials(): Promise<Credential[]> {
  const raw = await storage.getItem<string>(KEYS.credentials, "");
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Credential[];
  } catch {
    return [];
  }
}

export async function saveCredentials(list: Credential[]): Promise<void> {
  await storage.setItem(KEYS.credentials, JSON.stringify(list));
}

export async function upsertCredential(c: Credential): Promise<Credential[]> {
  const all = await getCredentials();
  const idx = all.findIndex((x) => x.id === c.id);
  if (idx >= 0) all[idx] = c;
  else all.unshift(c);
  await saveCredentials(all);
  return all;
}

export async function deleteCredential(id: string): Promise<Credential[]> {
  const all = await getCredentials();
  const next = all.filter((c) => c.id !== id);
  await saveCredentials(next);
  return next;
}

// ---------------- Settings ----------------
const DEFAULT_SETTINGS: AppSettings = {
  onboarded: false,
  hapticsEnabled: true,
};

export async function getSettings(): Promise<AppSettings> {
  const raw = await storage.getItem<string>(KEYS.settings, "");
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as AppSettings) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(s: AppSettings): Promise<void> {
  await storage.setItem(KEYS.settings, JSON.stringify(s));
}

export async function patchSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await saveSettings(next);
  return next;
}

// ---------------- Utilities ----------------
export function uid(): string {
  // RFC-ish random id — good enough for a client-only single-user record.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Clears everything — for Settings > Reset.
export async function wipeAll(): Promise<void> {
  await storage.removeItem(KEYS.entries);
  await storage.removeItem(KEYS.aircraft);
  await storage.removeItem(KEYS.credentials);
  await storage.removeItem(KEYS.settings);
}
