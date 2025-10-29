import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const IntrinsicOverlaySchema = z.object({
  intrinsicSelectionId: z.number().int().positive(),
  fileName: z.string(),
});

export type IntrinsicOverlayInput = z.infer<typeof IntrinsicOverlaySchema>;

export const IntrinsicOutputSchema = z.object({
  intrinsicRequestId: z.number().int().positive(),
  cameraMatrix: z.array(z.array(z.number())),
  distCoeffs: z.array(z.array(z.number())),
  usedImageCount: z.number().int().positive(),
  meanReprojectionError: z.number(),
  perImageReprojectionError: z.record(z.string(), z.number()),
});

export type IntrinsicOutputInput = z.infer<typeof IntrinsicOutputSchema>;

export const IntrinsicOutputIsFinalSchema = z.object({
  topGuardRid: z.string(),
  intrinsicRequestId: z.number().int().positive(),
  isFinal: z.boolean(),
});

export type IntrinsicOutputIsFinalInput = z.infer<
  typeof IntrinsicOutputIsFinalSchema
>;

export class IntrinsicOutputIsFinalRequestDto {
  @ApiProperty({ type: Number, description: '내부 캡처 결과 ID' })
  intrinsicRequestId: number;

  @ApiProperty({ type: Boolean, description: '최종 결과 여부' })
  isFinal: boolean;
}

/** Date | string | null → ISO string | null 로 정규화 + 문서화는 string(date-time) */
export const ApiDateTime = z
  .preprocess(
    (v) => (v instanceof Date ? v.toISOString() : v),
    z.string().datetime(),
  )
  .nullable();

/** 날짜는 응답 JSON에선 문자열이므로 string(date-time)으로 문서화하는 편이 안전 */
const DbDateTime = ApiDateTime.describe('생성일');

/** ── 1) IntrinsicOverlayResponse ───────────────────────────── */
export const IntrinsicOverlayResponseSchema = z
  .object({
    id: z.number().int().describe('내부 캡처 결과 이미지 ID'),
    intrinsicSelectionId: z
      .number()
      .int()
      .describe('내부 캡처 결과 이미지 캡처 ID'),
    fileName: z.string().nullable().describe('내부 캡처 결과 이미지 경로'),
    createdAt: DbDateTime.describe('생성일'),
  })
  .strict()
  .meta({ id: 'IntrinsicOverlayResponse' });

export class IntrinsicOverlayResponseDto extends createZodDto(
  IntrinsicOverlayResponseSchema,
) {}

/** ── 2) IntrinsicCaptureResponse ───────────────────────────── */
export const IntrinsicCaptureResponseSchema = z
  .object({
    id: z.number().int().describe('내부 캡처 ID'),
    captureRequestId: z.number().int().describe('내부 캡처 요청 ID'),
    fileName: z.string().nullable().describe('내부 캡처 이미지 경로'),
    createdAt: DbDateTime.describe('생성일'),
  })
  .strict()
  .meta({ id: 'IntrinsicCaptureResponse' });

export class IntrinsicCaptureResponseDto extends createZodDto(
  IntrinsicCaptureResponseSchema,
) {}

/** ── 3) CaptureOverlayPairResponse ─────────────────────────── */
export const CaptureOverlayPairResponseSchema = z
  .object({
    intrinsicResultImage:
      IntrinsicOverlayResponseSchema.nullable().describe(
        '내부 캡처 결과 이미지',
      ),
    intrinsicCapture:
      IntrinsicCaptureResponseSchema.nullable().describe(
        '내부 캡처 원본 이미지',
      ),
  })
  .strict()
  .meta({ id: 'CaptureOverlayPairResponse' });

export class CaptureOverlayPairResponseDto extends createZodDto(
  CaptureOverlayPairResponseSchema,
) {}

export const IntrinsicOutputResponseSchema = z.object({
  id: z.number().int(), // serial PK
  intrinsicRequestId: z.number().int(), // not null FK
  cameraMatrix: z.string().nullable(), // text (JSON string)
  distCoeffs: z.string().nullable(), // text (JSON string)
  perImageReprojectionError: z.string().nullable(), // text (JSON string)
  usedImageCount: z.number().int().nullable(), // integer (nullable)
  meanReprojectionError: z.number().nullable(), // real (nullable)
  isFinal: z.boolean().nullable().default(false), // boolean default false (nullable 가능성 대비)
  createdAt: DbDateTime, // timestamptz defaultNow() (nullable 대비)
  captureOverlayPairs: z.array(CaptureOverlayPairResponseSchema),
});

// 기존: captureOverlayPairs 포함
export const IntrinsicOutputWithPairsSchema =
  IntrinsicOutputResponseSchema.meta({
    id: 'IntrinsicOutputResponse_WithPairs',
  });

// 없음: 해당 필드 제거
export const IntrinsicOutputWithoutPairsSchema =
  IntrinsicOutputResponseSchema.omit({ captureOverlayPairs: true }).meta({
    id: 'IntrinsicOutputResponse_WithoutPairs',
  });

// (선택) DTO가 필요하면 고유 이름으로
export class IntrinsicOutputWithPairsDto extends createZodDto(
  IntrinsicOutputWithPairsSchema,
) {}
export class IntrinsicOutputWithoutPairsDto extends createZodDto(
  IntrinsicOutputWithoutPairsSchema,
) {}
