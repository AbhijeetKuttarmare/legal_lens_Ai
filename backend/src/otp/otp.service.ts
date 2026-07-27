import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';

interface OtpSession {
  sessionId: string;
  expiresAt: number;
}

const SESSION_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class OtpService {
  private sessions = new Map<string, OtpSession>();

  private get apiKey(): string {
    const key = process.env.TWOFACTOR_API_KEY;
    if (!key) {
      throw new InternalServerErrorException(
        'TWOFACTOR_API_KEY is not set on the backend',
      );
    }
    return key;
  }

  private fullNumber(tenDigitPhone: string): string {
    return `91${tenDigitPhone}`;
  }

  // Google Play reviewers can't receive real SMS OTPs sent to an arbitrary
  // number. This lets us hand reviewers one fixed phone/code pair that bypasses
  // the real 2Factor.in flow, without affecting real users' sign-in.
  private isReviewBypass(tenDigitPhone: string): boolean {
    return Boolean(
      process.env.REVIEW_TEST_PHONE && tenDigitPhone === process.env.REVIEW_TEST_PHONE,
    );
  }

  async sendOtp(tenDigitPhone: string): Promise<void> {
    if (this.isReviewBypass(tenDigitPhone)) {
      this.sessions.set(tenDigitPhone, {
        sessionId: 'review-bypass',
        expiresAt: Date.now() + SESSION_TTL_MS,
      });
      return;
    }

    const url = `https://2factor.in/API/V1/${this.apiKey}/SMS/${this.fullNumber(tenDigitPhone)}/AUTOGEN`;
    const res = await fetch(url);
    const data = (await res.json()) as { Status: string; Details: string };

    if (data.Status !== 'Success') {
      throw new BadRequestException(
        `Failed to send OTP: ${data.Details || 'Unknown error from SMS provider'}`,
      );
    }

    this.sessions.set(tenDigitPhone, {
      sessionId: data.Details,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
  }

  async verifyOtp(tenDigitPhone: string, code: string): Promise<boolean> {
    const session = this.sessions.get(tenDigitPhone);
    if (!session || session.expiresAt < Date.now()) {
      throw new BadRequestException('OTP expired or not requested. Please request a new OTP.');
    }

    if (this.isReviewBypass(tenDigitPhone)) {
      if (code === process.env.REVIEW_TEST_OTP) {
        this.sessions.delete(tenDigitPhone);
        return true;
      }
      return false;
    }

    const url = `https://2factor.in/API/V1/${this.apiKey}/SMS/VERIFY/${session.sessionId}/${code}`;
    const res = await fetch(url);
    const data = (await res.json()) as { Status: string; Details: string };

    if (data.Status === 'Success') {
      this.sessions.delete(tenDigitPhone);
      return true;
    }
    return false;
  }
}
