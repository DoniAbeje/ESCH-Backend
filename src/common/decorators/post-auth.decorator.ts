import { applyDecorators, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
export function PostAuth(route: string, title: string) {
  return applyDecorators(
    ApiTags(title),
    ApiBearerAuth(),
    UseGuards(JwtAuthGuard),
    Post(route),
  );
}
