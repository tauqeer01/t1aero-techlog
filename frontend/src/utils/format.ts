// Small formatting helpers shared across screens.

export function formatDuration(minutes: number): string {
  if (!minutes || minutes < 0) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

// Hours as decimal with one place, e.g. 45min -> 0.8, 210min -> 3.5
export function hoursDecimal(minutes: number): string {
  if (!minutes || minutes < 0) return "0.0";
  return (minutes / 60).toFixed(1);
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function shortDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

export function daysUntil(iso: string | undefined): number | null {
  if (!iso) return null;
  const target = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function initials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export function capacityLabel(k: string): string {
  return k.charAt(0).toUpperCase() + k.slice(1);
}

export function capacityColor(k: string): string {
  switch (k) {
    case "certified": return "#10B981";
    case "performed": return "#3B82F6";
    case "supervised": return "#F59E0B";
    case "observed": return "#9CA3AF";
    default: return "#9CA3AF";
  }
}
