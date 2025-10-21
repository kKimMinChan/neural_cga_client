import { getSchemaPath } from '@nestjs/swagger';

export class SwaggerHelper {
  static getApiResponseSchema(
    dto?: any,
    description = '',
    pagination = false,
    isGet = false,
  ) {
    const paginationProperties = pagination
      ? {
          totalCount: {
            type: 'number',
            description: '총 아이템 수',
            example: 15,
          },
          totalPages: {
            type: 'number',
            description: '총 페이지 수',
            example: 2,
          },
          page: {
            type: 'number',
            description: '현재 페이지',
            example: 1,
          },
          pageSize: {
            type: 'number',
            description: '페이지 내 아이템 수',
            example: 10,
          },
        }
      : {};
    return {
      description,
      schema: {
        type: 'object',
        properties: {
          statusCode: {
            type: 'number',
            description: 'HTTP 상태 코드',
            example: isGet ? 200 : 204,
          },
          message: {
            type: 'string',
            description: '응답 메시지',
            example: isGet ? 'Ok' : 'No Content',
          },
          result: {
            type: 'boolean',
            description: 'api 성공 여부',
            example: true,
          },
          translate: {
            type: 'string',
            description: '추가 설명',
            example: '요청이 성공적으로 처리되었습니다.',
          },
          ...paginationProperties,
          data: dto
            ? { type: 'array', items: { $ref: getSchemaPath(dto) } }
            : '',
        },
      },
    };
  }
}
