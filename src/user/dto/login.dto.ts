import { IsString, MinLength } from "class-validator";

export class LoginDto {
    @IsString()
    readonly phone: string;
  
    @IsString()
    @MinLength(5)
    readonly password: string;
}