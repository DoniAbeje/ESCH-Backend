import { UserDocument } from './schemas/user.schema';
import { Controller, Post, Body, Put, Param, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiTags('create user')
  @Post('/')
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    const userInfo = this.filterUserInfo(user);
    return userInfo;
  }

  @ApiTags('change user info')
  @Put('/:id')
  async updateUser(@Body() updateUserDto: UpdateUserDto, @Param('id') userId) {
    await this.userService.updateUser(userId, updateUserDto);
    return 'user updated';
  }

  @ApiTags('get single user detail')
  @Get('/:id')
  async getUserDetail(@Param('id') userId: string) {
    const user = await this.userService.findById(userId);
    return this.filterUserInfo(user);
  }

  filterUserInfo(user: UserDocument) {
    const { _id, firstName, lastName, phone } = user;
    return { _id, firstName, lastName, phone };
  }
}
