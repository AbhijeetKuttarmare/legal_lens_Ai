import { IsEnum, IsString } from 'class-validator';
import { PayablePlanDto } from './create-order.dto';

export class VerifyPaymentDto {
  @IsString()
  razorpayOrderId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;

  @IsEnum(PayablePlanDto)
  plan: PayablePlanDto;
}
