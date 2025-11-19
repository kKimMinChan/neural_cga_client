import z from 'zod';
import { RequestStatus } from 'src/common/type/request-status';
import { ApiProperty } from '@nestjs/swagger';

export const ExtrinsicCaptureRequestInput = z.object({
  topGuardRid: z.string(),
  topGuardBaseUrl: z.string().default('default'),
  mode: z.enum(['short', 'long']),
  warmup_ms: z.number().optional(),
});

export type ExtrinsicCaptureRequestInput = z.infer<
  typeof ExtrinsicCaptureRequestInput
>;

export const CreateExtrinsicCaptureRequestInput = z.object({
  topGuardRid: z.string(),
  mode: z.enum(['short', 'long']),
});

export type CreateExtrinsicCaptureRequestInput = z.infer<
  typeof CreateExtrinsicCaptureRequestInput
>;

export const UpdateExtrinsicCaptureRequestInput = z.object({
  id: z.number(),
  status: z.nativeEnum(RequestStatus),
  errorMessage: z.string().optional(),
});

export type UpdateExtrinsicCaptureRequestInput = z.infer<
  typeof UpdateExtrinsicCaptureRequestInput
>;

export class ExtrinsicCaptureRequestDto {
  @ApiProperty({
    type: String,
    description: '탑 가드 RID',
    example: '1',
  })
  topGuardRid: string;

  @ApiProperty({
    type: String,
    description: '탑 가드 기본 URL',
    example: 'http://192.168.0.201:4100',
  })
  topGuardBaseUrl: string;

  @ApiProperty({ type: String, description: '모드', example: 'short' })
  mode: 'short' | 'long';
}

export class ExtrinsicCaptureRequestResponseDto {
  @ApiProperty({ type: Number, description: '캡처 요청 ID', example: 1 })
  id: number;

  @ApiProperty({ type: Number, description: '탑 가드 ID', example: '1' })
  topGuardRid: string;

  @ApiProperty({ type: String, description: '모드', example: 'short' })
  mode: 'short' | 'long';

  @ApiProperty({
    type: String,
    description: '상태',
    example: RequestStatus.Requested,
  })
  status: RequestStatus;

  @ApiProperty({
    type: String,
    description: '오류 메시지',
    example: '오류 메시지',
  })
  errorMessage: string;

  @ApiProperty({ type: Date, description: '생성일', example: new Date() })
  createdAt: Date;
}
