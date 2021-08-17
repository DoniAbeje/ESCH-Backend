import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;
export enum UserRole {
  ADMIN,
  INSTRUCTOR,
  STUDENT,
}

@Schema()
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: UserRole.STUDENT })
  role: UserRole

  @Prop({ default: null })
  profilePicture: string;

  @Prop({ default: Date.now })
  createdDate: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
