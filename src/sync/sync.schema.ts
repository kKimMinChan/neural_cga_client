import { createZodDto } from 'nestjs-zod';
import {
  IntrinsicManifestSchema,
  IntrinsicValueSchema,
} from 'src/intrinsic-output/intrinsic-output.schema';
import { z } from 'zod';

export const ProjectPostSchema = z
  .object({
    rid: z.string(),
    companyId: z.number().int().positive().nullable(),
    name: z.string().min(1),
    nameVer: z.number().int().min(0),
    createdBy: z.number().int().positive().nullable(),
    description: z.string().optional(),
    updatedAt: z.string(),
  })
  .partial();

export enum StageEnum {
  Created = 'created',
  Captured = 'captured',
  Submitted = 'submitted',
  ResultReceived = 'result_received',
  Finalized = 'finalized',
}

export const PrecondsPostSchema = z
  .object({
    nameVer: z.number().int().min(0),
    intrinsicStageVer: z.number().int().min(0),
    extrinsicStageVer: z.number().int().min(0),
  })
  .partial();

export const TopGuardPostSchema = z
  .object({
    rid: z.string(),
    projectRid: z.string(),
    name: z.string().min(1),
    nameVer: z.number().int().min(0),
    intrinsicStage: z.nativeEnum(StageEnum),
    intrinsicStageVer: z.number().int().min(0),
    extrinsicStage: z.nativeEnum(StageEnum),
    extrinsicStageVer: z.number().int().min(0),
    createdBy: z.number().int().positive().nullable(),
    updatedAt: z.string(),
  })
  .partial();

export enum OutboxType {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

export const TopGuardPrecondsPostSchema = z.object({
  // preconds: PrecondsPostSchema,
  patch: TopGuardPostSchema,
  // type: z.nativeEnum(OutboxType),
});

export const ProjectPrecondsPostSchema = z.object({
  // preconds: PrecondsPostSchema,
  patch: ProjectPostSchema,
  // type: z.nativeEnum(OutboxType),
});

export const SyncPostSchema = z.object({
  projects: z.array(ProjectPrecondsPostSchema).default([]),
  topGuards: z.array(TopGuardPrecondsPostSchema).default([]),
});
export class SyncPostDto extends createZodDto(SyncPostSchema) {}

export enum OutboxStatus {
  Pending = 'pending',
  Done = 'done',
  Superseded = 'superseded',
  Failed = 'failed',
}

export const OutboxSchema = z.object({
  opId: z.string(),
  entity: z.string(),
  rid: z.string(),
  patch: z.string(),
  updatedAt: z.string().datetime(),
  status: z.nativeEnum(OutboxStatus),
  retryCount: z.number().int().positive(),
});
export class OutboxDto extends createZodDto(OutboxSchema) {}
export type Outbox = z.infer<typeof OutboxSchema>;

export const UserSchema = z
  .object({
    createdBy: z.number().int().positive(),
    companyId: z.number().int().positive(),
  })
  .partial();

export class UserDto extends createZodDto(UserSchema) {}
export type User = z.infer<typeof UserSchema>;

export interface PatchResult {
  opId: string;
  applied: Record<string, { value: any; ver: number | null }>;
  conflicts: Record<string, { current: { value: any; ver: number | null } }>;
  finalRow: any;
}

export const UpsertProjectSchema = z.object({
  rid: z.string(),
  companyId: z.number().int().positive(),
  name: z.string().min(1),
  nameVer: z.number().int().min(0),
  createdBy: z.number().int().positive(),
  // updatedAt: z.string(),
});
export class UpsertProjectDto extends createZodDto(UpsertProjectSchema) {}
export type UpsertProject = z.infer<typeof UpsertProjectSchema>;

export const UpsertTopGuardSchema = z.object({
  rid: z.string(),
  projectRid: z.string(),
  name: z.string().min(1),
  nameVer: z.number().int().min(0),
  intrinsicStage: z.nativeEnum(StageEnum),
  intrinsicStageVer: z.number().int().min(0),
  extrinsicStage: z.nativeEnum(StageEnum),
  extrinsicStageVer: z.number().int().min(0),
  // updatedAt: z.string(),
});
export class UpsertTopGuardDto extends createZodDto(UpsertTopGuardSchema) {}
export type UpsertTopGuard = z.infer<typeof UpsertTopGuardSchema>;
