import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const CreateExtrinsicCapturePairSchema = z.object({
  extrinsicCaptureRequestId: z.number().int().positive(),
  bmpName: z.string(),
  pcdName: z.string(),
});

export type CreateExtrinsicCapturePairInput = z.infer<
  typeof CreateExtrinsicCapturePairSchema
>;

export class ExtrinsicCapturePairResponseDto {
  @ApiProperty({ type: Number, description: '캡처 요청 ID', example: 1 })
  id: number;

  @ApiProperty({ type: Number, description: '캡처 요청 ID', example: 1 })
  extrinsicCaptureRequestId: number;

  @ApiProperty({
    type: String,
    description: 'BMP 이미지 경로',
    example: 'bmp.bmp',
  })
  bmpPath: string;

  @ApiProperty({
    type: String,
    description: 'PCD 이미지 경로',
    example: 'pcd.pcd',
  })
  pcdPath: string;

  @ApiProperty({ type: Date, description: '생성일', example: new Date() })
  createdAt: Date;
}
