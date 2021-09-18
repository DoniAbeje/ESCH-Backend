import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class RatingDetail {
  @Prop({ default: 1 })
  rating: number;

  @Prop({ required: true })
  userId: string;
}
export const RatingDetailSchema = SchemaFactory.createForClass(RatingDetail);

@Schema()
export class Rating {
  @Prop({ type: [RatingDetailSchema], default: [] })
  ratings: RatingDetail[];
}

