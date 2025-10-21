import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const CreateIntrinsicCaptureSchema = z.object({
  captureRequestId: z.number().int().positive(),
  fileName: z.string(),
});

export type CreateIntrinsicCaptureInput = z.infer<
  typeof CreateIntrinsicCaptureSchema
>;

export const SelectionCaptureSchema = z.object({
  selections: z.array(
    z.object({
      intrinsicCaptureId: z.number().int().positive(),
      isSelected: z.boolean(),
    }),
  ),
});

export type SelectionCaptureInput = z.infer<typeof SelectionCaptureSchema>;

export type CalibrationResult = {
  cameraMatrix: number[][];
  distCoeffs: number[][];
  usedImageCount: number;
  meanReprojectionError: number;
  perImageReprojectionError: {
    [filename: string]: number;
  };
};

export class IntrinsicCaptureResponseDto {
  @ApiProperty({ type: Number, description: '캡처 이미지 ID' })
  id: number;

  @ApiProperty({ type: Number, description: '캡처 요청 ID' })
  captureRequestId: number;

  @ApiProperty({ type: String, description: '캡처 이미지 경로' })
  fileName: string;

  @ApiProperty({ type: Boolean, description: '캡처 이미지 선택 여부' })
  isSelected: boolean;

  @ApiProperty({ type: Date, description: '생성일' })
  createdAt: Date;
}
