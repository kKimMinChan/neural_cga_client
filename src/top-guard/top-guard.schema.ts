import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const BaseTopGuardSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  mac: z.string(),
  webRtcUrl: z.string().optional(),
  projectId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const UpdateTopGuardSchema = BaseTopGuardSchema.pick({
  id: true,
  webRtcUrl: true,
  name: true,
});

export class UpdateTopGuardDto extends createZodDto(UpdateTopGuardSchema) {}

export const CreateTopGuardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  mac: z.string().min(17, 'Mac is required').max(100),
  webRtcUrl: z.string().min(1, 'WebRTC URL is required').max(100),
  projectId: z.number(),
});

// export const UpdateTopGuardSchema = z.object({
//   name: z.string().min(2, 'Name is required').max(100),
// });

export enum StageEnum {
  Created = 'created',
  Captured = 'captured',
  Submitted = 'submitted',
  ResultReceived = 'result_received',
  Finalized = 'finalized',
}

export const UpdateIntrinsicStageSchema = z.object({
  topGuardId: z.number(),
  intrinsicStage: z.nativeEnum(StageEnum),
});

export type UpdateIntrinsicStageInput = z.infer<
  typeof UpdateIntrinsicStageSchema
>;

export type CreateTopGuardInput = z.infer<typeof CreateTopGuardSchema>;

// export type UpdateTopGuardInput = z.infer<typeof UpdateTopGuardSchema>;

export class CreateTopGuardDto {
  @ApiProperty({ type: String, description: '탑가드 이름' })
  name: string;

  @ApiProperty({ type: String, description: '탑가드 MAC 주소' })
  mac: string;

  @ApiProperty({ type: String, description: '탑가드 WebRTC URL' })
  webRtcUrl: string;

  @ApiProperty({ type: Number, description: '프로젝트 ID' })
  projectId: number;
}

export class BaseTopGuardDto {
  @ApiProperty({ type: Number, description: '탑가드 ID' })
  id: number;

  @ApiProperty({ type: String, description: '탑가드 이름' })
  name: string;

  @ApiProperty({ type: String, description: '탑가드 MAC 주소' })
  mac: string;

  @ApiProperty({ type: String, description: '탑가드 WebRTC URL' })
  webRtcUrl: string;

  @ApiProperty({ type: Number, description: '프로젝트 ID' })
  projectId: number;

  @ApiProperty({ type: String, description: '탑가드 내부 스테이지' })
  intrinsicStage: StageEnum;

  @ApiProperty({ type: String, description: '탑가드 외부 스테이지' })
  extrinsicStage: StageEnum;

  @ApiProperty({ type: Date, description: '생성일' })
  createdAt: Date;

  @ApiProperty({ type: Date, description: '수정일' })
  updatedAt: Date;
}
