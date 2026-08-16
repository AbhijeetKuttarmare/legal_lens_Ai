import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export const PLAN_KEYS = ['FREE', 'PRO', 'ENTERPRISE'] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export class SetPlanDto {
  @IsIn(PLAN_KEYS)
  plan: PlanKey;

  // null/omitted = permanent (no auto-revert), N = reverts to Free after N days
  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number | null;
}
