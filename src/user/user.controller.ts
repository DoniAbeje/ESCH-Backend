import { JwtAuthGuard } from './../auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from './../auth/guards/local-auth.guard';
import { AuthService } from './../auth/auth.service';
import { UserDocument } from './schemas/user.schema';
import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Get,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '../utils/user.decorator';
import { LoginDto } from './dto/login.dto';
import { PutAuth } from 'src/common/decorators/put-auth.decorator';
import { GetAuth } from 'src/common/decorators/get-auth.decorator';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  @ApiTags('create user')
  @Post('/')
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    const token = await this.authService.signToken(user);
    const userInfo = this.filterUserInfo(user);
    return { token, userInfo };
  }

  @ApiTags('login')
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Body() loginDto: LoginDto, @User() user) {
    const accountInfo = this.filterUserInfo(user);
    const token = await this.authService.signToken(user);
    return { token, accountInfo };
  }

  @PutAuth('/', 'change user info')
  async updateUser(@Body() updateUserDto: UpdateUserDto, @User('id') userId) {
    await this.userService.updateUser(userId, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @GetAuth('/:id', 'get single user detail')
  async getUserDetail(@Param('id') userId: string) {
    const user = await this.userService.findById(userId);
    return this.filterUserInfo(user);
  }

  filterUserInfo(user: UserDocument) {
    const { _id, firstName, lastName, phone } = user;
    return { _id, firstName, lastName, phone };
  }
}
