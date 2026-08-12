import { IsEnum, IsString } from 'class-validator';
import { CreditPackDto } from './create-credit-order.dto';

export class VerifyCreditOrderDto {
  @IsString()
  razorpayOrderId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;

  @IsEnum(CreditPackDto)
  pack: CreditPackDto;
}
