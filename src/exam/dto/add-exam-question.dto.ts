import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

class Choice {
  @IsString()
  key: string;

  @IsString()
  choice: string;
}

export class AddExamQuestionDto {
  @IsString()
  readonly question: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Choice)
  readonly choice: Choice[];

  @IsString()
  readonly explanation: string;

  @IsString()
  readonly correctAnswer: string;

  @IsString()
  readonly examId: string;
}
