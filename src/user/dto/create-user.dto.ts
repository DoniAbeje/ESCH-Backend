import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  readonly firstName: string;

  @IsString()
  readonly lastName: string;

  @IsString()
  readonly phone: string;

  @IsString()
  @MinLength(5)
  readonly password: string;

  @IsUrl()
  @IsOptional()
  readonly profilePicture?: string
}
