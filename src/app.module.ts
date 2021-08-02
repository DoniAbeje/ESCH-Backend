import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { QaModule } from './qa/qa.module';
import { ExamModule } from './exam/exam.module';
import { CommonModule } from './common/common.module';
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
    ExamModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
