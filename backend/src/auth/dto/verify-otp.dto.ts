import { Matches } from 'class-validator';

export class VerifyOtpDto {
  @Matches(/^[6-9]\d{9}$/, {
    message: 'phone must be a valid 10-digit Indian mobile number',
  })
  phone: string;

  @Matches(/^\d{4,8}$/, { message: 'code must be a 4-8 digit OTP' })
  code: string;
}
