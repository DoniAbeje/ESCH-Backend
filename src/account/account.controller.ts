import { Controller, Get } from '@nestjs/common';
import { AccountService } from './account.service';

@Controller('accounts')
export class AccountController {
  constructor(private accountService: AccountService) {}

  @Get()
  getHello(): string {
    return this.accountService.getHelloFromAccountService();
  }
}
