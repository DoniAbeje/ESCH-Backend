import { ApiHideProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AnswerQuestionDto {
  @IsString()
  readonly answer: string;

  @ApiHideProperty()
  answeredBy: string;

  @ApiHideProperty()
  question: string;
}
