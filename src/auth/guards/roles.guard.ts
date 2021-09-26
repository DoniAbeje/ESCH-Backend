import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../user/schemas/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private requiredRoles: UserRole[]) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return this.requiredRoles.some((role) => user.role == role);
  }
}
