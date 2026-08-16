import { IsIn, IsInt, Max, Min } from 'class-validator';

export const SEAT_TIER_KEYS = ['STANDARD', 'PREMIUM'] as const;
export type SeatTierKey = (typeof SEAT_TIER_KEYS)[number];

export class GrantTeamDto {
  @IsIn(SEAT_TIER_KEYS)
  seatTier: SeatTierKey;

  @IsInt()
  @Min(2)
  @Max(150)
  seatCount: number;
}
