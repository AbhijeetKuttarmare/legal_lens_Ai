import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { VerifySubscriptionDto } from './dto/verify-subscription.dto';
import { AddMemberDto } from './dto/add-member.dto';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  getMyOrganization(@CurrentUser() user: { userId: string }) {
    return this.organizationsService.getMyOrganization(user.userId);
  }

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.createOrganization(user.userId, dto);
  }

  @Post('verify')
  verify(@CurrentUser() user: { userId: string }, @Body() dto: VerifySubscriptionDto) {
    return this.organizationsService.verifySubscription(user.userId, dto);
  }

  @Post('members')
  addMember(@CurrentUser() user: { userId: string }, @Body() dto: AddMemberDto) {
    return this.organizationsService.addMember(user.userId, dto);
  }

  @Delete('members/:userId')
  removeMember(@CurrentUser() user: { userId: string }, @Param('userId') targetUserId: string) {
    return this.organizationsService.removeMember(user.userId, targetUserId);
  }
}
