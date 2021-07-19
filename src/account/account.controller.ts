import { AccountDocument } from './schemas/account.schema';
import { Controller, Post, Body, Put, Param, Get } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountController {
  constructor(private accountService: AccountService) {}

  @ApiTags('create account')
  @Post('/')
  async createAccount(@Body() createAccountDto: CreateAccountDto) {
    const account = await this.accountService.createAccount(createAccountDto);
    const accountInfo = this.filterAccountInfo(account);
    return accountInfo;
  }

  @ApiTags('change account info')
  @Put('/:id')
  async updateAccount(
    @Body() updateAccountDto: UpdateAccountDto,
    @Param('id') accountId,
  ) {
    await this.accountService.updateAccount(accountId, updateAccountDto);
    return 'account updated';
  }

  @ApiTags('get single account detail')
  @Get('/:id')
  async getAccountDetail(@Param('id') accountId: string) {
    const account = await this.accountService.findById(accountId);
    return this.filterAccountInfo(account);
  }

  filterAccountInfo(account: AccountDocument) {
    const { _id, firstName, lastName, phone } = account;
    return { _id, firstName, lastName, phone };
  }
}
