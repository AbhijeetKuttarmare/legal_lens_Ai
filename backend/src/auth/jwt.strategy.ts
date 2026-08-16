import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-me',
    });
  }

  // Re-checked from the DB on every request (not just at login) so a ban
  // takes effect immediately, even for a token issued before the ban and
  // still within its 7-day validity window.
  async validate(payload: { sub: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isBanned: true, plan: true, planExpiresAt: true },
    });
    if (!user) {
      throw new UnauthorizedException('Account not found');
    }
    if (user.isBanned) {
      throw new UnauthorizedException(
        'Your account has been suspended by the organization. Contact support if you believe this is a mistake.',
      );
    }
    // Admin-granted temporary plans (e.g. a 3-day Pro trial) revert to Free
    // the moment they expire — checked here rather than a cron job so it
    // takes effect on the user's very next request, same as the ban check.
    if (user.planExpiresAt && user.planExpiresAt.getTime() <= Date.now() && user.plan !== 'FREE') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { plan: 'FREE', planExpiresAt: null },
      });
    }
    return { userId: payload.sub };
  }
}
