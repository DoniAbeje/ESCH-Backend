import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async authenticate(phone: string, password: string) {
    const user = await this.userService.existsByPhone(phone);
    const valid = await bcrypt.compare(password, user.password);

    if (valid) {
      return user;
    }
    return null;
  }

  async signToken(user: UserDocument) {
    const payload = { phone: user.phone, id: user._id, role: user.role };
    return this.jwtService.sign(payload);
  }
}
