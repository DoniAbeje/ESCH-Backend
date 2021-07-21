import { Injectable } from '@nestjs/common';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { PhoneTakenException } from './exceptions/phone-taken.exception';
import * as bcrypt from 'bcrypt';
import { UserDoesNotExistException } from './exceptions/user-doesnot-exist.exception';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) public userModel: Model<UserDocument>) {}

  async createUser(createUserDto: CreateUserDto) {
    const phoneTaken = await this.existsByPhone(createUserDto.phone);
    if (phoneTaken) {
      throw new PhoneTakenException();
    }
    const passwordHash = await this.hashPassword(createUserDto.password);
    createUserDto = { ...createUserDto, password: passwordHash };

    const user = await new this.userModel(createUserDto).save();

    return user;
  }

  async existsByPhone(phone: string): Promise<boolean> {
    return this.userModel.exists({ phone });
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async findByPhone(phone: string) {
    const user = await this.userModel.findOne({ phone });
    if (!user) {
      throw new UserDoesNotExistException(
        `no user with phone '${phone}' exists`,
      );
    }
    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<boolean> {
    const user = await this.findById(id);
    user.set(updateUserDto);
    await user.save();
    return true;
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new UserDoesNotExistException(`no user with id '${id}' exists`);
    }
    return user;
  }
}
