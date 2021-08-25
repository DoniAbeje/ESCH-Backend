import { User } from './../../user/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ExamDocument = Exam & Document;
export enum ExamStatus {
  DRAFT,
  PUBLISHED,
}

@Schema({ _id: false })
class Rating {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  userId: string;

  @Prop({ default: 0 })
  stars: number;

  @Prop()
  review: string;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);
@Schema()
export class Exam {
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

  @Prop({ type: [RatingSchema], default: [] })
  ratings: Rating[];

  @Prop({ default: ExamStatus.DRAFT })
  status: ExamStatus = ExamStatus.DRAFT;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ExamSchema = SchemaFactory.createForClass(Exam);
