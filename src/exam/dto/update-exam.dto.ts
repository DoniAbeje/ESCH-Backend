import { ArrayMinSize, IsOptional, IsString, Min } from 'class-validator';

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

}
