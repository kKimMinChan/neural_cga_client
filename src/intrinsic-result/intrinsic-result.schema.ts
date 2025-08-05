import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const IntrinsicResultSchema = z.object({
  intrinsicRequestId: z.number().int().positive(),
  cameraMatrix: z.array(z.array(z.number())),
  distCoeffs: z.array(z.array(z.number())),
  usedImageCount: z.number().int().positive(),
  meanReprojectionError: z.number(),
  perImageReprojectionError: z.record(z.string(), z.number()),
  resultImageFolder: z.string(),
});

export type IntrinsicResultInput = z.infer<typeof IntrinsicResultSchema>;

export class IntrinsicResultResponseDto {
  @ApiProperty({ type: Number, description: '내부 캡처 결과 ID' })
  id: number;

  @ApiProperty({ type: Number, description: '내부 캡처 요청 ID' })
  intrinsicRequestId: number;

  @ApiProperty({ type: [Number], description: '카메라 행렬' })
  cameraMatrix: number[][];

  @ApiProperty({ type: [Number], description: '왜곡 계수' })
  distCoeffs: number[][];

  @ApiProperty({ type: Number, description: '사용된 이미지 수' })
  usedImageCount: number;

  @ApiProperty({ type: Number, description: '평균 재투영 오차' })
  meanReprojectionError: number;

  @ApiProperty({
    type: Object,
    description: '이미지별 재투영 오차',
  })
  perImageReprojectionError: Record<string, number>;

  @ApiProperty({ type: String, description: '결과 이미지 폴더' })
  resultImageFolder: string;

  @ApiProperty({ type: Boolean, description: '최종 결과 여부' })
  isFinal: boolean;

  @ApiProperty({ type: Date, description: '생성일' })
  createdAt: Date;
}
