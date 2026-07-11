// One-time demo seed. Called from Settings > Load Sample Data.
// Intentionally realistic so screenshots and stats look meaningful on first run.

import { Aircraft, Credential, LogEntry } from "./types";
import { nowISO, saveAircraft, saveCredentials, saveEntries, todayISO, uid } from "./db";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysAhead(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function loadSampleData() {
  const aircraft: Aircraft[] = [
    { id: uid(), registration: "VT-EXH", typeCode: "A20N", typeName: "A320neo", operator: "IndiGo", engineType: "CFM LEAP-1A", createdAt: nowISO() },
    { id: uid(), registration: "VT-JEG", typeCode: "B38M", typeName: "737 MAX 8", operator: "Akasa Air", engineType: "CFM LEAP-1B", createdAt: nowISO() },
    { id: uid(), registration: "VT-ANM", typeCode: "B789", typeName: "787-9", operator: "Air India", engineType: "GEnx-1B", createdAt: nowISO() },
    { id: uid(), registration: "VT-ATR", typeCode: "AT76", typeName: "ATR 72-600", operator: "IndiGo", engineType: "PW127", createdAt: nowISO() },
  ];

  const now = nowISO();
  const entries: LogEntry[] = [
    { id: uid(), entryDate: todayISO(), registration: "VT-EXH", typeCode: "A20N", typeName: "A320neo", ataChapter: 32, category: "Line Maintenance", description: "MLG tyre pressure check + servicing", durationMinutes: 45, capacity: "performed", supervisor: "R. Menon", photos: [], createdAt: now, updatedAt: now },
    { id: uid(), entryDate: daysAgo(1), registration: "VT-EXH", typeCode: "A20N", typeName: "A320neo", ataChapter: 27, category: "Troubleshooting", description: "Rudder trim fault — replaced FCTL sensor", durationMinutes: 180, capacity: "certified", supervisor: "S. Kaur", photos: [], createdAt: now, updatedAt: now },
    { id: uid(), entryDate: daysAgo(2), registration: "VT-JEG", typeCode: "B38M", typeName: "737 MAX 8", ataChapter: 49, category: "Component Change", description: "APU oil scavenge pump replacement", durationMinutes: 240, capacity: "performed", supervisor: "A. Khan", photos: [], createdAt: now, updatedAt: now },
    { id: uid(), entryDate: daysAgo(3), registration: "VT-ANM", typeCode: "B789", typeName: "787-9", ataChapter: 29, category: "Base / Heavy Check", description: "Hydraulic reservoir servicing L/R systems", durationMinutes: 300, capacity: "supervised", supervisor: "V. Iyer", photos: [], createdAt: now, updatedAt: now },
    { id: uid(), entryDate: daysAgo(4), registration: "VT-ATR", typeCode: "AT76", typeName: "ATR 72-600", ataChapter: 71, category: "Inspection", description: "Engine borescope inspection #1", durationMinutes: 150, capacity: "certified", supervisor: "M. Das", photos: [], createdAt: now, updatedAt: now },
    { id: uid(), entryDate: daysAgo(6), registration: "VT-EXH", typeCode: "A20N", typeName: "A320neo", ataChapter: 21, category: "Troubleshooting", description: "Pack 1 overtemp — clean HX + trim air valve check", durationMinutes: 210, capacity: "performed", supervisor: "R. Menon", photos: [], createdAt: now, updatedAt: now },
    { id: uid(), entryDate: daysAgo(8), registration: "VT-JEG", typeCode: "B38M", typeName: "737 MAX 8", ataChapter: 34, category: "Modification / SB", description: "SB 34-2201 install — GPS antenna coax", durationMinutes: 360, capacity: "certified", supervisor: "A. Khan", photos: [], createdAt: now, updatedAt: now },
    { id: uid(), entryDate: daysAgo(10), registration: "VT-ANM", typeCode: "B789", typeName: "787-9", ataChapter: 32, category: "Line Maintenance", description: "NLG steering actuator lubrication", durationMinutes: 90, capacity: "performed", supervisor: "V. Iyer", photos: [], createdAt: now, updatedAt: now },
    { id: uid(), entryDate: daysAgo(12), registration: "VT-EXH", typeCode: "A20N", typeName: "A320neo", ataChapter: 24, category: "Component Change", description: "TR2 replacement + BITE test", durationMinutes: 200, capacity: "certified", supervisor: "S. Kaur", photos: [], createdAt: now, updatedAt: now },
    { id: uid(), entryDate: daysAgo(15), registration: "VT-ATR", typeCode: "AT76", typeName: "ATR 72-600", ataChapter: 72, category: "Base / Heavy Check", description: "Propeller balance run — Vibrex", durationMinutes: 180, capacity: "supervised", supervisor: "M. Das", photos: [], createdAt: now, updatedAt: now },
    { id: uid(), entryDate: daysAgo(18), registration: "VT-EXH", typeCode: "A20N", typeName: "A320neo", ataChapter: 32, category: "Inspection", description: "Wheel well general condition inspection", durationMinutes: 60, capacity: "observed", supervisor: "R. Menon", photos: [], createdAt: now, updatedAt: now },
    { id: uid(), entryDate: daysAgo(22), registration: "VT-JEG", typeCode: "B38M", typeName: "737 MAX 8", ataChapter: 27, category: "Airworthiness Directive", description: "AD 2023-15-02 slat track inspection", durationMinutes: 420, capacity: "certified", supervisor: "A. Khan", photos: [], createdAt: now, updatedAt: now },
  ];

  const credentials: Credential[] = [
    { id: uid(), name: "Part-66 B1.1 Licence", type: "AME Licence (Part-66)", authority: "DGCA India", reference: "AME/B1/2019/00742", issueDate: daysAgo(365 * 4), expiryDate: daysAhead(410), notes: "Renewal window opens 6 months prior.", createdAt: nowISO(), updatedAt: nowISO() },
    { id: uid(), name: "A320 Type Rating (CFM)", type: "Type Rating", authority: "DGCA India", reference: "TR/A320-CFM/2021", issueDate: daysAgo(365 * 2), expiryDate: daysAhead(65), notes: "", createdAt: nowISO(), updatedAt: nowISO() },
    { id: uid(), name: "737 MAX Differences", type: "Type Rating", authority: "DGCA India", reference: "TR/B738-MAX/2023", issueDate: daysAgo(180), expiryDate: daysAhead(25), notes: "Renewal scheduled with training dept.", createdAt: nowISO(), updatedAt: nowISO() },
    { id: uid(), name: "Human Factors Refresher", type: "Human Factors", authority: "Company", reference: "HF-2024-Q1", issueDate: daysAgo(200), expiryDate: daysAhead(165), notes: "", createdAt: nowISO(), updatedAt: nowISO() },
    { id: uid(), name: "Fuel Tank Safety", type: "Fuel Tank Safety", authority: "Company", reference: "FTS-2024", issueDate: daysAgo(300), expiryDate: daysAhead(65), notes: "", createdAt: nowISO(), updatedAt: nowISO() },
    { id: uid(), name: "Company Authorisation A320", type: "Company Authorisation", authority: "Air Operator", reference: "AUTH/A320/2024", issueDate: daysAgo(90), expiryDate: daysAhead(-10), notes: "EXPIRED — renew before next shift.", createdAt: nowISO(), updatedAt: nowISO() },
  ];

  await saveAircraft(aircraft);
  await saveEntries(entries);
  await saveCredentials(credentials);
}
