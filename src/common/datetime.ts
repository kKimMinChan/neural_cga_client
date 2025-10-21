// utils/datetime.ts
export const toIso = (d: Date | string | null | undefined): string | null =>
  d ? (d instanceof Date ? d.toISOString() : d) : null;
