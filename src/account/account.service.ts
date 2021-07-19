import { Injectable } from '@nestjs/common';
import { Account, AccountDocument } from './schemas/account.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateAccountDto } from './dto/create-account.dto';
import { PhoneTakenException } from './exceptions/phone-taken.exception';
import * as bcrypt from 'bcrypt';
import { AccountDoesNotExistException } from './exceptions/account-doesnot-exist.exception';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name) public accountModel: Model<AccountDocument>,
  ) {}

  async createAccount(createAccountDto: CreateAccountDto) {
    const phoneTaken = await this.existsByPhone(createAccountDto.phone);
    if (phoneTaken) {
      throw new PhoneTakenException();
    }
    const passwordHash = await this.hashPassword(createAccountDto.password);
    createAccountDto = { ...createAccountDto, password: passwordHash };

    const account = await new this.accountModel(createAccountDto).save();

    return account;
  }

  async existsByPhone(phone: string): Promise<boolean> {
    return this.accountModel.exists({ phone });
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async findByPhone(phone: string) {
    const account = await this.accountModel.findOne({ phone });
    if (!account) {
      throw new AccountDoesNotExistException(
        `no account with phone '${phone}' exists`,
      );
    }
    return account;
  }

  async updateAccount(
    id: string,
    updateAccountDto: UpdateAccountDto,
  ): Promise<boolean> {
    const account = await this.findById(id);
    account.set(updateAccountDto);
    await account.save();
    return true;
  }

  async findById(id: string) {
    const account = await this.accountModel.findById(id);
    if (!account) {
      throw new AccountDoesNotExistException(
        `no account with id '${id}' exists`,
      );
    }
    return account;
  }
}
