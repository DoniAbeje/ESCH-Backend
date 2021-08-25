import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
class Answer {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  answer: string;
}

@Schema()
export class EnrolledExam {
  @Prop({ required: true, ref: 'Exam' })
  exam: string;

  @Prop({ required: true, ref: 'User' })
  student: string;

  @Prop({ type: [Answer], default: [] })
  answers: Answer[];

  @Prop({ default: Date.now })
  createdAt: Date;
}
