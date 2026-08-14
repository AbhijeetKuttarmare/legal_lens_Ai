import { IsString } from 'class-validator';

export class VerifySubscriptionDto {
  @IsString()
  razorpaySubscriptionId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;
}
