// The 14 sensors we keep from C-MAPSS FD001 (the other 7 are constant).
export const SENSORS = [
  "s2", "s3", "s4", "s7", "s8", "s9", "s11",
  "s12", "s13", "s14", "s15", "s17", "s20", "s21",
] as const;

export type SensorName = (typeof SENSORS)[number];

export const SENSOR_LABELS: Record<SensorName, string> = {
  s2: "LPC outlet temp (T24)",
  s3: "HPC outlet temp (T30)",
  s4: "LPT outlet temp (T50)",
  s7: "HPC outlet pressure (P30)",
  s8: "Physical fan speed (Nf)",
  s9: "Physical core speed (Nc)",
  s11: "HPC outlet static pressure (Ps30)",
  s12: "Fuel flow / Ps30 ratio (phi)",
  s13: "Corrected fan speed",
  s14: "Corrected core speed",
  s15: "Bypass ratio",
  s17: "Bleed enthalpy",
  s20: "HPT coolant bleed",
  s21: "LPT coolant bleed",
};
