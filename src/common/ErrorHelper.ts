// src/common/utils/error-helper.ts

import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  GatewayTimeoutException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';

export class ErrorHelper {
  static handle(error: any): never {
    const isPostgresError = (
      e: any,
    ): e is { cause: { code: string; message: string } } => {
      if (typeof e !== 'object' || e === null) return false;
      const obj = e as Record<string, unknown>;
      if (!('cause' in obj)) return false;
      const cause = obj.cause as Record<string, unknown>;
      return (
        typeof cause === 'object' &&
        cause !== null &&
        'code' in cause &&
        typeof cause.code === 'string'
      );
    };

    if (isPostgresError(error)) {
      const cause = (error as { cause: { code: string; message: string } })
        .cause;
      switch (cause.code) {
        case '23505':
          throw new ConflictException('이미 존재하는 값입니다.');
        case '23503':
          throw new UnprocessableEntityException('존재하지 않는 참조값입니다.');
        case '22P02':
          throw new BadRequestException('잘못된 입력 형식입니다.');
        default:
          throw new InternalServerErrorException(cause.message);
      }
    }

    if (error instanceof NotFoundException) {
      throw error;
    }

    if (typeof error === 'string') {
      throw new BadRequestException(error);
    }

    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : '알 수 없는 오류가 발생했습니다.';

    throw new InternalServerErrorException(message);
  }
}
