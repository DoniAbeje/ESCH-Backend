import { ApiHideProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsOptional, IsString } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  readonly question?: string;

  @IsOptional()
  @ArrayMinSize(1)
  readonly tags?: string[];

}
