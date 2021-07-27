import { ApiHideProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsString } from 'class-validator';

export class RaiseQuestionDto {
  @IsString()
  readonly question: string;

  @ArrayMinSize(1)
  readonly tags: string[];

  @ApiHideProperty()
  askedBy: string;
}
