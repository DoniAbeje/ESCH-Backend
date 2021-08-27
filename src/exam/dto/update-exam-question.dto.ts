import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Choice } from './add-exam-question.dto';

export class UpdateExamQuestionDto {
  @IsString()
  @IsOptional()
  readonly question?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Choice)
  @IsOptional()
  readonly choices?: Choice[];

  @IsString()
  @IsOptional()
  readonly explanation?: string;

  @IsString()
  @IsOptional()
  readonly correctAnswer?: string;
}
