import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QaService } from './qa.service';
import { Answer, AnswerSchema } from './schema/answer.schema';
import { Question, QuestionSchema } from './schema/question.schema';
import { QaController } from './qa.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: Answer.name, schema: AnswerSchema },
    ]),
  ],
  providers: [QaService],
  controllers: [QaController],
})
export class QaModule {}
