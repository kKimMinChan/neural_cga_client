// src/common/utils/timestamps.ts
export function addUpdatedAt<T extends Record<string, any>>(
  data: T,
): T & { updatedAt: Date } {
  return {
    ...data,
    updatedAt: new Date(),
  };
}
