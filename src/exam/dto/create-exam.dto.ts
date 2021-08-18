import { ApiHideProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateExamDto {
  @IsString()
  readonly title: string;

  @IsString()
  readonly description: string;

  @IsOptional()
  @Min(0)
  readonly price?: number;

  @ArrayMinSize(1)
  readonly tags: string[];

  @ApiHideProperty()
  preparedBy: string;
}
