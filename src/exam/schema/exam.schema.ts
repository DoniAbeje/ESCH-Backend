import { User } from './../../user/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Rating } from '../../common/schemas/rating.schema';

export type ExamDocument = Exam & Document;
export enum ExamStatus {
  DRAFT,
  PUBLISHED,
}

@Schema()
export class Exam extends Rating {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 0, min: 0 })
  price: number;

  @Prop({ type: [String], minlength: 1 })
  tags: string[];

  @Prop({ type: [String], default: [] })
  samples: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  preparedBy: User;

  @Prop({ default: ExamStatus.DRAFT })
  status: ExamStatus = ExamStatus.DRAFT;

  @Prop({ default: null })
  coverImage: string;
  
  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ExamSchema = SchemaFactory.createForClass(Exam);
ExamSchema.index({ title: 'text', description: 'text', tags: 'text' });
