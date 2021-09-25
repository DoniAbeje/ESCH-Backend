import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  Matches,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { TagScore, UserRole } from '../schemas/user.schema';

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
  readonly profilePicture?: string;

  /**
   * 1 for Student
   * 2 for Instructor
   */
  @ApiProperty({
    enum: [UserRole.STUDENT.toString(), UserRole.INSTRUCTOR.toString()],
  })
  @IsOptional()
  readonly role?: UserRole = UserRole.STUDENT;

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
