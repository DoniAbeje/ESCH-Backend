import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { QaModule } from './qa/qa.module';
import { CommonModule } from './common/common.module';
import { ExamModule } from './exam/exam.module';
import { APP_GUARD } from '@nestjs/core';
import { OptionalJwtAuthGuard } from './auth/guards/optional-jwt-auth.guard';
@Module({
  imports: [
    QaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('ESCH_DB_CONNECTION'),
        useCreateIndex: true,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    CommonModule,
    ExamModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: OptionalJwtAuthGuard },
  ],
})
export class AppModule {}
