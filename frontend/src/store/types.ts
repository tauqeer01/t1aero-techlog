export type Capacity = "performed" | "supervised" | "certified" | "observed";

export type Aircraft = {
  id: string;
  registration: string;      // e.g. VT-EXH
  typeCode: string;          // ICAO code or free text
  typeName?: string;
  variant?: string;
  engineType?: string;
  operator?: string;
  createdAt: string;
};

export type LogEntry = {
  id: string;
  entryDate: string;         // ISO YYYY-MM-DD
  registration: string;
  typeCode: string;
  typeName?: string;
  ataChapter: number | null;
  ataSubchapter?: string;
  category: string;
  description: string;
  durationMinutes: number;   // integer minutes
  capacity: Capacity;
  supervisor?: string;
  location?: string;
  photos: string[];          // base64 strings
  createdAt: string;
  updatedAt: string;
};

export type Credential = {
  id: string;
  name: string;
  type: string;
  authority?: string;
  reference?: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type AppSettings = {
  displayName?: string;
  licenceNumber?: string;
  homeAuthority?: string;
  onboarded: boolean;
  hapticsEnabled: boolean;
};
