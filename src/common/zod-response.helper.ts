// zod-response.helper.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/** Date -> string(date-time)로 문서화 (런타임은 Date/문자열 모두 허용) */
export const ApiDateTime = z
  .preprocess(
    (v) => (v instanceof Date ? v.toISOString() : v),
    z.string().datetime(),
  )
  .nullable();

type EnvelopeDtos = {
  GetSchema: z.ZodTypeAny;
  NoContentSchema: z.ZodTypeAny;
  GetDto: new (...args: any[]) => unknown;
  NoContentDto: new (...args: any[]) => unknown;
  GetPageDto: new (...args: any[]) => unknown;
};

/**
 * item 스키마를 받아 항상 data는 "배열"로 내보내는 Envelope DTO 생성기
 * - GET(데이터 포함)
 * - NoContent(데이터 없음) 또는 옵션에 따라 data: []
 */
export function makeEnvelopeDtos<T extends z.ZodTypeAny>(opts: {
  name: string; // DTO 접두사
  item: T; // data 아이템 스키마 (항상 array)
}): EnvelopeDtos {
  const { name, item } = opts;

  const Base = z.object({
    statusCode: z.number().default(204),
    message: z.string().default('No Content'),
    result: z.boolean().default(true),
    translate: z
      .string()
      .optional()
      .default('요청이 성공적으로 처리되었습니다.'),
  });

  const getBase = z.object({
    statusCode: z.number().default(200),
    message: z.string().default('OK'),
    result: z.boolean().default(true),
    translate: z
      .string()
      .optional()
      .default('요청이 성공적으로 처리되었습니다.'),
  });

  const Page = z.object({
    totalCount: z.number().int(),
    totalPages: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  });

  /** 항상 배열 */
  const DataArray = z.object({
    data: z.array(item),
  });

  /** GET: data 배열 필수 */
  const GetPageSchema = getBase.merge(Page).merge(DataArray).strict();

  const GetSchema = getBase.merge(DataArray).strict();

  const NoContentSchema = Base.merge(DataArray).strict();

  /** NoContent: 기본은 바디 없이(스키마상 data 없음).
   *  만약 항상 배열을 유지하고 싶으면 includeDataOnNoContent=true 로 data: [] 허용
   *  (이 경우 204보다는 200 + 빈 배열을 권장)
   */

  class GetPageDto extends createZodDto(GetPageSchema) {}
  Object.defineProperty(GetPageDto, 'name', { value: `${name}GetPageDto` });

  class GetDto extends createZodDto(GetSchema) {}
  Object.defineProperty(GetDto, 'name', { value: `${name}GetDto` });

  class NoContentDto extends createZodDto(NoContentSchema) {}
  Object.defineProperty(NoContentDto, 'name', { value: `${name}NoContentDto` });

  return { GetSchema, NoContentSchema, GetDto, NoContentDto, GetPageDto };
}
