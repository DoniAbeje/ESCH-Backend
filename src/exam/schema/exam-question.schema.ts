import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ExamQuestionDocument = ExamQuestion & Document;

@Schema()
export class ExamQuestion {
  @Prop({ required: true })
  question: string;

  @Prop({ type: [{ key: String, choice: String }], minlength: 1 })
  choice: object[];

  @Prop()
  explanation: string;

  @Prop({ required: true })
  correctAnswer: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  examId: string;
}

export const ExamQuestionSchema = SchemaFactory.createForClass(ExamQuestion);
