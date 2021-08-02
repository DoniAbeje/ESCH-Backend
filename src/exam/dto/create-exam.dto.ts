import { ApiHideProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateExamDto {
  @IsString()
  readonly title: string;

  @IsString()
  readonly description: string;

  @IsNumber()
  readonly price: number;

  @ArrayMinSize(1)
  readonly tags: string[];

  @IsOptional()
  @IsArray()
  readonly samples: string[];

  @ApiHideProperty()
  preparedBy: string;
}
