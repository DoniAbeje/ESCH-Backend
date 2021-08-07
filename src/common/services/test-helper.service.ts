import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import { UserService } from '../../user/user.service';
import * as faker from 'faker';
import { UserDocument, User } from '../../user/schemas/user.schema';

@Injectable()
export class TestHelperService  {
  constructor(
      @InjectModel(User.name) public userModel: Model<UserDocument>,
    private userService: UserService,
  ) {}

  generateCreateUserDto(override: Partial<CreateUserDto>= {}): CreateUserDto{
    const _default: CreateUserDto = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        phone: '0987654321',
        password: 'password'
    }
    return { ..._default, ...override}
  }

  async createTestUser() {
      return await this.userService.createUser(this.generateCreateUserDto())
  }

  async clearUsersData() {
      await this.userModel.deleteMany({});
  }
}
