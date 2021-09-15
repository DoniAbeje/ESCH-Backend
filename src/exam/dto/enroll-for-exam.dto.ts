import { ApiHideProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class EnrollForExamDto {
  @IsString()
  readonly exam: string;

  @ApiHideProperty()
  examinee: string;
}
