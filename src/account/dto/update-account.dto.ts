import { IsString, IsOptional } from 'class-validator';

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  readonly firstName: string;

  @IsString()
  @IsOptional()
  readonly lastName: string;
}
