import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private schema: ZodType<T>) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const formatted = result.error.issues.map(
        (error) => `${error.path.join('.')}: ${error.message}`,
      );
      console.error(result.error.issues);
      throw new BadRequestException(
        `Validation failed: ${formatted.join(', ')}`,
        `Input data: ${JSON.stringify(value)}`,
      );
    }

    return result.data;
  }
}
