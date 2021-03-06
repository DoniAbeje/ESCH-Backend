import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnswerDocument = Answer & Document;

@Schema()
export class Answer {
  @Prop({ required: true })
  answer: string;

  @Prop({ required: true })
  question: string;

  @Prop({ type: String, required: true, ref: 'User' })
  answeredBy: string;

  @Prop({ type: [String], default: [] })
  upvotes: string[];

  @Prop({ type: [String], default: [] })
  downvotes: string[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);
