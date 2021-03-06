import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Vote } from '../../common/schemas/vote.schema';

export type QuestionDocument = Question & Document;

@Schema()
export class Question extends Vote {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true, ref: 'User' })
  askedBy: string;

  @Prop({ type: [String], minlength: 1 })
  tags: string[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
QuestionSchema.index({ question: 'text', tags: 'text' });
