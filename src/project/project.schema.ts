import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const BaseProjectSchema = z.object({
  rid: z.string(),
  name: z.string().describe('프로젝트 이름'),
  topGuardCount: z.number(),
  nameVer: z.number(),
  createdAt: z.date(),
  updatedAt: z.string(),
  createdBy: z.number().int().positive().nullable(),
  companyId: z.number().int().positive().nullable(),
});

export const CreateProjectSchema = BaseProjectSchema.pick({
  name: true,
  // createdBy: true,
  // companyId: true,
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export const ProjectSchema = BaseProjectSchema;

export class CreateProjectDto {
  @ApiProperty({ type: String, description: '프로젝트 이름' })
  name: string;
}

export class BaseProjectDto {
  @ApiProperty({ type: Number, description: '프로젝트 ID' })
  rid: string;

  @ApiProperty({ type: String, description: '프로젝트 이름' })
  name: string;

  @ApiProperty({ type: Number, description: '프로젝트 탑가드 수' })
  topGuardCount: number;

  @ApiProperty({ type: Date, description: '생성일' })
  createdAt: Date;

  @ApiProperty({ type: Date, description: '수정일' })
  updatedAt: string;
}
