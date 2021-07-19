import { Injectable } from '@nestjs/common';

@Injectable()
export class AccountService {
  getHelloFromAccountService(): string {
    return 'Hello World from account service!';
  }
}
