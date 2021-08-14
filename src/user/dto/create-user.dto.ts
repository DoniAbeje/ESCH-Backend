import { IsOptional, IsString, IsUrl, MinLength, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  readonly firstName: string;

  @IsString()
  readonly lastName: string;

  @Matches(/^09\d{8}/, { message: 'phone must be in the format 09xxxxxxxx' })
  readonly phone: string;

  @MinLength(8)
  readonly password: string;

  @IsUrl()
  @IsOptional()
  readonly profilePicture?: string
}
