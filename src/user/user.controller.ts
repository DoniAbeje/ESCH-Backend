import { LocalAuthGuard } from './../auth/guards/local-auth.guard';
import { AuthService } from './../auth/auth.service';
import { UserDocument } from './schemas/user.schema';
import { Controller, Post, Body, Param, UseGuards, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { User } from '../common/decorators/user.decorator';
import { LoginDto } from './dto/login.dto';
import { PutAuth } from '../common/decorators/put-auth.decorator';
import { GetAuth } from '../common/decorators/get-auth.decorator';
import { ApiPagination } from '../common/decorators/api-pagination.decorator';
import { Pagination } from '../common/decorators/pagination.decorator';
import { PaginationOption } from '../common/pagination-option';
import { PostAuth } from '../common/decorators/post-auth.decorator';
import { RateDto } from '../common/dto/rate.dto';
import { CancelRateDto } from '../common/dto/cancel-rate.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  @ApiTags('Create user')
  @Post('/')
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    const token = await this.authService.signToken(user);
    const accountInfo = this.filterUserInfo(user);
    return { token, accountInfo };
  }

  @ApiTags('Login')
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Body() loginDto: LoginDto, @User() user) {
    const accountInfo = this.filterUserInfo(user);
    const token = await this.authService.signToken(user);
    return { token, accountInfo };
  }

  @PutAuth('/', 'Change user info')
  async updateUser(@Body() updateUserDto: UpdateUserDto, @User('id') userId) {
    await this.userService.updateUser(userId, updateUserDto);
  }

  @ApiPagination('/', 'Fetch all users')
  async fetchAllUsers(
    @Pagination() paginationOption: PaginationOption,
    @User('id') loggedInUserId,
  ) {
    return await this.userService.fetchAll(paginationOption, loggedInUserId);
  }

  @ApiTags('Get single user detail')
  @Get('/:id')
  async fetchSingleUser(
    @Param('id') userId: string,
    @User('id') loggedInUserId,
  ) {
    return await this.userService.fetchOne(userId, loggedInUserId);
  }

  @PostAuth('/rate', 'Rate instructor')
  async rateUser(@Body() rateDto: RateDto, @User('id') userId) {
    rateDto.userId = userId;
    await this.userService.rate(rateDto);
  }

  @PostAuth('/cancel-rate', 'Cancel instructor rating')
  async cancelUserRating(
    @Body() cancelRateDto: CancelRateDto,
    @User('id') userId,
  ) {
    cancelRateDto.userId = userId;
    await this.userService.cancelRate(cancelRateDto);
  }

  filterUserInfo(user: UserDocument) {
    const { _id, firstName, lastName, phone, profilePicture, role } = user;
    return { _id, firstName, lastName, phone, profilePicture, role };
  }
}
