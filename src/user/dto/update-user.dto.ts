import { IsString, IsOptional, IsUrl, ArrayMinSize } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  readonly firstName?: string;

  @IsString()
  @IsOptional()
  readonly lastName?: string;

  @IsUrl()
  @IsOptional()
  readonly profilePicture?: string;

  @ArrayMinSize(1)
  @IsOptional()
  readonly preferredTags?: string[];
}
