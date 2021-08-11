import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ExamQuestionDocument = ExamQuestion & Document;

@Schema({ _id: false })
class Choice {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  userId: string;

  @Prop({ default: 0 })
  stars: number;

  @Prop()
  review: string;
}

export const ChoiceSchema = SchemaFactory.createForClass(Choice);
@Schema()
export class ExamQuestion {
  @Prop({ required: true })
  question: string;

  @Prop({ type: [ChoiceSchema], minlength: 1 })
  choice: Choice[];

  @Prop()
  explanation: string;

  @Prop({ required: true })
  correctAnswer: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  examId: string;
}

export const ExamQuestionSchema = SchemaFactory.createForClass(ExamQuestion);
