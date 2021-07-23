import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionService } from './question.service';
import { Answer, AnswerSchema } from './schema/answer.schema';
import { Question, QuestionSchema } from './schema/question.schema';
import { QaController } from './qa.controller';
import { AnswerService } from './answer.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: Answer.name, schema: AnswerSchema },
    ]),
  ],
  providers: [QuestionService, AnswerService],
  controllers: [QaController],
})
export class QaModule {}
