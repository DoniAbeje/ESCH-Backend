import { Matches, MinLength } from 'class-validator';

export class LoginDto {
  @Matches(/^09\d{8}/, { message: 'phone must be in the format 09xxxxxxxx' })
  readonly phone: string;

  @MinLength(5)
  readonly password: string;
}
