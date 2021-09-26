import { applyDecorators, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../user/schemas/user.schema';
export function PutAuth(route: string, title: string, roles: UserRole[] = null) {
  return applyDecorators(
    ApiTags(title),
    ApiBearerAuth(),
    roles == null
      ? UseGuards(JwtAuthGuard)
      : UseGuards(JwtAuthGuard, new RolesGuard(roles)),
    Put(route),
  );
}
