// ATA 100 chapter reference. Not exhaustive — covers the working set an AME logs against.
export type ATAChapter = { code: number; title: string };

export const ATA_CHAPTERS: ATAChapter[] = [
  { code: 5, title: "Time Limits / Maintenance Checks" },
  { code: 6, title: "Dimensions & Areas" },
  { code: 7, title: "Lifting & Shoring" },
  { code: 8, title: "Leveling & Weighing" },
  { code: 9, title: "Towing & Taxiing" },
  { code: 10, title: "Parking, Mooring, Storage" },
  { code: 11, title: "Placards & Markings" },
  { code: 12, title: "Servicing" },
  { code: 20, title: "Standard Practices – Airframe" },
  { code: 21, title: "Air Conditioning" },
  { code: 22, title: "Auto Flight" },
  { code: 23, title: "Communications" },
  { code: 24, title: "Electrical Power" },
  { code: 25, title: "Equipment / Furnishings" },
  { code: 26, title: "Fire Protection" },
  { code: 27, title: "Flight Controls" },
  { code: 28, title: "Fuel" },
  { code: 29, title: "Hydraulic Power" },
  { code: 30, title: "Ice & Rain Protection" },
  { code: 31, title: "Indicating / Recording" },
  { code: 32, title: "Landing Gear" },
  { code: 33, title: "Lights" },
  { code: 34, title: "Navigation" },
  { code: 35, title: "Oxygen" },
  { code: 36, title: "Pneumatic" },
  { code: 38, title: "Water / Waste" },
  { code: 45, title: "Central Maintenance System" },
  { code: 46, title: "Information Systems" },
  { code: 49, title: "Airborne Auxiliary Power (APU)" },
  { code: 51, title: "Structures – General" },
  { code: 52, title: "Doors" },
  { code: 53, title: "Fuselage" },
  { code: 54, title: "Nacelles / Pylons" },
  { code: 55, title: "Stabilizers" },
  { code: 56, title: "Windows" },
  { code: 57, title: "Wings" },
  { code: 71, title: "Power Plant – General" },
  { code: 72, title: "Engine" },
  { code: 73, title: "Engine Fuel & Control" },
  { code: 74, title: "Ignition" },
  { code: 75, title: "Air (Engine)" },
  { code: 76, title: "Engine Controls" },
  { code: 77, title: "Engine Indicating" },
  { code: 78, title: "Exhaust" },
  { code: 79, title: "Oil" },
  { code: 80, title: "Starting" },
];

export const TASK_CATEGORIES = [
  "Line Maintenance",
  "Base / Heavy Check",
  "Component Change",
  "Troubleshooting",
  "Inspection",
  "Modification / SB",
  "Airworthiness Directive",
  "Deferred Defect",
  "Ground Handling",
  "Other",
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const CAPACITIES = [
  { key: "performed", label: "Performed", desc: "Hands-on task execution" },
  { key: "supervised", label: "Supervised", desc: "Oversaw another technician" },
  { key: "certified", label: "Certified", desc: "Signed off / CRS issued" },
  { key: "observed", label: "Observed", desc: "Observed / assisted" },
] as const;

export type Capacity = (typeof CAPACITIES)[number]["key"];
