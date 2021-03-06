import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ExamQuestionDocument = ExamQuestion & Document;

@Schema({ _id: false })
class Choice {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  choice: string;
}

export const ChoiceSchema = SchemaFactory.createForClass(Choice);
@Schema({ autoIndex: true })
export class ExamQuestion {
  @Prop({ required: true })
  question: string;

  @Prop({ type: [ChoiceSchema], minlength: 1 })
  choices: Choice[];

  @Prop()
  explanation: string;

  @Prop({ required: true })
  correctAnswer: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  examId: string;
}

export const ExamQuestionSchema = SchemaFactory.createForClass(ExamQuestion);

ExamQuestionSchema.index({ question: 1, examId: 1 }, { unique: true });
