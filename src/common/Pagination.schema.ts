import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const PaginationSchema = z
  .object({
    limit: z.coerce.number().optional().default(10),
    page: z.coerce.number().optional().default(1),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  })
  .strict()
  .meta({ id: 'Pagination' });

export type PaginationInput = z.infer<typeof PaginationSchema>;
export class PaginationDto extends createZodDto(PaginationSchema) {}
