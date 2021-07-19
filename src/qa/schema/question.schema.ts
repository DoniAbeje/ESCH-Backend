import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Answer } from './answer.schema';

export type QuestionDocument = Question & Document;

@Schema()
export class Question {
  @Prop({ required: true })
  question: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  askedBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: [String], minlength: 1 })
  tags: string[];

  @Prop({ default: [] })
  upvotes: string[];

  @Prop({ default: [] })
  downvotes: string[];

  @Prop({ type: Answer, default: [] })
  answers: Answer[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
