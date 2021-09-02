import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExamSaleDocument = ExamSale & Document;

export enum ExamSaleStatus {
  PENDING,
  COMPLETE,
}

@Schema()
export class ExamSale {
  @Prop({ required: true, ref: 'Exam' })
  exam: string;

  @Prop({ required: true, ref: 'User' })
  buyer: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: ExamSaleStatus.PENDING })
  status: ExamSaleStatus;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ExamSaleSchema = SchemaFactory.createForClass(ExamSale);
