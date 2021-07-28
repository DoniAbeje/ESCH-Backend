import { applyDecorators, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
export function PutAuth(route: string, title: string) {
  return applyDecorators(
    ApiTags(title),
    ApiBearerAuth(),
    UseGuards(JwtAuthGuard),
    Put(route),
  );
}
