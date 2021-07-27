import { Prop, Schema } from '@nestjs/mongoose';


@Schema()
export class Vote {
   @Prop({ type: [String], default: [] })
  upvotes: string[];

  @Prop({ type: [String], default: [] })
  downvotes: string[];

}
