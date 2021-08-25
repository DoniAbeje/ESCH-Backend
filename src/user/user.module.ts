import { AuthModule } from './../auth/auth.module';
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserTestHelperService } from './test-helper.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService, UserTestHelperService],
  exports: [UserService, UserTestHelperService, MongooseModule],
})
export class UserModule {}
