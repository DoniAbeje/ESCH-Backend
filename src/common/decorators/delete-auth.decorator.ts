import { applyDecorators, Delete, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
export function DeleteAuth(route: string, title: string) {
  return applyDecorators(
    ApiTags(title),
    ApiBearerAuth(),
    UseGuards(JwtAuthGuard),
    Delete(route),
  );
}
