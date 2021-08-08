import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
export function ApiPagination() {
  return applyDecorators(
    ApiQuery({ name: 'limit', type: Number, required: false }),
    ApiQuery({ name: 'offset', type: Number, required: false }),
  );
}
