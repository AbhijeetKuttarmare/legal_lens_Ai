import { IsEnum } from 'class-validator';

export enum PayablePlanDto {
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export class CreateOrderDto {
  @IsEnum(PayablePlanDto)
  plan: PayablePlanDto;
}
