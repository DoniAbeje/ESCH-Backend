import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserDoesNotExistException } from '../../user/exceptions/user-doesnot-exist.exception';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'phone' });
  }

  async validate(phone: string, password: string): Promise<any> {
    let user;
    try {
      user = await this.authService.authenticate(phone, password);
    } catch (error) {
      if (error instanceof UserDoesNotExistException) {
        throw new UnauthorizedException();
      }
      throw error;
    }
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
