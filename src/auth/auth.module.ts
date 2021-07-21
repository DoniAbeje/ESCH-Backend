import { JwtStrategyWithBearerToken } from './strategies/jwt.strategy';
import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('ESCH_JWT_SECRET_KEY'),
        signOptions: {
          expiresIn: configService.get<number>('ESCH_JWT_TOKEN_EXPIRE_TIME'),
        },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => UserModule),
  ],
  providers: [JwtStrategyWithBearerToken, AuthService, LocalStrategy],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
