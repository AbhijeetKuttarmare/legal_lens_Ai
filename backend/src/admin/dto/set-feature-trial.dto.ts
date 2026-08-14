import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export const FEATURE_TRIAL_KEYS = ['COMPARE', 'TEMPLATES', 'EXPORT', 'CHAT'] as const;
export type FeatureTrialKey = (typeof FEATURE_TRIAL_KEYS)[number];

export class SetFeatureTrialDto {
  @IsIn(FEATURE_TRIAL_KEYS)
  feature: FeatureTrialKey;

  // null/omitted = clear the trial, N = grant access for N days from now
  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number | null;
}
