import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class RateDto {
  @IsInt()
  @Min(1)
  @Max(5)
  readonly rating: number;

  @IsString()
  readonly rateableResourceId: string;

  @ApiHideProperty()
  userId: string;
}
