import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import * as faker from 'faker';
import { UserDocument, User } from './schemas/user.schema';

@Injectable()
export class UserTestHelperService {
  constructor(
    @InjectModel(User.name) public userModel: Model<UserDocument>,
    private userService: UserService,
  ) {}

  generateCreateUserDto(override: Partial<CreateUserDto> = {}): CreateUserDto {
    const _default: CreateUserDto = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      phone: '0987654321',
      password: 'password',
      profilePicture:
        'https://www.gravatar.com/avatar/7d1caf9df777b3b2cf474ff743494335?s=64&d=identicon&r=PG',
    };
    return { ..._default, ...override };
  }

  async createTestUser(createUserDto: CreateUserDto = null) {
    return await this.userService.createUser(
      createUserDto || this.generateCreateUserDto(),
    );
  }

  async clearUsersData() {
    await this.userModel.deleteMany({});
  }
}
