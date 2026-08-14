import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PAID_PLANS = ['PRO', 'ENTERPRISE'];

export type FeatureTrialField =
  | 'compareTrialUntil'
  | 'templatesTrialUntil'
  | 'exportTrialUntil'
  | 'chatTrialUntil';

@Injectable()
export class PlanGuardService {
  constructor(private readonly prisma: PrismaService) {}

  async hasPaidAccess(userId: string, trialField?: FeatureTrialField): Promise<boolean> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (PAID_PLANS.includes(user.plan)) return true;
    if (trialField) {
      const expiresAt = user[trialField];
      if (expiresAt && expiresAt.getTime() > Date.now()) return true;
    }
    return false;
  }

  async requirePaidPlan(userId: string, featureLabel: string, trialField?: FeatureTrialField): Promise<void> {
    const ok = await this.hasPaidAccess(userId, trialField);
    if (!ok) {
      throw new ForbiddenException(
        `${featureLabel} is available on the Pro and Enterprise plans, or during a trial. Upgrade to unlock it.`,
      );
    }
  }
}
