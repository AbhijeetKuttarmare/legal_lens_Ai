import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum GenderDto {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class UpdateProfileDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsEnum(GenderDto)
  gender: GenderDto;

  @IsDateString()
  dob: string;

  @IsOptional()
  @IsString()
  occupation?: string;
}
