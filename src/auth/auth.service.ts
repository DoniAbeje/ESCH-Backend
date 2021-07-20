import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private accountService: UserService,
    private jwtService: JwtService,
  ) {}

  async authenticate(phone: string, password: string) {
    const account = await this.accountService.findByPhone(phone);
    const valid = await bcrypt.compare(password, account.password);

    if (valid) {
      return account;
    }
    return null;
  }

  async signToken(user: UserDocument) {
    const payload = { phone: user.phone, id: user._id };
    return {
      token: this.jwtService.sign(payload),
    };
  }
}
