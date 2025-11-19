import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const BaseUploadRequestSchema = z.object({
  id: z.number().int().positive(),
  topGuardRid: z.string(),
  type: z.enum(['INTRINSIC', 'EXTRINSIC']),
  status: z.enum(['UPLOADING', 'FINALIZING', 'COMPLETED', 'FAILED', 'EXPIRED']),
  createdAt: z.string().datetime(),
  finalizedAt: z.string().datetime(),
  errorCode: z.string(),
  errorMessage: z.string(),
});

export class BaseUploadRequestDto extends createZodDto(
  BaseUploadRequestSchema,
) {}
export type BaseUploadRequest = z.infer<typeof BaseUploadRequestSchema>;

export const CreateUploadRequestSchema = BaseUploadRequestSchema.pick({
  topGuardRid: true,
  type: true,
}).extend({
  idempotencyKey: z.string().min(32).max(80),
  intrinsicRequestId: z.number().int().positive(),
  isFinal: z.boolean(),
});

export class CreateUploadRequestDto extends createZodDto(
  CreateUploadRequestSchema,
) {}
export type CreateUploadRequest = z.infer<typeof CreateUploadRequestSchema>;
