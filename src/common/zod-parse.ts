import { z } from 'zod';
// 공통 유틸
export function parseWith<T>(schema: z.ZodType<T>, json: string): T {
  const raw = JSON.parse(json) as unknown;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid patch: ${parsed.error.message}`);
  }
  return parsed.data;
}
