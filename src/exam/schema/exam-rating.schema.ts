import { Exam } from './exam.schema';
import { User } from './../../user/schemas/user.schema';
import { Prop, Schema } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ExamRatingDocument = ExamRating & Document;

@Schema()
export class ExamRating {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Exam', required: true })
  exam: Exam;

  @Prop({ required: true })
  rating: number;

  @Prop({ default: Date.now })
  createdAt: Date;
}
