import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

export class Choice {
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
  readonly choices: Choice[];

  @IsString()
  readonly explanation: string;

  @IsString()
  readonly correctAnswer: string;

  @IsString()
  readonly examId: string;
}
