import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { PaginationOption } from '../pagination-option';

export const Pagination = createParamDecorator(
  (data: string, ctx: ExecutionContext): PaginationOption => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request<{}, {}, {}, QueryParams>>();

    const { offset, limit } = request.query;
    const _offset = Math.max(0, parseInt(offset)) || 0;
    const _limit = Math.max(0, parseInt(limit)) || 15;

    return { offset: _offset, limit: _limit };
  },
);

interface QueryParams {
  offset: string;
  limit: string;
}
