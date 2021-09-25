import { ApiHideProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsUrl,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { TagScore } from '../schemas/user.schema';

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

  @IsArray()
  @IsOptional()
  readonly preferredTags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagScore)
  @IsOptional()
  @ApiHideProperty()
  preferredTagsScore?: TagScore[];
}
