import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum SeatTierDto {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export class CreateOrganizationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsEnum(SeatTierDto)
  seatTier: SeatTierDto;

  @IsInt()
  @Min(2)
  @Max(150)
  seatCount: number;
}
