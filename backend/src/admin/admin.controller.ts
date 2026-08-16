import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { ListQueryDto } from './dto/list-query.dto';
import { SetTrialLimitDto } from './dto/set-trial-limit.dto';
import { SetFeatureTrialDto } from './dto/set-feature-trial.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { SetPlanDto } from './dto/set-plan.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(@Query() query: ListQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Get('documents')
  listDocuments(@Query() query: ListQueryDto) {
    return this.adminService.listDocuments(query);
  }

  @Get('payments')
  listPayments(@Query() query: ListQueryDto) {
    return this.adminService.listPayments(query);
  }

  @Get('reviews')
  listReviews(@Query() query: ListQueryDto) {
    return this.adminService.listReviews(query);
  }

  @Get('audit-log')
  listAuditLog(@Query() query: ListQueryDto) {
    return this.adminService.listAuditLog(query);
  }

  @Get('exceptions')
  listExceptions(@Query() query: ListQueryDto) {
    return this.adminService.listErrorLogs(query);
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Patch('users/:id/toggle-admin')
  toggleAdmin(@CurrentUser() admin: { userId: string }, @Param('id') targetUserId: string) {
    return this.adminService.toggleAdminStatus(admin.userId, targetUserId);
  }

  @Get('subscriptions')
  listSubscriptions(@Query() query: ListQueryDto) {
    return this.adminService.listSubscriptions(query);
  }

  @Patch('users/:id/trial')
  setTrialLimit(
    @CurrentUser() admin: { userId: string },
    @Param('id') targetUserId: string,
    @Body() dto: SetTrialLimitDto,
  ) {
    return this.adminService.setTrialLimit(admin.userId, targetUserId, dto.trialDocumentLimit);
  }

  @Patch('users/:id/feature-trial')
  setFeatureTrial(
    @CurrentUser() admin: { userId: string },
    @Param('id') targetUserId: string,
    @Body() dto: SetFeatureTrialDto,
  ) {
    return this.adminService.setFeatureTrial(admin.userId, targetUserId, dto.feature, dto.days);
  }

  @Patch('users/:id/plan')
  setPlan(
    @CurrentUser() admin: { userId: string },
    @Param('id') targetUserId: string,
    @Body() dto: SetPlanDto,
  ) {
    return this.adminService.setPlanOverride(admin.userId, targetUserId, dto.plan, dto.days);
  }

  @Get('otp-log')
  listOtpLog(@Query() query: ListQueryDto) {
    return this.adminService.listOtpLog(query);
  }

  @Patch('users/:id/toggle-ban')
  toggleBan(
    @CurrentUser() admin: { userId: string },
    @Param('id') targetUserId: string,
    @Body() dto: BanUserDto,
  ) {
    return this.adminService.toggleBanStatus(admin.userId, targetUserId, dto.reason);
  }

  @Delete('users/:id')
  deleteUser(@CurrentUser() admin: { userId: string }, @Param('id') targetUserId: string) {
    return this.adminService.deleteUser(admin.userId, targetUserId);
  }
}
