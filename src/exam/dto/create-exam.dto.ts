import { ApiHideProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsOptional, IsString, IsUrl, Min } from 'class-validator';

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

  @IsUrl()
  @IsOptional()
  readonly coverImage?: string;
  
  @ApiHideProperty()
  preparedBy: string;
}
