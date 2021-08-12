import { ExamController } from './exam.controller';
import { ExamQuestionService } from './exam-question.service';
import { ExamService } from './exam.service';
import {
  ExamQuestion,
  ExamQuestionSchema,
} from './schema/exam-question.schema';
import { Exam, ExamSchema } from './schema/exam.schema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exam.name, schema: ExamSchema },
      { name: ExamQuestion.name, schema: ExamQuestionSchema },
    ]),
  ],
  providers: [ExamService, ExamQuestionService],
  controllers: [ExamController],
})
export class ExamModule {}