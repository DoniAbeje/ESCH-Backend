import { IsString } from 'class-validator';

export class AnswerExamQuestionDto {
  @IsString()
  readonly questionId: string;

  @IsString()
  readonly examId: string;

  @IsString()
  readonly answer: string;
}
