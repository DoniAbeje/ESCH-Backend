import { applyDecorators, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
export function GetAuth(route: string, title: string) {
  return applyDecorators(
    ApiTags(title),
    ApiBearerAuth(),
    UseGuards(JwtAuthGuard),
    Get(route),
  );
}
