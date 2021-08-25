import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EnrolledExamDocument = EnrolledExam & Document;
@Schema({ _id: false })
class ExamAnswer {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  answer: string;
}

const ExamAnswerSchema = SchemaFactory.createForClass(ExamAnswer);
@Schema()
export class EnrolledExam {
  @Prop({ required: true, ref: 'Exam' })
  examId: string;

  @Prop({ required: true, ref: 'User' })
  userId: string;

  @Prop({ type: [ExamAnswerSchema], default: [] })
  answers: ExamAnswer[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const EnrolledExamSchema = SchemaFactory.createForClass(EnrolledExam);
