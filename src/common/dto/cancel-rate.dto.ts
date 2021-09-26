import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class CancelRateDto {
  @IsString()
  readonly rateableResourceId: string;

  @ApiHideProperty()
  userId: string;
}
