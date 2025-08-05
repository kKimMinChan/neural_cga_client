import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const CreateCaptureRequestSchema = z.object({
  topGuardId: z.number(),
  count: z.number(),
});

export const CaptureRequestToTopGuardSchema = z.object({
  topGuardId: z.number().int().positive(),
  count: z.number().int().positive(),
  streamPath: z.string(),
  ip: z.string(),
});

export enum CaptureRequestStatus {
  Requested = 'requested',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

export type CreateCaptureRequestInput = z.infer<
  typeof CreateCaptureRequestSchema
>;

export type CaptureRequestInput = z.infer<
  typeof CaptureRequestToTopGuardSchema
>;

export class CreateCaptureRequestDto {
  @ApiProperty({ type: Number, description: '캡처 요청 탑가드 ID' })
  topGuardId: number;

  @ApiProperty({ type: Number, description: '캡처 요청 카운트' })
  count: number;
}

export class CaptureRequestToTopGuardDto {
  @ApiProperty({ type: Number, description: '캡처 요청 탑가드 ID' })
  topGuardId: number;

  @ApiProperty({ type: Number, description: '캡처 요청 카운트' })
  count: number;

  @ApiProperty({ type: String, description: '캡처 요청 스트림 경로' })
  streamPath: string;

  @ApiProperty({ type: String, description: '캡처 요청 IP' })
  ip: string;
}

export class CaptureRequestResponseDto {
  @ApiProperty({ type: Number, description: '캡처 요청 ID' })
  id: number;

  @ApiProperty({ type: Number, description: '캡처 요청 탑가드 ID' })
  topGuardId: number;

  @ApiProperty({ type: Number, description: '캡처 요청 카운트' })
  count: number;

  @ApiProperty({ type: String, description: '캡처 요청 상태' })
  status: CaptureRequestStatus;

  @ApiProperty({ type: String, description: '캡처 요청 오류 메시지' })
  errorMessage: string;

  @ApiProperty({ type: Date, description: '생성일' })
  createdAt: Date;
}
