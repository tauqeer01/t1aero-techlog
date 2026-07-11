// T-1 AERO design tokens. Dark-mode only.

export const colors = {
  bg: "#0A0E17",
  surface: "#111827",
  surfaceElevated: "#161D2C",
  card: "#1F2937",
  cardElevated: "#273244",
  primary: "#FF5A1F",
  primaryDim: "#3D1A0A",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  textDim: "#6B7280",
  border: "#2A3444",
  borderStrong: "#374151",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  overlay: "rgba(0,0,0,0.65)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

export const typography = {
  // Use system font stack for reliability and native feel.
  // Numbers use variant with letterSpacing for tabular clarity.
  display: {
    fontSize: 42,
    fontWeight: "800" as const,
    letterSpacing: -1,
    color: colors.text,
  },
  h1: {
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
    color: colors.text,
  },
  h2: {
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
    color: colors.text,
  },
  h3: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: colors.text,
  },
  bodyMuted: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: colors.textMuted,
  },
  label: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
    color: colors.textMuted,
    textTransform: "uppercase" as const,
  },
  metric: {
    fontSize: 44,
    fontWeight: "800" as const,
    letterSpacing: -1.5,
    color: colors.text,
  },
  mono: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text,
    fontVariant: ["tabular-nums" as const],
  },
};

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};
