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
import {
  EnrolledExam,
  EnrolledExamSchema,
} from './schema/enrolled-exam.schema';
import { ExamEnrollmentService } from './exam-enrollment.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exam.name, schema: ExamSchema },
      { name: ExamQuestion.name, schema: ExamQuestionSchema },
      { name: EnrolledExam.name, schema: EnrolledExamSchema },
    ]),
  ],
  providers: [ExamService, ExamQuestionService, ExamEnrollmentService],
  controllers: [ExamController],
})
export class ExamModule {}
