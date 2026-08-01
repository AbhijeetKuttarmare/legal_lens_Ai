import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { toSafeUser } from './user.presenter';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toSafeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        gender: dto.gender,
        dob: new Date(dto.dob),
        name: `${dto.firstName} ${dto.lastName}`,
      },
    });

    this.auditLog.record({
      actorType: 'USER',
      actorId: userId,
      actorLabel: user.name || user.email || user.phone || userId,
      action: 'UPDATE_PROFILE',
      targetType: 'User',
      targetId: userId,
    });

    return toSafeUser(user);
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const documents = await this.prisma.document.findMany({
      where: { userId },
      select: { storagePath: true },
    });
    await this.prisma.user.delete({ where: { id: userId } });
    for (const doc of documents) {
      fs.unlink(doc.storagePath, () => {});
    }

    this.auditLog.record({
      actorType: 'USER',
      actorId: null, // the User row is gone; keep the label as the only record
      actorLabel: user?.name || user?.email || user?.phone || userId,
      action: 'DELETE_ACCOUNT',
      targetType: 'User',
      targetId: userId,
    });

    return { success: true };
  }
}
