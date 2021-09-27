import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionService } from './question.service';
import { Answer, AnswerSchema } from './schema/answer.schema';
import { Question, QuestionSchema } from './schema/question.schema';
import { QaController } from './qa.controller';
import { AnswerService } from './answer.service';
import { QaTestHelperService } from './test-helper.service';
import { QuestionRecommendationService } from './question-recommendation.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: Answer.name, schema: AnswerSchema },
    ]),
    UserModule,
  ],
  providers: [
    QuestionService,
    AnswerService,
    QaTestHelperService,
    QuestionRecommendationService,
  ],
  controllers: [QaController],
  exports: [QaTestHelperService, QuestionService, AnswerService],
})
export class QaModule {}
