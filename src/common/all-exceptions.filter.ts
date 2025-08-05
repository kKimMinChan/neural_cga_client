import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

const ERROR_MESSAGES: Record<number, { message: string; translate: string }> = {
  400: {
    message: 'Bad Request',
    translate: '잘못된 요청(잘못된 쿼리 매개변수)입니다.',
  },
  401: {
    message: 'Unauthorized',
    translate: '인증정보가 없는 사용자의 요청입니다.',
  },
  403: {
    message: 'Forbidden',
    translate: '접근권한이 없는 사용자의 요청입니다.',
  },
  404: {
    message: 'Not Found',
    translate: '요청한 리소스를 찾을 수 없습니다.',
  },
  409: {
    message: 'Conflict',
    translate: '리소스가 이미 존재하여 충돌이 발생했습니다.',
  },
  500: {
    message: 'Internal Server Error',
    translate: '서버에서 오류가 발생했습니다.',
  },
  504: {
    message: 'Gateway Timeout',
    translate:
      '서버에서 외부 시스템(RasPi 등)의 응답을 기다리던 중 시간이 초과되었습니다.',
  },
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const method = request.method;
    let cause;

    // console.log(exception, 'asefsefs');

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const result = status >= 200 && status < 400;

    // 상태 코드에 따른 기본 메시지 설정
    const { message: defaultMessage, translate: defaultTranslate } =
      ERROR_MESSAGES[status] || {
        message: 'Internal Server Error',
        translate: '서버에서 오류가 발생했습니다.',
      };

    // 예외 객체에서 직접 던진 translate와 message 확인
    let customMessage: string | undefined;
    let customTranslate: string | undefined;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      customTranslate = (response as any)?.message ?? response;
    }
    // 직접 던진 message와 translate가 있으면 우선 사용하고, 없으면 기본 메시지 사용
    const finalMessage = customMessage || defaultMessage;
    const finalTranslate = customTranslate || defaultTranslate;

    console.log(exception);

    response.status(status).json({
      statusCode: status,
      result,
      message: finalMessage,
      translate: finalTranslate,
    });
  }
}
