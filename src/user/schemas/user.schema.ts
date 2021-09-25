import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Rating } from '../../common/schemas/rating.schema';

export type UserDocument = User & Document;
export enum UserRole {
  ADMIN = 0,
  STUDENT = 1,
  INSTRUCTOR = 2,
}

@Schema({ _id: false })
export class TagScore {
  @Prop({ required: true })
  tag: string;

  @Prop({ required: true })
  score: number;
}

const TagScoreSchema = SchemaFactory.createForClass(TagScore);

@Schema()
export class User extends Rating {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: UserRole.STUDENT })
  role: UserRole;

  @Prop({ default: null })
  profilePicture: string;

  @Prop({ type: [TagScoreSchema], default: [] })
  preferredTagsScore: TagScore[];

  @Prop({ default: Date.now })
  createdDate: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
