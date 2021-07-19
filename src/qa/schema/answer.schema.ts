import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AnswerDocument = Answer & Document;

@Schema()
export class Answer {
  @Prop({ required: true })
  answer: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  answeredBy: MongooseSchema.Types.ObjectId;

  @Prop({ default: []})
  upvotes: string[];

  @Prop({ default: []})
  downvotes: string[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);
