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
  UnauthorizedException, // ✅ 추가
} from '@nestjs/common';
import { AxiosError } from 'axios';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function extractMessage(m: unknown): string {
  // 문자열 배열 → 조인
  if (Array.isArray(m)) return m.map(String).join('; ');
  // 문자열 그대로
  if (typeof m === 'string') return m;

  // 객체에 message 키가 있고, 그 값이 string 또는 string[] 인 경우만 반환
  if (isRecord(m) && 'message' in m) {
    const msg = m.message;

    if (typeof msg === 'string') return msg;

    if (Array.isArray(msg)) {
      // message가 배열일 때도 안전 처리
      return msg.map(String).join('; ');
    }
  }

  return '요청 처리 중 오류가 발생했습니다.';
}

export class ErrorHelper {
  static handle(error: any): never {
    // 1) Axios 에러 매핑 (가장 먼저!)
    if (error?.isAxiosError) {
      const e = error as AxiosError<any>;
      const status = e.response?.status ?? 500;
      console.log('status', status);
      console.log('e.response?.data?.message', e.response?.data.translate);
      console.log('e.message', e.message);
      const msg = extractMessage(e.response?.data.translate ?? e.message);

      switch (status) {
        case 400:
          throw new BadRequestException(msg);
        case 401:
          throw new UnauthorizedException(msg);
        case 404:
          throw new NotFoundException(msg);
        case 409:
          throw new ConflictException(msg);
        case 422:
          throw new UnprocessableEntityException(msg);
        default:
          throw new InternalServerErrorException(msg);
      }
    }

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
        typeof (cause as any).code === 'string'
      );
    };

    // ✅ JWT 에러를 401로 매핑
    const isJwtError =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error.name === 'TokenExpiredError' ||
        error.name === 'JsonWebTokenError' ||
        error.name === 'NotBeforeError');

    if (isJwtError) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('토큰이 만료되었습니다.');
      }
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    // ✅ Nest 예외는 그대로 통과 (401 포함)
    if (error instanceof HttpException) {
      throw error;
    }

    // ✅ 외부 라이브러리/프록시 등이 {status|statusCode:401}만 던지는 경우 매핑
    const statusLike =
      (typeof error?.status === 'number' && error.status) ||
      (typeof error?.statusCode === 'number' && error.statusCode);

    if (statusLike === HttpStatus.UNAUTHORIZED) {
      const msg =
        (typeof error === 'object' &&
          error &&
          'message' in error &&
          error.message) ||
        '인증이 필요합니다.';
      throw new UnauthorizedException(msg);
    }

    // ✅ Postgres 에러 코드 매핑
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

    // 기존 처리 유지
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
