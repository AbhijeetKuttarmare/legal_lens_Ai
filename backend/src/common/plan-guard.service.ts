import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PAID_PLANS = ['PRO', 'ENTERPRISE'];

@Injectable()
export class PlanGuardService {
  constructor(private readonly prisma: PrismaService) {}

  async requirePaidPlan(userId: string, featureLabel: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!PAID_PLANS.includes(user.plan)) {
      throw new ForbiddenException(
        `${featureLabel} is available on the Pro and Enterprise plans. Upgrade to unlock it.`,
      );
    }
  }
}
