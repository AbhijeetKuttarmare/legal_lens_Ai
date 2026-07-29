import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-order')
  createOrder(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateOrderDto,
  ) {
    return this.paymentsService.createOrder(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  verifyPayment(
    @CurrentUser() user: { userId: string },
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(user.userId, dto);
  }

  // Called by Razorpay's servers directly (no user JWT) — authenticated via
  // HMAC signature instead, so plan upgrades still happen even if the app
  // crashes or loses network right after a successful payment.
  @Post('webhook')
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }
}
