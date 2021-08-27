import { applyDecorators, Get } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
export function ApiPagination(route: string, title: string) {
  return applyDecorators(
    ApiQuery({ name: 'limit', type: Number, required: false }),
    ApiQuery({ name: 'offset', type: Number, required: false }),
    ApiTags(title),
    Get(route)
  );
}
