import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { ExamStatus } from '../schema/exam.schema';

export class UpdateExamDto {
  @IsString()
  @IsOptional()
  readonly title?: string;

  @IsString()
  @IsOptional()
  readonly description?: string;

  @IsOptional()
  @Min(0)
  readonly price?: number;

  @IsOptional()
  @ArrayMinSize(1)
  readonly tags?: string[];

  @IsUrl()
  @IsOptional()
  readonly coverImage?: string;

  @IsOptional()
  readonly samples?: string[];

  /**
   * 0 for DRAFT
   * 1 for PUBLISHED
   */
  @IsOptional()
  @ApiProperty({ enum: [ExamStatus.DRAFT, ExamStatus.PUBLISHED] })
  readonly status?: ExamStatus;
}
