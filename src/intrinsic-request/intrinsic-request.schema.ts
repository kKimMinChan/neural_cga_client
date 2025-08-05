import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const IntrinsicSelectionsSchema = z.object({
  topGuardId: z.number().int().positive(),
  selections: z.array(
    z.object({
      intrinsicCaptureId: z.number().int().positive(),
      isSelected: z.boolean(),
    }),
  ),
});

export const CreateIntrinsicRequestSchema = z.object({
  topGuardId: z.number().int().positive(),
  selections: z.array(z.number().int().positive()),
});

export type CreateIntrinsicRequestInput = z.infer<
  typeof CreateIntrinsicRequestSchema
>;

export type IntrinsicSelections = z.infer<typeof IntrinsicSelectionsSchema>;

export enum IntrinsicRequestStatus {
  Requested = 'requested',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

export type CalibrationResult = {
  cameraMatrix: number[][];
  distCoeffs: number[][];
  usedImageCount: number;
  meanReprojectionError: number;
  perImageReprojectionError: {
    [filename: string]: number;
  };
};

class SelectionDto {
  @ApiProperty({ type: Number, description: 'intrinsicCaptureId' })
  intrinsicCaptureId: number;

  @ApiProperty({ type: Boolean, description: '선택 여부' })
  isSelected: boolean;
}

export class IntrinsicSelectionsDto {
  @ApiProperty({ type: Number, description: '탑가드 ID' })
  topGuardId: number;

  @ApiProperty({
    type: [SelectionDto],
    description: '선택된 intrinsic capture 목록',
  })
  selections: SelectionDto[];
}

export class IntrinsicRequestResponseDto {
  @ApiProperty({ type: Number, description: '내부 캡처 요청 ID' })
  id: number;

  @ApiProperty({ type: Number, description: '탑가드 ID' })
  topGuardId: number;

  @ApiProperty({
    type: [SelectionDto],
    description: '선택된 intrinsic capture 목록',
  })
  selections: SelectionDto[];

  @ApiProperty({ type: String, description: '상태' })
  status: IntrinsicRequestStatus;

  @ApiProperty({ type: String, description: '오류 메시지' })
  errorMessage: string;

  @ApiProperty({ type: Date, description: '생성일' })
  createdAt: Date;
}
