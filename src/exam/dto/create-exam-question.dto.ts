import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

class Choice {
  @IsString()
  userId: string;

  @IsNumber()
  stars: number;

  @IsString()
  review: string;
}

export class CreateExamDto {
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
