import { ApiProperty } from '@nestjs/swagger';
import { RequestStatus } from 'src/common/type/request-status';
import { z } from 'zod';

export const IntrinsicSelectionsSchema = z.object({
  topGuardRid: z.string(),
  intrinsicCaptureIds: z.array(z.number().int().positive()),
  boardCols: z.number().int().positive(),
  boardRows: z.number().int().positive(),
  inputType: z.enum(['squares', 'corners']),
});

export const CreateIntrinsicSelectionsSchema = z.object({
  intrinsicCaptureId: z.number().int().positive(),
  intrinsicRequestId: z.number().int().positive(),
});

export type CreateIntrinsicSelectionsInput = z.infer<
  typeof CreateIntrinsicSelectionsSchema
>;

export const CreateIntrinsicRequestSchema = z.object({
  topGuardRid: z.string(),
});

export type CreateIntrinsicRequestInput = z.infer<
  typeof CreateIntrinsicRequestSchema
>;

export type IntrinsicSelections = z.infer<typeof IntrinsicSelectionsSchema>;

export type CalibrationResult = {
  cameraMatrix: number[][];
  distCoeffs: number[][];
  usedImageCount: number;
  meanReprojectionError: number;
  perImageReprojectionError: {
    [filename: string]: number;
  };
  resultImageInfos: {
    id: number;
    path: string;
  }[];
};

export class IntrinsicSelectionsDto {
  @ApiProperty({ type: String, description: '탑가드 RID' })
  topGuardRid: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'number' },
    description: '선택된 intrinsic capture 목록',
  })
  intrinsicCaptureIds: number[];

  @ApiProperty({
    type: Number,
    description: '체커보드 가로 칸 수 (정사각형 기준)',
  })
  boardCols: number;

  @ApiProperty({
    type: Number,
    description: '체커보드 세로 칸 수 (정사각형 기준)',
  })
  boardRows: number;

  @ApiProperty({
    type: String,
    description: '전달 값의 기준',
    enum: ['squares', 'corners'],
  })
  inputType: 'squares' | 'corners';
}

export class IntrinsicRequestResponseDto {
  @ApiProperty({ type: Number, description: '내부 캡처 요청 ID' })
  id: number;

  @ApiProperty({ type: String, description: '탑가드 RID' })
  topGuardRid: string;

  @ApiProperty({ type: String, description: '상태' })
  status: RequestStatus;

  @ApiProperty({ type: String, description: '오류 메시지' })
  errorMessage: string;

  @ApiProperty({ type: String, description: '생성일' })
  createdAt: string;
}
