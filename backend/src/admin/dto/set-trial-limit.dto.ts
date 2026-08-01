import { IsInt, IsOptional, Min } from 'class-validator';

export class SetTrialLimitDto {
  // null/omitted = clear override, -1 = unlimited, N = exact document cap
  @IsOptional()
  @IsInt()
  @Min(-1)
  trialDocumentLimit?: number | null;
}
